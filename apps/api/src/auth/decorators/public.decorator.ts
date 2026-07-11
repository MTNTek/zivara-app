import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark a route as public — no authentication required.
 * The JwtAuthGuard skips validation for routes decorated with @Public().
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
