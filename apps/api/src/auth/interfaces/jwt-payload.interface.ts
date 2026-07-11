import type { UserRole } from '@zivara/shared';

export interface JwtPayload {
  /** User ID (subject) */
  sub: string;
  email: string;
  role: UserRole;
  /** Present when the user is an employer or employer team member */
  employerId?: string;
  iat: number;
  exp: number;
}

/** The user object attached to the request after JWT validation */
export interface RequestUser {
  id: string;
  email: string;
  role: UserRole;
  employerId?: string;
}
