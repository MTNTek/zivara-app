import {
  pgTable,
  uuid,
  text,
  smallint,
  timestamp,
  pgEnum,
  check,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { shifts } from './shifts';
import { users } from './users';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const reviewerRoleEnum = pgEnum('reviewer_role', [
  'professional',
  'employer',
]);

export const moderationStatusEnum = pgEnum('moderation_status', [
  'pending',
  'approved',
  'flagged',
  'removed',
]);

// ─── ratings ──────────────────────────────────────────────────────────────────
// Ratings are immutable by design (Correctness Property 8).
// No soft delete — only moderation_status changes (approved → flagged → removed).
// Deletions require admin action and produce an audit_log row.

export const ratings = pgTable(
  'ratings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    shiftId: uuid('shift_id')
      .notNull()
      .references(() => shifts.id, { onDelete: 'restrict' }),
    reviewerId: uuid('reviewer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    revieweeId: uuid('reviewee_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    reviewerRole: reviewerRoleEnum('reviewer_role').notNull(),
    stars: smallint('stars').notNull(),
    reviewText: text('review_text'),
    moderationStatus: moderationStatusEnum('moderation_status')
      .notNull()
      .default('approved'),
    flaggedReason: text('flagged_reason'),
    reviewedByAdmin: uuid('reviewed_by_admin').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // CHECK constraint: stars must be between 1 and 5 (enforced at DB level)
    starsCheck: check('chk_ratings_stars', sql`${table.stars} >= 1 AND ${table.stars} <= 5`),
    // Profile average rating — query all approved ratings for a reviewee
    idxRatingsRevieweeId: index('idx_ratings_reviewee_id').on(table.revieweeId),
    // Reviewer lookup — prevent duplicate ratings per shift per role
    idxRatingsReviewerId: index('idx_ratings_reviewer_id').on(table.reviewerId),
    // Shift completion — find existing ratings for a given shift
    idxRatingsShiftId: index('idx_ratings_shift_id').on(table.shiftId),
    // Moderation queue — admin reviews flagged or pending ratings
    idxRatingsModerationStatus: index('idx_ratings_moderation_status').on(table.moderationStatus),
  }),
);
