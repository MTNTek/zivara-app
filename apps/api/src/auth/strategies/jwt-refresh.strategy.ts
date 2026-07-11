import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';

const REFRESH_COOKIE_NAME = 'zivara_rt';

/**
 * JWT Refresh Strategy — extracts the refresh token from the HTTP-only cookie
 * 'zivara_rt' and passes the raw token value to the service layer.
 *
 * This strategy is registered for use with AuthGuard('jwt-refresh') but the
 * /auth/refresh controller endpoint reads the cookie directly and delegates
 * to AuthService.refreshTokens() which performs hash-based validation.
 *
 * The refresh token is an opaque random hex string, not a signed JWT.
 * No JWT signature verification is performed — only cookie presence is checked.
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      // Extract from HTTP-only cookie named 'zivara_rt'
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const token = request?.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
          return token ?? null;
        },
      ]),
      // Tokens are opaque hex strings — skip JWT signature/expiry validation
      ignoreExpiration: true,
      secretOrKey: process.env['JWT_REFRESH_SECRET'] ?? '',
      passReqToCallback: true,
    });
  }

  /**
   * Called only when the token successfully passes Passport's extractor.
   * Returns the raw cookie token for downstream service validation.
   */
  validate(request: Request, _payload: unknown): { rawToken: string } {
    const rawToken = request.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    if (!rawToken) {
      throw new UnauthorizedException('Session expired. Please log in again.');
    }
    return { rawToken };
  }
}
