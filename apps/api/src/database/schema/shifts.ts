import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  date,
  time,
  pgEnum,
  integer,
  index,
} from 'drizzle-orm/pg-core';
import { employers } from './employers';
import { professionals } from './professionals';
import { applications } from './applications';
import { users } from './users';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const shiftStatusEnum = pgEnum('shift_status', [
  'scheduled',
  'confirmed',
  'completed',
  'cancelled',
  'disputed',
]);

// ─── shifts ───────────────────────────────────────────────────────────────────

export const shifts = pgTable(
  'shifts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    employerId: uuid('employer_id')
      .notNull()
      .references(() => employers.id, { onDelete: 'restrict' }),
    professionalId: uuid('professional_id')
      .notNull()
      .references(() => professionals.id, { onDelete: 'restrict' }),
    applicationId: uuid('application_id').references(() => applications.id, {
      onDelete: 'set null',
    }),
    shiftDate: date('shift_date').notNull(),
    startTime: time('start_time').notNull(),
    endTime: time('end_time').notNull(),
    location: text('location').notNull(),
    roleDescription: text('role_description').notNull(),
    status: shiftStatusEnum('status').notNull().default('scheduled'),
    professionalConfirmedAt: timestamp('professional_confirmed_at', {
      withTimezone: true,
    }),
    // Both flags must be true before payment and rating are triggered
    employerConfirmedCompletion: boolean('employer_confirmed_completion')
      .notNull()
      .default(false),
    professionalConfirmedCompletion: boolean('professional_confirmed_completion')
      .notNull()
      .default(false),
    cancelledBy: uuid('cancelled_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    cancellationReason: text('cancellation_reason'),
    // Optimistic concurrency — guards against concurrent status transitions
    // (e.g., simultaneous completion confirmations from both parties).
    version: integer('version').notNull().default(1),
    // Shifts are never soft-deleted — they are legal/financial records.
    // Cancelled shifts keep their data; only status changes.
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Professional shift calendar — upcoming/past shifts for a professional
    idxShiftsProfessionalId: index('idx_shifts_professional_id').on(table.professionalId),
    // Employer shift dashboard — all shifts for an employer
    idxShiftsEmployerId: index('idx_shifts_employer_id').on(table.employerId),
    // Status filtering — active, completed, disputed
    idxShiftsStatus: index('idx_shifts_status').on(table.status),
    // Date-based queries — calendar view and scheduled job for reminders
    idxShiftsShiftDate: index('idx_shifts_shift_date').on(table.shiftDate),
    // Completion trigger — find shifts pending payment/rating initiation
    idxShiftsEmployerConfirmed: index('idx_shifts_employer_confirmed').on(table.employerConfirmedCompletion),
    idxShiftsProfessionalConfirmed: index('idx_shifts_professional_confirmed').on(table.professionalConfirmedCompletion),
  }),
);
