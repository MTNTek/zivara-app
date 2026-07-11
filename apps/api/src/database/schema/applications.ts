import {
  pgTable,
  uuid,
  text,
  timestamp,
  unique,
  pgEnum,
  integer,
  index,
} from 'drizzle-orm/pg-core';
import { jobs } from './jobs';
import { professionals } from './professionals';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const applicationStatusEnum = pgEnum('application_status', [
  'received',
  'under_review',
  'shortlisted',
  'rejected',
  'hired',
  'withdrawn',
]);

// ─── applications ─────────────────────────────────────────────────────────────

export const applications = pgTable(
  'applications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobId: uuid('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    professionalId: uuid('professional_id')
      .notNull()
      .references(() => professionals.id, { onDelete: 'cascade' }),
    status: applicationStatusEnum('status').notNull().default('received'),
    coverNote: text('cover_note'),
    rejectionReason: text('rejection_reason'),
    // Timestamp of last employer review action — drives the 14-day stale reminder
    lastReviewedAt: timestamp('last_reviewed_at', { withTimezone: true }),
    // Optimistic concurrency — prevents concurrent status transitions overwriting each other.
    // Service layer: UPDATE ... WHERE id = ? AND version = ? → verify rowCount = 1.
    version: integer('version').notNull().default(1),
    // Soft delete — use status='withdrawn' for professional withdrawal.
    // deletedAt is reserved for admin/compliance removal only.
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Uniqueness — one active application per (job, professional) pair
    uqApplicationsJobProfessional: unique('uq_applications_job_professional').on(
      table.jobId,
      table.professionalId,
    ),
    // Employer pipeline — list all applications for a specific job
    idxApplicationsJobId: index('idx_applications_job_id').on(table.jobId),
    // Professional dashboard — list all applications submitted by a professional
    idxApplicationsProfessionalId: index('idx_applications_professional_id').on(table.professionalId),
    // Status filtering — employer pipeline filtered by status
    idxApplicationsStatus: index('idx_applications_status').on(table.status),
    // Stale reminder job — find applications not reviewed in 14 days
    idxApplicationsLastReviewedAt: index('idx_applications_last_reviewed_at').on(table.lastReviewedAt),
    // Soft delete filter
    idxApplicationsDeletedAt: index('idx_applications_deleted_at').on(table.deletedAt),
  }),
);
