import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  numeric,
  integer,
  jsonb,
  pgEnum,
  char,
  index,
} from 'drizzle-orm/pg-core';
import { employers } from './employers';
import { users } from './users';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const employmentTypeEnum = pgEnum('employment_type', [
  'full_time',
  'part_time',
  'shift_based',
  'contract',
]);

export const jobStatusEnum = pgEnum('job_status', [
  'draft',
  'active',
  'closed',
  'expired',
]);

// ─── jobs ─────────────────────────────────────────────────────────────────────

export const jobs = pgTable(
  'jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    employerId: uuid('employer_id')
      .notNull()
      .references(() => employers.id, { onDelete: 'cascade' }),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    // JSONB stores translations: { "en": "Construction Worker", "ar": "عامل بناء" }
    // Adding a new language is inserting a new key — no migration required.
    title: jsonb('title').$type<Record<string, string>>().notNull(),
    description: jsonb('description').$type<Record<string, string>>().notNull(),
    industry: varchar('industry').notNull(),
    city: varchar('city').notNull(),
    country: varchar('country').notNull(),
    employmentType: employmentTypeEnum('employment_type').notNull(),
    salaryMin: numeric('salary_min', { precision: 10, scale: 2 }),
    salaryMax: numeric('salary_max', { precision: 10, scale: 2 }),
    salaryCurrency: char('salary_currency', { length: 3 }).notNull().default('AED'),
    status: jobStatusEnum('status').notNull().default('draft'),
    viewCount: integer('view_count').notNull().default(0),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    // Optimistic concurrency — increment on every UPDATE to detect stale writes.
    // Service layer checks: UPDATE ... WHERE id = ? AND version = ? then verifies rowCount = 1.
    version: integer('version').notNull().default(1),
    // Soft delete — preserves applications and payment history linked to this job
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    idxJobsStatus: index('idx_jobs_status').on(table.status),
    idxJobsIndustry: index('idx_jobs_industry').on(table.industry),
    idxJobsCity: index('idx_jobs_city').on(table.city),
    idxJobsCountry: index('idx_jobs_country').on(table.country),
    idxJobsEmploymentType: index('idx_jobs_employment_type').on(table.employmentType),
    // Expiry sweep — scheduled job queries active jobs past their expiry date
    idxJobsExpiresAt: index('idx_jobs_expires_at').on(table.expiresAt),
    // Employer dashboard — list all jobs for a given employer
    idxJobsEmployerId: index('idx_jobs_employer_id').on(table.employerId),
    // Soft delete filter
    idxJobsDeletedAt: index('idx_jobs_deleted_at').on(table.deletedAt),
  }),
);

// ─── job_required_skills ──────────────────────────────────────────────────────

export const jobRequiredSkills = pgTable(
  'job_required_skills',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobId: uuid('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    skillName: varchar('skill_name').notNull(),
  },
  (table) => ({
    idxJobRequiredSkillsJobId: index('idx_job_required_skills_job_id').on(table.jobId),
    // Skill-based job matching — find jobs requiring a given skill
    idxJobRequiredSkillsName: index('idx_job_required_skills_name').on(table.skillName),
  }),
);
