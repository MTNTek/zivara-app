import { Global, Module, OnModuleDestroy, Inject } from '@nestjs/common';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

import * as usersSchema from './schema/users';
import * as professionalsSchema from './schema/professionals';
import * as employersSchema from './schema/employers';
import * as jobsSchema from './schema/jobs';
import * as applicationsSchema from './schema/applications';
import * as shiftsSchema from './schema/shifts';
import * as ratingsSchema from './schema/ratings';
import * as notificationsSchema from './schema/notifications';
import * as paymentsSchema from './schema/payments';
import * as auditLogsSchema from './schema/audit-logs';
import * as emailTokensSchema from './schema/email-tokens';

/**
 * Combined schema object — all tables and enums in one place.
 * Feature modules import specific tables from the individual schema files.
 */
export const schema = {
  ...usersSchema,
  ...professionalsSchema,
  ...employersSchema,
  ...jobsSchema,
  ...applicationsSchema,
  ...shiftsSchema,
  ...ratingsSchema,
  ...notificationsSchema,
  ...paymentsSchema,
  ...auditLogsSchema,
  ...emailTokensSchema,
};

/** Injection token used by all feature modules to inject the Drizzle client. */
export const DRIZZLE_CLIENT = 'DRIZZLE_CLIENT';

/** Symbol used internally to inject the raw postgres connection for cleanup. */
const POSTGRES_CLIENT = Symbol('POSTGRES_CLIENT');

export type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>;

/**
 * DatabaseModule — global, provides the Drizzle ORM client via `DRIZZLE_CLIENT`.
 *
 * Uses the `postgres` driver (postgres-js) because it is the recommended driver
 * for drizzle-orm/postgres-js and is already listed as a project dependency.
 *
 * The raw postgres connection is kept as a separate provider so it can be
 * properly closed when the application shuts down.
 */
@Global()
@Module({
  providers: [
    // Raw postgres-js connection — created once, shared by the drizzle client
    {
      provide: POSTGRES_CLIENT,
      useFactory: () => {
        const databaseUrl = process.env['DATABASE_URL'];
        if (!databaseUrl) {
          throw new Error(
            '[DatabaseModule] DATABASE_URL environment variable is not set.',
          );
        }
        return postgres(databaseUrl, {
          // Maximum number of connections in the pool
          max: 10,
          // Prepare statements are disabled for compatibility with PgBouncer
          prepare: false,
        });
      },
    },
    // Drizzle client — wraps the postgres connection with the full schema
    {
      provide: DRIZZLE_CLIENT,
      useFactory: (sql: ReturnType<typeof postgres>) => drizzle(sql, { schema }),
      inject: [POSTGRES_CLIENT],
    },
  ],
  exports: [DRIZZLE_CLIENT],
})
export class DatabaseModule implements OnModuleDestroy {
  constructor(
    @Inject(POSTGRES_CLIENT)
    private readonly sql: ReturnType<typeof postgres>,
  ) {}

  async onModuleDestroy(): Promise<void> {
    await this.sql.end();
  }
}
