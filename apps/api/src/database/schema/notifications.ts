import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

// ─── notifications ────────────────────────────────────────────────────────────
// No soft delete — notifications cascade on user delete and are low-value historical data.
// No version column — notifications are append-only; only is_read changes.

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type').notNull(),
    // JSONB stores localised title: { "en": "You were shortlisted", "ar": "..." }
    title: jsonb('title').$type<Record<string, string>>().notNull(),
    body: jsonb('body').$type<Record<string, string>>().notNull(),
    referenceType: varchar('reference_type'),
    referenceId: uuid('reference_id'),
    isRead: boolean('is_read').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Notification center — load all notifications for a user, newest first
    idxNotificationsUserId: index('idx_notifications_user_id').on(table.userId),
    // Unread badge count — filter unread notifications for a user
    idxNotificationsUserUnread: index('idx_notifications_user_unread').on(table.userId, table.isRead),
    // Deep-link resolution — find notification by reference (e.g., application ID)
    idxNotificationsReferenceType: index('idx_notifications_reference_type').on(table.referenceType),
    idxNotificationsReferenceId: index('idx_notifications_reference_id').on(table.referenceId),
  }),
);
