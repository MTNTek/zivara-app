/**
 * migrate.ts — Run all pending Drizzle ORM migrations.
 *
 * Usage:
 *   npm run db:migrate
 *
 * Reads DATABASE_URL from .env (or environment).
 * Applies all migrations in src/database/migrations/ in order.
 * Safe to run multiple times — only applies pending migrations.
 */

import * as path from 'path';
import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

// Load .env from project root (two levels up from src/database/)
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const DATABASE_URL = process.env['DATABASE_URL'];

if (!DATABASE_URL) {
  console.error('\n[migrate] ✗ DATABASE_URL is not set. Copy .env.example to .env and fill it in.\n');
  process.exit(1);
}

async function runMigrations(): Promise<void> {
  console.log('[migrate] Connecting to database...');

  // Use max:1 for migration — single connection is sufficient and avoids pool issues
  const sql = postgres(DATABASE_URL!, { max: 1, onnotice: () => {} });
  const db = drizzle(sql);

  const migrationsFolder = path.resolve(__dirname, './migrations');

  try {
    console.log(`[migrate] Running migrations from ${migrationsFolder}`);
    await migrate(db, { migrationsFolder });
    console.log('[migrate] ✓ All migrations applied successfully.\n');
  } catch (error) {
    console.error('[migrate] ✗ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

void runMigrations();
