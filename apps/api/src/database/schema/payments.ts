import {
  pgTable,
  uuid,
  numeric,
  timestamp,
  pgEnum,
  char,
  integer,
  index,
} from 'drizzle-orm/pg-core';
import { shifts } from './shifts';
import { professionals } from './professionals';
import { employers } from './employers';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'processing',
  'completed',
  'failed',
  'disputed',
  'held',
]);

// ─── payments ─────────────────────────────────────────────────────────────────
// Payments are financial records — never soft-deleted.
// Disputes change status to 'held'; resolution changes to 'completed' or 'failed'.

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    shiftId: uuid('shift_id')
      .notNull()
      .references(() => shifts.id, { onDelete: 'restrict' }),
    professionalId: uuid('professional_id')
      .notNull()
      .references(() => professionals.id, { onDelete: 'restrict' }),
    employerId: uuid('employer_id')
      .notNull()
      .references(() => employers.id, { onDelete: 'restrict' }),
    grossAmount: numeric('gross_amount', { precision: 10, scale: 2 }).notNull(),
    platformFee: numeric('platform_fee', { precision: 10, scale: 2 }).notNull(),
    netAmount: numeric('net_amount', { precision: 10, scale: 2 }).notNull(),
    currency: char('currency', { length: 3 }).notNull().default('AED'),
    status: paymentStatusEnum('status').notNull().default('pending'),
    initiatedAt: timestamp('initiated_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    // Optimistic concurrency — guards concurrent payment state transitions
    // (e.g., simultaneous dispute and completion triggers).
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Professional earnings view — all payments for a professional
    idxPaymentsProfessionalId: index('idx_payments_professional_id').on(table.professionalId),
    // Employer billing view — all payments for an employer
    idxPaymentsEmployerId: index('idx_payments_employer_id').on(table.employerId),
    // Shift → payment lookup
    idxPaymentsShiftId: index('idx_payments_shift_id').on(table.shiftId),
    // Status filtering — pending/processing payments queue, dispute resolution
    idxPaymentsStatus: index('idx_payments_status').on(table.status),
    // Earnings report — filter by date range
    idxPaymentsCompletedAt: index('idx_payments_completed_at').on(table.completedAt),
  }),
);
