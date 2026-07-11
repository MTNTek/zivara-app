import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { EmailService } from '../common/email/email.service';
import type { RegisterProfessionalDto } from './dto/register-professional.dto';
import type { RegisterEmployerDto } from './dto/register-employer.dto';
import type { LoginDto } from './dto/login.dto';
import type { ChangePasswordDto } from './dto/change-password.dto';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BCRYPT_COST = 10; // reduced cost for test speed

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

// Build a minimal user-shaped object that satisfies what AuthService reads
function makeUser(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: '', // will be overridden in tests that need it
    role: 'professional',
    languagePreference: 'en',
    isVerifiedEmail: true,
    isActive: true,
    loginAttempts: 0,
    lockoutUntil: null,
    suspendedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

function makeRefreshTokenRow(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: 'rt-1',
    userId: 'user-1',
    tokenHash: 'some-hash',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    revokedAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

function makeEmailTokenRow(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: 'et-1',
    userId: 'user-1',
    tokenHash: 'some-hash',
    type: 'password_reset',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    usedAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

function makeEmployer(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: 'emp-1',
    ownerUserId: 'user-1',
    companyName: 'Acme Corp',
    tradeLicenseNumber: 'TL-001',
    industry: 'Construction',
    operatingCountry: 'AE',
    verificationStatus: 'unverified',
    isBadgeVisible: false,
    complianceFlag: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockAuthRepository = {
  findUserByEmail: jest.fn(),
  findUserById: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  incrementLoginAttempts: jest.fn(),
  lockAccount: jest.fn(),
  resetLoginAttempts: jest.fn(),
  createRefreshToken: jest.fn(),
  findRefreshToken: jest.fn(),
  revokeRefreshToken: jest.fn(),
  revokeAllUserRefreshTokens: jest.fn(),
  invalidatePreviousTokens: jest.fn(),
  createEmailToken: jest.fn(),
  findEmailToken: jest.fn(),
  markEmailTokenUsed: jest.fn(),
  createProfessional: jest.fn(),
  findEmployerByTradeLicense: jest.fn(),
  createEmployer: jest.fn(),
  createEmployerMember: jest.fn(),
  writeAuditLog: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-access-token'),
  verify: jest.fn().mockReturnValue({ sub: 'user-1', email: 'test@example.com', role: 'professional' }),
};

const mockEmailService = {
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
};

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Default: skip email verification so most tests don't need to worry about it
    process.env['SKIP_EMAIL_VERIFICATION'] = 'true';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: mockAuthRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    delete process.env['SKIP_EMAIL_VERIFICATION'];
  });

  // ─── Registration — Professional ──────────────────────────────────────────

  describe('registerProfessional', () => {
    const dto: RegisterProfessionalDto = {
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      password: 'SecurePass1!',
    };

    it('happy path: creates user, creates professional profile, returns success message', async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(null);
      const createdUser = makeUser({ id: 'user-new', email: dto.email.toLowerCase() });
      mockAuthRepository.createUser.mockResolvedValue(createdUser);
      mockAuthRepository.createProfessional.mockResolvedValue({ id: 'prof-1', userId: 'user-new' });
      mockAuthRepository.writeAuditLog.mockResolvedValue(undefined);

      const result = await service.registerProfessional(dto);

      expect(mockAuthRepository.findUserByEmail).toHaveBeenCalledWith(dto.email);
      expect(mockAuthRepository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: dto.email.toLowerCase(),
          role: 'professional',
        }),
      );
      expect(mockAuthRepository.createProfessional).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-new', fullName: dto.fullName }),
      );
      expect(result.message).toBe('Account created successfully.');
      expect(result.requiresEmailVerification).toBe(false);
    });

    it('duplicate email: throws ConflictException', async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(makeUser());

      await expect(service.registerProfessional(dto)).rejects.toThrow(ConflictException);
      expect(mockAuthRepository.createUser).not.toHaveBeenCalled();
    });
  });

  // ─── Registration — Employer ──────────────────────────────────────────────

  describe('registerEmployer', () => {
    const dto: RegisterEmployerDto = {
      fullName: 'John Smith',
      companyName: 'Acme Corp',
      tradeLicenseNumber: 'TL-001',
      industry: 'Construction',
      operatingCountry: 'AE',
      email: 'employer@example.com',
      password: 'SecurePass1!',
    };

    it('happy path: creates user, creates employer, creates employer member', async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(null);
      mockAuthRepository.findEmployerByTradeLicense.mockResolvedValue(null);
      const createdUser = makeUser({ id: 'user-emp', email: dto.email.toLowerCase(), role: 'employer' });
      mockAuthRepository.createUser.mockResolvedValue(createdUser);
      const createdEmployer = makeEmployer({ id: 'emp-new' });
      mockAuthRepository.createEmployer.mockResolvedValue(createdEmployer);
      mockAuthRepository.createEmployerMember.mockResolvedValue(undefined);
      mockAuthRepository.writeAuditLog.mockResolvedValue(undefined);

      const result = await service.registerEmployer(dto);

      expect(mockAuthRepository.findUserByEmail).toHaveBeenCalledWith(dto.email);
      expect(mockAuthRepository.findEmployerByTradeLicense).toHaveBeenCalledWith(dto.tradeLicenseNumber);
      expect(mockAuthRepository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ email: dto.email.toLowerCase(), role: 'employer' }),
      );
      expect(mockAuthRepository.createEmployer).toHaveBeenCalledWith(
        expect.objectContaining({ companyName: dto.companyName, tradeLicenseNumber: dto.tradeLicenseNumber }),
      );
      expect(mockAuthRepository.createEmployerMember).toHaveBeenCalledWith(
        expect.objectContaining({ employerId: 'emp-new', userId: 'user-emp', role: 'owner' }),
      );
      expect(result.message).toBe('Account created successfully.');
    });

    it('duplicate email: throws ConflictException', async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(makeUser());

      await expect(service.registerEmployer(dto)).rejects.toThrow(ConflictException);
      expect(mockAuthRepository.createUser).not.toHaveBeenCalled();
    });

    it('duplicate trade license: throws ConflictException', async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(null);
      mockAuthRepository.findEmployerByTradeLicense.mockResolvedValue(makeEmployer());

      await expect(service.registerEmployer(dto)).rejects.toThrow(ConflictException);
      expect(mockAuthRepository.createUser).not.toHaveBeenCalled();
    });
  });

  // ─── Login ────────────────────────────────────────────────────────────────

  describe('loginAndGetTokens', () => {
    const dto: LoginDto = { email: 'test@example.com', password: 'correct-password' };
    const ip = '127.0.0.1';

    let passwordHash: string;

    beforeAll(async () => {
      passwordHash = await bcrypt.hash('correct-password', BCRYPT_COST);
    });

    it('valid credentials, email verified, no lockout: returns accessToken + refreshTokenRaw', async () => {
      const user = makeUser({ passwordHash });
      mockAuthRepository.findUserByEmail.mockResolvedValue(user);
      mockAuthRepository.resetLoginAttempts.mockResolvedValue(undefined);
      mockAuthRepository.createRefreshToken.mockResolvedValue({ id: 'rt-new' });
      mockAuthRepository.writeAuditLog.mockResolvedValue(undefined);

      const result = await service.loginAndGetTokens(dto, ip);

      expect(result.accessToken).toBe('mock-access-token');
      expect(typeof result.refreshTokenRaw).toBe('string');
      expect(result.refreshTokenRaw.length).toBeGreaterThan(0);
      expect(result.user.email).toBe('test@example.com');
      expect(mockAuthRepository.resetLoginAttempts).toHaveBeenCalledWith('user-1');
    });

    it('invalid password: throws UnauthorizedException and increments login attempts', async () => {
      const user = makeUser({ passwordHash, loginAttempts: 0 });
      mockAuthRepository.findUserByEmail.mockResolvedValue(user);
      mockAuthRepository.incrementLoginAttempts.mockResolvedValue(undefined);
      mockAuthRepository.writeAuditLog.mockResolvedValue(undefined);

      const wrongDto: LoginDto = { email: dto.email, password: 'wrong-password' };

      await expect(service.loginAndGetTokens(wrongDto, ip)).rejects.toThrow(UnauthorizedException);
      expect(mockAuthRepository.incrementLoginAttempts).toHaveBeenCalledWith('user-1');
    });

    it('account locked out: throws 429 HttpException', async () => {
      const lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
      const user = makeUser({ passwordHash, lockoutUntil });
      mockAuthRepository.findUserByEmail.mockResolvedValue(user);

      const error = await service.loginAndGetTokens(dto, ip).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(429);
    });

    it('suspended account: throws ForbiddenException', async () => {
      const user = makeUser({ passwordHash, suspendedAt: new Date() });
      mockAuthRepository.findUserByEmail.mockResolvedValue(user);
      mockAuthRepository.writeAuditLog.mockResolvedValue(undefined);

      await expect(service.loginAndGetTokens(dto, ip)).rejects.toThrow(ForbiddenException);
    });

    it('email not verified: throws ForbiddenException', async () => {
      const user = makeUser({ passwordHash, isVerifiedEmail: false });
      mockAuthRepository.findUserByEmail.mockResolvedValue(user);
      mockAuthRepository.writeAuditLog.mockResolvedValue(undefined);

      await expect(service.loginAndGetTokens(dto, ip)).rejects.toThrow(ForbiddenException);
    });

    it('account lockout: after 5 failed logins, lockAccount is called', async () => {
      // Simulate user already at 4 attempts (one more will hit the threshold)
      const user = makeUser({ passwordHash, loginAttempts: 4 });
      mockAuthRepository.findUserByEmail.mockResolvedValue(user);
      mockAuthRepository.incrementLoginAttempts.mockResolvedValue(undefined);
      mockAuthRepository.lockAccount.mockResolvedValue(undefined);
      mockAuthRepository.writeAuditLog.mockResolvedValue(undefined);

      const wrongDto: LoginDto = { email: dto.email, password: 'wrong-password' };
      await expect(service.loginAndGetTokens(wrongDto, ip)).rejects.toThrow(UnauthorizedException);

      expect(mockAuthRepository.lockAccount).toHaveBeenCalledWith(
        'user-1',
        expect.any(Date),
      );
    });
  });

  // ─── Logout ───────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('with valid refresh token: calls revokeRefreshToken and writes audit log', async () => {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashToken(rawToken);
      const tokenRow = makeRefreshTokenRow({ tokenHash });

      mockAuthRepository.findRefreshToken.mockResolvedValue(tokenRow);
      mockAuthRepository.revokeRefreshToken.mockResolvedValue(undefined);
      mockAuthRepository.writeAuditLog.mockResolvedValue(undefined);

      await service.logout('user-1', rawToken);

      expect(mockAuthRepository.findRefreshToken).toHaveBeenCalledWith(tokenHash);
      expect(mockAuthRepository.revokeRefreshToken).toHaveBeenCalledWith('rt-1');
      expect(mockAuthRepository.writeAuditLog).toHaveBeenCalledWith(
        'user-1',
        'user_logout',
        'user',
        'user-1',
        'User logged out',
      );
    });
  });

  // ─── Token Refresh ────────────────────────────────────────────────────────

  describe('refreshTokens', () => {
    it('valid token: revokes old token and issues new pair', async () => {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashToken(rawToken);
      const tokenRow = makeRefreshTokenRow({ tokenHash });
      const user = makeUser();

      mockAuthRepository.findRefreshToken.mockResolvedValue(tokenRow);
      mockAuthRepository.findUserById.mockResolvedValue(user);
      mockAuthRepository.revokeRefreshToken.mockResolvedValue(undefined);
      mockAuthRepository.createRefreshToken.mockResolvedValue({ id: 'rt-new' });

      const result = await service.refreshTokens(rawToken);

      expect(mockAuthRepository.revokeRefreshToken).toHaveBeenCalledWith('rt-1');
      expect(result.accessToken).toBe('mock-access-token');
      expect(typeof result.refreshTokenRaw).toBe('string');
    });

    it('already revoked token (reuse): calls revokeAllUserRefreshTokens and throws UnauthorizedException', async () => {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashToken(rawToken);
      const revokedTokenRow = makeRefreshTokenRow({ tokenHash, revokedAt: new Date() });

      mockAuthRepository.findRefreshToken.mockResolvedValue(revokedTokenRow);
      mockAuthRepository.revokeAllUserRefreshTokens.mockResolvedValue(undefined);
      mockAuthRepository.writeAuditLog.mockResolvedValue(undefined);

      await expect(service.refreshTokens(rawToken)).rejects.toThrow(UnauthorizedException);
      expect(mockAuthRepository.revokeAllUserRefreshTokens).toHaveBeenCalledWith('user-1');
    });

    it('expired token: throws UnauthorizedException', async () => {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashToken(rawToken);
      const expiredTokenRow = makeRefreshTokenRow({
        tokenHash,
        expiresAt: new Date(Date.now() - 1000), // already expired
      });

      mockAuthRepository.findRefreshToken.mockResolvedValue(expiredTokenRow);

      await expect(service.refreshTokens(rawToken)).rejects.toThrow(UnauthorizedException);
    });

    it('non-existent token: throws UnauthorizedException', async () => {
      mockAuthRepository.findRefreshToken.mockResolvedValue(null);

      await expect(service.refreshTokens('totally-unknown-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ─── Forgot Password ──────────────────────────────────────────────────────

  describe('forgotPassword', () => {
    it('existing email: creates email token and calls emailService', async () => {
      // Turn off skip so email service is actually invoked
      process.env['SKIP_EMAIL_VERIFICATION'] = 'false';

      // Re-create service so it picks up the new env value
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          { provide: AuthRepository, useValue: mockAuthRepository },
          { provide: JwtService, useValue: mockJwtService },
          { provide: EmailService, useValue: mockEmailService },
        ],
      }).compile();
      const svcWithEmail = module.get<AuthService>(AuthService);

      const user = makeUser();
      mockAuthRepository.findUserByEmail.mockResolvedValue(user);
      mockAuthRepository.invalidatePreviousTokens.mockResolvedValue(undefined);
      mockAuthRepository.createEmailToken.mockResolvedValue(undefined);

      await svcWithEmail.forgotPassword('test@example.com');

      expect(mockAuthRepository.createEmailToken).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'password_reset', userId: 'user-1' }),
      );
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
        'en',
      );
    });

    it('non-existent email: returns silently without error (prevents enumeration)', async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(null);

      await expect(service.forgotPassword('nobody@example.com')).resolves.toBeUndefined();
      expect(mockAuthRepository.createEmailToken).not.toHaveBeenCalled();
      expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  // ─── Reset Password ───────────────────────────────────────────────────────

  describe('resetPassword', () => {
    it('valid token: updates password, marks token used, revokes all refresh tokens', async () => {
      const rawToken = 'valid-reset-token';
      const tokenHash = hashToken(rawToken);
      const tokenRow = makeEmailTokenRow({ tokenHash, type: 'password_reset' });

      mockAuthRepository.findEmailToken.mockResolvedValue(tokenRow);
      mockAuthRepository.updateUser.mockResolvedValue(undefined);
      mockAuthRepository.markEmailTokenUsed.mockResolvedValue(undefined);
      mockAuthRepository.revokeAllUserRefreshTokens.mockResolvedValue(undefined);
      mockAuthRepository.writeAuditLog.mockResolvedValue(undefined);

      await service.resetPassword(rawToken, 'NewPass123!');

      expect(mockAuthRepository.updateUser).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ passwordHash: expect.any(String) as string }),
      );
      expect(mockAuthRepository.markEmailTokenUsed).toHaveBeenCalledWith('et-1');
      expect(mockAuthRepository.revokeAllUserRefreshTokens).toHaveBeenCalledWith('user-1');
    });

    it('expired token: throws BadRequestException', async () => {
      const rawToken = 'expired-reset-token';
      const tokenHash = hashToken(rawToken);
      const expiredTokenRow = makeEmailTokenRow({
        tokenHash,
        type: 'password_reset',
        expiresAt: new Date(Date.now() - 1000),
      });

      mockAuthRepository.findEmailToken.mockResolvedValue(expiredTokenRow);

      await expect(service.resetPassword(rawToken, 'NewPass123!')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('already used token: throws BadRequestException', async () => {
      const rawToken = 'used-reset-token';
      const tokenHash = hashToken(rawToken);
      const usedTokenRow = makeEmailTokenRow({
        tokenHash,
        type: 'password_reset',
        usedAt: new Date(),
      });

      mockAuthRepository.findEmailToken.mockResolvedValue(usedTokenRow);

      await expect(service.resetPassword(rawToken, 'NewPass123!')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── Change Password ──────────────────────────────────────────────────────

  describe('changePassword', () => {
    let currentPasswordHash: string;

    beforeAll(async () => {
      currentPasswordHash = await bcrypt.hash('CurrentPass1!', BCRYPT_COST);
    });

    it('correct current password, new different password: updates hash and revokes all refresh tokens', async () => {
      const user = makeUser({ passwordHash: currentPasswordHash });
      mockAuthRepository.findUserById.mockResolvedValue(user);
      mockAuthRepository.updateUser.mockResolvedValue(undefined);
      mockAuthRepository.revokeAllUserRefreshTokens.mockResolvedValue(undefined);
      mockAuthRepository.writeAuditLog.mockResolvedValue(undefined);

      const dto: ChangePasswordDto = {
        currentPassword: 'CurrentPass1!',
        newPassword: 'NewPass456!',
      };

      await service.changePassword('user-1', dto);

      expect(mockAuthRepository.updateUser).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ passwordHash: expect.any(String) as string }),
      );
      expect(mockAuthRepository.revokeAllUserRefreshTokens).toHaveBeenCalledWith('user-1');

      // Verify the stored hash matches the new password
      const updateCall = (mockAuthRepository.updateUser as jest.Mock).mock.calls[0] as [
        string,
        { passwordHash: string },
      ];
      const isNewHashCorrect = await bcrypt.compare('NewPass456!', updateCall[1].passwordHash);
      expect(isNewHashCorrect).toBe(true);
    });

    it('wrong current password: throws UnauthorizedException', async () => {
      const user = makeUser({ passwordHash: currentPasswordHash });
      mockAuthRepository.findUserById.mockResolvedValue(user);

      const dto: ChangePasswordDto = {
        currentPassword: 'WrongOldPass!',
        newPassword: 'NewPass456!',
      };

      await expect(service.changePassword('user-1', dto)).rejects.toThrow(UnauthorizedException);
      expect(mockAuthRepository.updateUser).not.toHaveBeenCalled();
    });

    it('same new password as current: throws BadRequestException', async () => {
      const user = makeUser({ passwordHash: currentPasswordHash });
      mockAuthRepository.findUserById.mockResolvedValue(user);

      const dto: ChangePasswordDto = {
        currentPassword: 'CurrentPass1!',
        newPassword: 'CurrentPass1!', // same as current
      };

      await expect(service.changePassword('user-1', dto)).rejects.toThrow(BadRequestException);
      expect(mockAuthRepository.updateUser).not.toHaveBeenCalled();
    });
  });
});
