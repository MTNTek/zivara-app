/**
 * verify.ts — Verify the database connection and applied migrations.
 *
 * Usage:
 *   npm run db:verify
 *
 * Checks:
 *   1. DATABASE_URL is set
 *   2. PostgreSQL is reachable
 *   3. Drizzle connects successfully
 *   4. Core tables exist (users, professionals, employers, jobs)
 *   5. Reports row counts for all seeded tables
 */

import * as path from 'path';
import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const DATABASE_URL = process.env['DATABASE_URL'];

if (!DATABASE_URL) {
  console.error('\n[verify] ✗ DATABASE_URL is not set.\n');
  process.exit(1);
}

async function verify(): Promise<void> {
  console.log('\n[verify] Checking database connection...');

  const client = postgres(DATABASE_URL!, { max: 1 });
  const db = drizzle(client);

  try {
    // 1. Basic connectivity
    await db.execute(sql`SELECT 1`);
    console.log('[verify] ✓ PostgreSQL is reachable');

    // 2. Check core tables exist
    const tables = [
      'users', 'refresh_tokens', 'email_tokens',
      'professionals', 'professional_experience', 'professional_skills', 'professional_documents',
      'employers', 'employer_members',
      'jobs', 'job_required_skills',
      'applications', 'shifts', 'ratings', 'notifications', 'payments', 'audit_logs',
    ];

    for (const table of tables) {
      const result = await db.execute(
        sql.raw(`SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = '${table}'
        ) AS exists`),
      );
      const exists = (result[0] as { exists: boolean }).exists;
      if (!exists) {
        console.error(`[verify] ✗ Table '${table}' does not exist. Run: npm run db:migrate`);
        process.exit(1);
      }
    }
    console.log(`[verify] ✓ All ${tables.length} tables exist`);

    // 3. Row counts
    console.log('\n[verify] Row counts:');
    const countTables = ['users', 'professionals', 'employers', 'jobs', 'applications', 'notifications', 'ratings'];
    for (const table of countTables) {
      const result = await db.execute(sql.raw(`SELECT COUNT(*)::int AS count FROM "${table}"`));
      const count = (result[0] as { count: number }).count;
      console.log(`         ${table.padEnd(20)} ${count}`);
    }

    console.log('\n[verify] ✓ Database is healthy and ready.\n');
  } catch (error) {
    console.error('[verify] ✗ Verification failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

void verify();
