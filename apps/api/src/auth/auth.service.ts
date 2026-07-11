import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserRole } from '@zivara/shared';
import { AuthRepository } from './auth.repository';
import { EmailService } from '../common/email/email.service';
import type { RegisterProfessionalDto } from './dto/register-professional.dto';
import type { RegisterEmployerDto } from './dto/register-employer.dto';
import type { LoginDto } from './dto/login.dto';
import type { ChangePasswordDto } from './dto/change-password.dto';
import type { JwtPayload } from './interfaces/jwt-payload.interface';

const BCRYPT_COST = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 30;
const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;
const RESET_TOKEN_EXPIRY_HOURS = 1;

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: { id: string; email: string; role: string; employerId?: string };
}

export interface RegisterResponse {
  message: string;
  requiresEmailVerification: boolean;
}

function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function generateRawToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

@Injectable()
export class AuthService {
  private readonly skipEmailVerification =
    process.env['SKIP_EMAIL_VERIFICATION'] === 'true' ||
    process.env['NODE_ENV'] === 'development';

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  // ─── Registration ─────────────────────────────────────────────────────────

  async registerProfessional(dto: RegisterProfessionalDto): Promise<RegisterResponse> {
    // Check for duplicate email
    const existing = await this.authRepository.findUserByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);

    const user = await this.authRepository.createUser({
      email: dto.email.toLowerCase(),
      passwordHash,
      role: UserRole.Professional,
      languagePreference: 'en',
      isVerifiedEmail: this.skipEmailVerification,
      isActive: true,
    });

    // Create the professional profile row immediately so FK relationships work
    await this.authRepository.createProfessional({
      userId: user.id,
      fullName: dto.fullName,
      phone: dto.phone ?? null,
      primaryIndustry: dto.primaryIndustry ?? null,
    });

    if (!this.skipEmailVerification) {
      await this.sendVerificationEmail(user.id, user.email, 'en');
    }

    await this.authRepository.writeAuditLog(
      user.id,
      'user_registered',
      'user',
      user.id,
      'Professional account created',
      { email: user.email },
    );

