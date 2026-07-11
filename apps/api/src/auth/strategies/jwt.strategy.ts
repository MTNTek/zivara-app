import { Injectable, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtPayload, RequestUser } from '../interfaces/jwt-payload.interface';
import { AuthRepository } from '../auth.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly authRepository: AuthRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env['JWT_ACCESS_SECRET'] ?? '',
    });
  }

  async validate(payload: JwtPayload): Promise<RequestUser> {
    const user = await this.authRepository.findUserById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Session expired. Please log in again.');
    }

    // Check suspension on every authenticated request
    if (user.suspendedAt) {
      throw new ForbiddenException('Your account has been suspended. Please contact support.');
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      employerId: payload.employerId,
    };
  }
}
