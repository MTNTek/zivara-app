import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Query,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterProfessionalDto } from './dto/register-professional.dto';
import { RegisterEmployerDto } from './dto/register-employer.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from './interfaces/jwt-payload.interface';

const REFRESH_COOKIE_NAME = 'zivara_rt';
const IS_PRODUCTION = process.env['NODE_ENV'] === 'production';

function setRefreshCookie(res: Response, rawToken: string): void {
  res.cookie(REFRESH_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'strict',
    path: '/auth',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'strict',
    path: '/auth',
  });
}

@Controller('auth')
@Throttle({ default: { limit: 10, ttl: 60000 } })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── Registration ─────────────────────────────────────────────────────────

  @Public()
  @Post('register/professional')
  async registerProfessional(@Body() dto: RegisterProfessionalDto) {
    return this.authService.registerProfessional(dto);
  }

  @Public()
  @Post('register/employer')
  async registerEmployer(@Body() dto: RegisterEmployerDto) {
    return this.authService.registerEmployer(dto);
  }

  // ─── Email Verification ───────────────────────────────────────────────────

  @Public()
  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Query('token') token: string) {
    await this.authService.verifyEmail(token);
    return { message: 'Email verified successfully. You can now log in.' };
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body('email') email: string) {
    await this.authService.resendVerification(email);
    return {
      message: 'If an unverified account exists for that email, a new verification link has been sent.',
    };
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) ?? req.socket.remoteAddress ?? 'unknown';
    const result = await this.authService.loginAndGetTokens(dto, ip);
    const { refreshTokenRaw, ...response } = result;
    setRefreshCookie(res, refreshTokenRaw);
    return response;
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    await this.authService.logout(user.id, rawRefreshToken);
    clearRefreshCookie(res);
    return { message: 'Logged out successfully.' };
  }

  // ─── Token Refresh ────────────────────────────────────────────────────────

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    if (!rawToken) {
      clearRefreshCookie(res);
      return { message: 'Session expired. Please log in again.' };
    }
    const { accessToken, refreshTokenRaw } = await this.authService.refreshTokens(rawToken);
    setRefreshCookie(res, refreshTokenRaw);
    return { accessToken, expiresIn: 900 };
  }

  // ─── Forgot / Reset Password ──────────────────────────────────────────────

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return {
      message: "If an account exists for that email, you'll receive a reset link shortly.",
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.password);
    return { message: 'Password reset successfully. Please log in.' };
  }

  // ─── Change Password ──────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Patch('password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: RequestUser,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(user.id, dto);
    return { message: 'Password changed successfully.' };
  }

  // ─── Current User ─────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser() user: RequestUser) {
    return this.authService.getCurrentUser(user.id);
  }
}
