import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const emailTokenTypeEnum = pgEnum('email_token_type', [
  'email_verification',
  'password_reset',
]);

// ─── email_tokens ─────────────────────────────────────────────────────────────
// Stores verification and password-reset tokens.
// Only the SHA-256 hash is stored — the raw token is only ever transmitted via email.
// Tokens are never deleted — used_at marks consumption; expired tokens are filtered by expiresAt.

export const emailTokens = pgTable(
  'email_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // SHA-256 hash of the raw token — raw token is only sent in email link
    tokenHash: varchar('token_hash').notNull(),
    type: emailTokenTypeEnum('type').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    // Set when the token has been consumed — prevents reuse
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Primary lookup — find token by hash on verification/reset
    idxEmailTokensTokenHash: index('idx_email_tokens_token_hash').on(table.tokenHash),
    // User token lookup — find all tokens for a user (e.g., to invalidate previous)
    idxEmailTokensUserId: index('idx_email_tokens_user_id').on(table.userId),
    // Active token filter — find unused, non-expired tokens of a given type
    idxEmailTokensTypeUsed: index('idx_email_tokens_type_used').on(table.type, table.usedAt),
  }),
);
