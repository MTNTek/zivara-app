import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@zivara/shared';

export const ROLES_KEY = 'roles';

/**
 * Restrict an endpoint to one or more user roles.
 *
 * @example
 * @Roles(UserRole.admin)
 * @Get('admin-only')
 * adminEndpoint() {}
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
