import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const employerVerificationStatusEnum = pgEnum(
  'employer_verification_status',
  ['unverified', 'pending', 'verified', 'rejected', 'suspended'],
);

export const employerMemberRoleEnum = pgEnum('employer_member_role', [
  'owner',
  'manager',
  'recruiter',
]);

// ─── employers ────────────────────────────────────────────────────────────────

export const employers = pgTable(
  'employers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerUserId: uuid('owner_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    companyName: varchar('company_name').notNull(),
    tradeLicenseNumber: varchar('trade_license_number').notNull().unique(),
    tradeLicenseUrl: varchar('trade_license_url'),
    industry: varchar('industry').notNull(),
    description: text('description'),
    logoUrl: varchar('logo_url'),
    websiteUrl: varchar('website_url'),
    employeeCountRange: varchar('employee_count_range'),
    operatingCountry: varchar('operating_country').notNull(),
    verificationStatus: employerVerificationStatusEnum('verification_status')
      .notNull()
      .default('unverified'),
    // true only when verification_status = 'verified' AND compliance_flag = false AND not suspended
    isBadgeVisible: boolean('is_badge_visible').notNull().default(false),
    // Set to true when a compliance issue is raised — triggers badge removal
    complianceFlag: boolean('compliance_flag').notNull().default(false),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    // Soft delete — preserves job posting and payment history linkage
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    idxEmployersVerificationStatus: index('idx_employers_verification_status').on(table.verificationStatus),
    idxEmployersIndustry: index('idx_employers_industry').on(table.industry),
    idxEmployersCountry: index('idx_employers_country').on(table.operatingCountry),
    idxEmployersDeletedAt: index('idx_employers_deleted_at').on(table.deletedAt),
    idxEmployersBadge: index('idx_employers_badge').on(table.isBadgeVisible),
  }),
);

// ─── employer_members ─────────────────────────────────────────────────────────

export const employerMembers = pgTable(
  'employer_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    employerId: uuid('employer_id')
      .notNull()
      .references(() => employers.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: employerMemberRoleEnum('role').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Membership lookup — "which employer does this user belong to?"
    idxEmployerMembersUserId: index('idx_employer_members_user_id').on(table.userId),
    // Team management — list all members of an employer account
    idxEmployerMembersEmployerId: index('idx_employer_members_employer_id').on(table.employerId),
  }),
);
