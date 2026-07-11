import type { Config } from 'drizzle-kit';

/**
 * Drizzle Kit configuration.
 *
 * - schema: all domain schema files under src/database/schema/
 * - out:    migration SQL files are written to src/database/migrations/
 * - dialect: postgresql (matches drizzle-kit 0.21.x API)
 */
const config: Config = {
  schema: './src/database/schema/*.ts',
  out: './src/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL'] ?? '',
  },
};

export default config;
