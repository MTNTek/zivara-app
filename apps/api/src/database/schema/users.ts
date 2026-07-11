import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  pgEnum,
  index,
  smallint,
} from 'drizzle-orm/pg-core';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum('user_role', [
  'professional',
  'employer',
  'admin',
]);

export const languagePreferenceEnum = pgEnum('language_preference', [
  'en',
  'ar',
]);

// ─── users ────────────────────────────────────────────────────────────────────

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email').notNull().unique(),
    passwordHash: varchar('password_hash').notNull(),
    role: userRoleEnum('role').notNull(),
    languagePreference: languagePreferenceEnum('language_preference')
      .notNull()
      .default('en'),
    isVerifiedEmail: boolean('is_verified_email').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    suspendedAt: timestamp('suspended_at', { withTimezone: true }),
    suspensionReason: text('suspension_reason'),
    // Account lockout — failed login tracking
    loginAttempts: smallint('login_attempts').notNull().default(0),
    lockoutUntil: timestamp('lockout_until', { withTimezone: true }),
    // Soft delete — allows account recovery and preserves FK relationships.
    // Application layer must filter WHERE deleted_at IS NULL for all active queries.
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    idxUsersRole: index('idx_users_role').on(table.role),
    idxUsersDeletedAt: index('idx_users_deleted_at').on(table.deletedAt),
  }),
);

// ─── refresh_tokens ───────────────────────────────────────────────────────────
// No soft delete — tokens are hard-revoked. Expired/revoked rows are purged by a scheduled job.

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Lookup by user — used to revoke all sessions on logout / suspension
    idxRefreshTokensUserId: index('idx_refresh_tokens_user_id').on(table.userId),
    // Lookup by token hash — used on every refresh request
    idxRefreshTokensTokenHash: index('idx_refresh_tokens_token_hash').on(table.tokenHash),
    // Cleanup job queries active (non-revoked, non-expired) tokens
    idxRefreshTokensExpiresAt: index('idx_refresh_tokens_expires_at').on(table.expiresAt),
  }),
);
