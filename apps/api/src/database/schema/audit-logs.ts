import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

// ─── audit_logs ───────────────────────────────────────────────────────────────
// Audit logs are immutable append-only records — never updated or deleted.
// No updated_at, no version, no soft delete.

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    adminId: uuid('admin_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    action: varchar('action').notNull(),
    targetType: varchar('target_type').notNull(),
    targetId: uuid('target_id').notNull(),
    reason: text('reason').notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Admin activity — view all actions taken by a specific admin
    idxAuditLogsAdminId: index('idx_audit_logs_admin_id').on(table.adminId),
    // Entity history — view all audit events for a target entity
    idxAuditLogsTargetType: index('idx_audit_logs_target_type').on(table.targetType),
    idxAuditLogsTargetId: index('idx_audit_logs_target_id').on(table.targetId),
    // Chronological audit trail — sorted by time (analytics, compliance)
    idxAuditLogsCreatedAt: index('idx_audit_logs_created_at').on(table.createdAt),
    // Action-type filter — e.g., find all 'account_suspended' events
    idxAuditLogsAction: index('idx_audit_logs_action').on(table.action),
  }),
);