    return {
      message: this.skipEmailVerification
        ? 'Account created successfully.'
        : 'Account created. Please check your email to verify your account.',
      requiresEmailVerification: !this.skipEmailVerification,
    };
  }

  async registerEmployer(dto: RegisterEmployerDto): Promise<RegisterResponse> {
    // Check for duplicate email
    const existingUser = await this.authRepository.findUserByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('An account with this email already exists.');
    }

    // Check for duplicate trade license
    const existingEmployer = await this.authRepository.findEmployerByTradeLicense(
      dto.tradeLicenseNumber,
    );
    if (existingEmployer) {
      throw new ConflictException(
        'A company with this trade license number is already registered.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);

    const user = await this.authRepository.createUser({
      email: dto.email.toLowerCase(),
      passwordHash,
      role: UserRole.Employer,
      languagePreference: 'en',
      isVerifiedEmail: this.skipEmailVerification,
      isActive: true,
    });

    const employer = await this.authRepository.createEmployer({
      ownerUserId: user.id,
      companyName: dto.companyName,
      tradeLicenseNumber: dto.tradeLicenseNumber,
      industry: dto.industry,
      operatingCountry: dto.operatingCountry,
      verificationStatus: 'unverified',
      isBadgeVisible: false,
      complianceFlag: false,
    });

    await this.authRepository.createEmployerMember({
      employerId: employer.id,
      userId: user.id,
      role: 'owner',
    });

    if (!this.skipEmailVerification) {
      await this.sendVerificationEmail(user.id, user.email, 'en');
    }

    await this.authRepository.writeAuditLog(
      user.id,
      'employer_registered',
      'employer',
      employer.id,
      'Employer account created',
      { email: user.email, companyName: dto.companyName },
    );

    return {
      message: this.skipEmailVerification
        ? 'Account created successfully.'
        : 'Account created. Please check your email to verify your account.',
      requiresEmailVerification: !this.skipEmailVerification,
    };
  }

  // ─── Email Verification ───────────────────────────────────────────────────

  async verifyEmail(rawToken: string): Promise<void> {
    const tokenHash = hashToken(rawToken);
    const tokenRow = await this.authRepository.findEmailToken(tokenHash, 'email_verification');

    if (!tokenRow) {
      throw new BadRequestException('This verification link is invalid or has expired.');
    }
    if (tokenRow.usedAt) {
      throw new BadRequestException('This verification link has already been used.');
    }
    if (new Date(tokenRow.expiresAt) < new Date()) {
      throw new BadRequestException('This verification link is invalid or has expired.');
    }

    await this.authRepository.updateUser(tokenRow.userId, { isVerifiedEmail: true });
    await this.authRepository.markEmailTokenUsed(tokenRow.id);
  }

  async resendVerification(email: string): Promise<void> {
    const user = await this.authRepository.findUserByEmail(email);
    // Always return success to prevent email enumeration
    if (!user || user.isVerifiedEmail) return;

    await this.sendVerificationEmail(user.id, user.email, user.languagePreference as 'en' | 'ar');
  }

  private async sendVerificationEmail(
    userId: string,
    email: string,
    locale: 'en' | 'ar',
  ): Promise<void> {
    await this.authRepository.invalidatePreviousTokens(userId, 'email_verification');

    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await this.authRepository.createEmailToken({
      userId,
      tokenHash,
      type: 'email_verification',
      expiresAt,
    });

    await this.emailService.sendVerificationEmail(email, rawToken, locale);
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  async login(dto: LoginDto, ip: string): Promise<LoginResponse> {
    const user = await this.authRepository.findUserByEmail(dto.email);

    // Generic error — never reveal which field is wrong
    const invalidCredentials = new UnauthorizedException('Invalid email or password.');

    if (!user) {
      // Don't leak whether email exists
      throw invalidCredentials;
    }

    // Check lockout before attempting password verification
    if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
      throw new HttpException('Too many failed attempts. Please try again in 15 minutes.', 429);
    }

    // Verify password
    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordValid) {
      await this.handleFailedLogin(user.id, user.loginAttempts ?? 0);
      await this.authRepository.writeAuditLog(
        user.id,
        'user_login_failed',
        'user',
        user.id,
        'Invalid password',
        { ip },
      );
      throw invalidCredentials;
    }

    // Check account state AFTER password verification (prevent user enumeration via error type)
    if (user.suspendedAt) {
      throw new ForbiddenException(
        'Your account has been suspended. Please contact support.',
      );
    }

    if (!user.isVerifiedEmail) {
      throw new ForbiddenException(
        'Please verify your email address before logging in.',
      );
    }

    // Reset failed attempts on success
    await this.authRepository.resetLoginAttempts(user.id);

    // Issue tokens
    const { accessToken } = await this.issueTokenPair(user);

    await this.authRepository.writeAuditLog(
      user.id,
      'user_login',
      'user',
      user.id,
      'Successful login',
      { ip },
    );

    return {
      accessToken,
      expiresIn: 900,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  private async handleFailedLogin(userId: string, currentAttempts: number): Promise<void> {
    const newAttempts = currentAttempts + 1;
    await this.authRepository.incrementLoginAttempts(userId);

    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      const lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      await this.authRepository.lockAccount(userId, lockoutUntil);
    }
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  async logout(userId: string, rawRefreshToken: string | undefined): Promise<void> {
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      const tokenRow = await this.authRepository.findRefreshToken(tokenHash);
      if (tokenRow && !tokenRow.revokedAt) {
        await this.authRepository.revokeRefreshToken(tokenRow.id);
      }
    }

    await this.authRepository.writeAuditLog(
      userId,
      'user_logout',
      'user',
      userId,
      'User logged out',
    );
  }

  // ─── Token Refresh ────────────────────────────────────────────────────────

  async refreshTokens(
    rawRefreshToken: string,
  ): Promise<{ accessToken: string; refreshTokenRaw: string }> {
    const tokenHash = hashToken(rawRefreshToken);
    const tokenRow = await this.authRepository.findRefreshToken(tokenHash);

    if (!tokenRow) {
      throw new UnauthorizedException('Session expired. Please log in again.');
    }

    // Reuse detection — if token is already revoked, invalidate ALL user tokens
    if (tokenRow.revokedAt) {
      await this.authRepository.revokeAllUserRefreshTokens(tokenRow.userId);
      await this.authRepository.writeAuditLog(
        tokenRow.userId,
        'refresh_token_reuse_detected',
        'user',
        tokenRow.userId,
        'Revoked refresh token reused — all sessions invalidated',
      );
      throw new UnauthorizedException('Session expired. Please log in again.');
    }

    if (new Date(tokenRow.expiresAt) < new Date()) {
      throw new UnauthorizedException('Session expired. Please log in again.');
    }

    const user = await this.authRepository.findUserById(tokenRow.userId);
    if (!user) {
      throw new UnauthorizedException('Session expired. Please log in again.');
    }

    // Rotate — revoke old, issue new
    await this.authRepository.revokeRefreshToken(tokenRow.id);
    const { accessToken, refreshTokenRaw: newRefreshToken } = await this.issueTokenPair(user);

    return { accessToken, refreshTokenRaw: newRefreshToken };
  }

  // ─── Forgot Password ──────────────────────────────────────────────────────

  async forgotPassword(email: string): Promise<void> {
    const user = await this.authRepository.findUserByEmail(email);

    // Always return success — never reveal whether email exists
    if (!user) return;

    await this.authRepository.invalidatePreviousTokens(user.id, 'password_reset');

    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await this.authRepository.createEmailToken({
      userId: user.id,
      tokenHash,
      type: 'password_reset',
      expiresAt,
    });

    await this.emailService.sendPasswordResetEmail(
      user.email,
      rawToken,
      user.languagePreference as 'en' | 'ar',
    );
  }

  // ─── Reset Password ───────────────────────────────────────────────────────

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = hashToken(rawToken);
    const tokenRow = await this.authRepository.findEmailToken(tokenHash, 'password_reset');

    if (!tokenRow) {
      throw new BadRequestException('This reset link is invalid or has expired.');
    }
    if (tokenRow.usedAt) {
      throw new BadRequestException('This reset link has already been used.');
    }
    if (new Date(tokenRow.expiresAt) < new Date()) {
      throw new BadRequestException('This reset link is invalid or has expired.');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);

    await this.authRepository.updateUser(tokenRow.userId, { passwordHash });
    await this.authRepository.markEmailTokenUsed(tokenRow.id);
    await this.authRepository.revokeAllUserRefreshTokens(tokenRow.userId);

    await this.authRepository.writeAuditLog(
      tokenRow.userId,
      'password_reset',
      'user',
      tokenRow.userId,
      'Password reset via email token',
    );
  }

  // ─── Change Password ──────────────────────────────────────────────────────

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.authRepository.findUserById(userId);
    if (!user) throw new UnauthorizedException('Session expired. Please log in again.');

    const currentPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!currentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    const isSamePassword = await bcrypt.compare(dto.newPassword, user.passwordHash);
    if (isSamePassword) {
      throw new BadRequestException('New password must be different from your current password.');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, BCRYPT_COST);
    await this.authRepository.updateUser(userId, { passwordHash: newPasswordHash });

    // Revoke all other sessions — force re-login on other devices
    await this.authRepository.revokeAllUserRefreshTokens(userId);

    await this.authRepository.writeAuditLog(
      userId,
      'password_changed',
      'user',
      userId,
      'Password changed by user',
    );
  }

  // ─── Current User ─────────────────────────────────────────────────────────

  async getCurrentUser(userId: string): Promise<{
    id: string;
    email: string;
    role: string;
    languagePreference: string;
    isVerifiedEmail: boolean;
    createdAt: Date;
  }> {
    const user = await this.authRepository.findUserById(userId);
    if (!user) throw new UnauthorizedException('Session expired. Please log in again.');

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      languagePreference: user.languagePreference,
      isVerifiedEmail: user.isVerifiedEmail,
      createdAt: user.createdAt,
    };
  }

  // ─── Token Helpers ────────────────────────────────────────────────────────

  private async issueTokenPair(
    user: { id: string; email: string; role: string; },
  ): Promise<{ accessToken: string; refreshTokenRaw: string }> {
    const payload: Partial<JwtPayload> = {
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });

    const refreshTokenRaw = generateRawToken();
    const refreshTokenHash = hashToken(refreshTokenRaw);
    const expiresAt = new Date(
      Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );

    await this.authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt,
    });

    return { accessToken, refreshTokenRaw };
  }

  /** Expose the raw refresh token for cookie-setting in the controller */
  async loginAndGetTokens(
    dto: LoginDto,
    ip: string,
  ): Promise<LoginResponse & { refreshTokenRaw: string }> {
    const user = await this.authRepository.findUserByEmail(dto.email);
    const invalidCredentials = new UnauthorizedException('Invalid email or password.');

    if (!user) throw invalidCredentials;

    if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
      throw new HttpException('Too many failed attempts. Please try again in 15 minutes.', 429);
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordValid) {
      await this.handleFailedLogin(user.id, user.loginAttempts ?? 0);
      await this.authRepository.writeAuditLog(
        user.id, 'user_login_failed', 'user', user.id, 'Invalid password', { ip },
      );
      throw invalidCredentials;
    }

    if (user.suspendedAt) {
      throw new ForbiddenException('Your account has been suspended. Please contact support.');
    }

    if (!user.isVerifiedEmail) {
      throw new ForbiddenException('Please verify your email address before logging in.');
    }

    await this.authRepository.resetLoginAttempts(user.id);

    const { accessToken, refreshTokenRaw } = await this.issueTokenPair(user);

    await this.authRepository.writeAuditLog(
      user.id, 'user_login', 'user', user.id, 'Successful login', { ip },
    );

    return {
      accessToken,
      refreshTokenRaw,
      expiresIn: 900,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }
}
