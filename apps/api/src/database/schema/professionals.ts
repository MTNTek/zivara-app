import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  date,
  smallint,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const professionalVerificationStatusEnum = pgEnum(
  'professional_verification_status',
  ['unverified', 'pending', 'verified', 'rejected'],
);

export const documentTypeEnum = pgEnum('document_type', [
  'id',
  'passport',
  'certification',
  'other',
]);

export const documentVerificationStatusEnum = pgEnum(
  'document_verification_status',
  ['pending', 'approved', 'rejected'],
);

// ─── professionals ────────────────────────────────────────────────────────────

export const professionals = pgTable(
  'professionals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    fullName: varchar('full_name').notNull(),
    phone: varchar('phone'),
    nationality: varchar('nationality'),
    // Professional controls whether employers can see their nationality
    showNationality: boolean('show_nationality').notNull().default(false),
    // Informational only — never used as an automatic filter criterion
    countryOfOrigin: varchar('country_of_origin'),
    currentCity: varchar('current_city'),
    currentCountry: varchar('current_country'),
    primaryIndustry: varchar('primary_industry'),
    bio: text('bio'),
    profilePhotoUrl: varchar('profile_photo_url'),
    isProfilePublic: boolean('is_profile_public').notNull().default(true),
    verificationStatus: professionalVerificationStatusEnum('verification_status')
      .notNull()
      .default('unverified'),
    // Cached 0–100 completeness score — recomputed on profile update
    profileCompleteness: smallint('profile_completeness').notNull().default(0),
    // Hashed government ID for duplicate detection — never stored in plain text
    governmentIdHash: varchar('government_id_hash'),
    // Soft delete — profile data retained for dispute resolution and audit purposes
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    idxProfessionalsIndustry: index('idx_professionals_industry').on(table.primaryIndustry),
    idxProfessionalsCity: index('idx_professionals_city').on(table.currentCity),
    idxProfessionalsCountry: index('idx_professionals_country').on(table.currentCountry),
    idxProfessionalsVerification: index('idx_professionals_verification').on(table.verificationStatus),
    idxProfessionalsPublic: index('idx_professionals_public').on(table.isProfilePublic),
    idxProfessionalsCompleteness: index('idx_professionals_completeness').on(table.profileCompleteness),
    idxProfessionalsGovIdHash: index('idx_professionals_gov_id_hash').on(table.governmentIdHash),
    idxProfessionalsDeletedAt: index('idx_professionals_deleted_at').on(table.deletedAt),
  }),
);

// ─── professional_experience ──────────────────────────────────────────────────

export const professionalExperience = pgTable(
  'professional_experience',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    professionalId: uuid('professional_id')
      .notNull()
      .references(() => professionals.id, { onDelete: 'cascade' }),
    jobTitle: varchar('job_title').notNull(),
    companyName: varchar('company_name').notNull(),
    industry: varchar('industry'),
    startDate: date('start_date').notNull(),
    // null = current position
    endDate: date('end_date'),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    idxProfessionalExperienceProfessionalId: index('idx_professional_experience_professional_id').on(table.professionalId),
  }),
);

// ─── professional_skills ──────────────────────────────────────────────────────

export const professionalSkills = pgTable(
  'professional_skills',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    professionalId: uuid('professional_id')
      .notNull()
      .references(() => professionals.id, { onDelete: 'cascade' }),
    skillName: varchar('skill_name').notNull(),
    yearsExperience: smallint('years_experience'),
  },
  (table) => ({
    idxProfessionalSkillsProfessionalId: index('idx_professional_skills_professional_id').on(table.professionalId),
    // Skill-name search — used when matching jobs to professionals
    idxProfessionalSkillsName: index('idx_professional_skills_name').on(table.skillName),
  }),
);

// ─── professional_documents ───────────────────────────────────────────────────

export const professionalDocuments = pgTable(
  'professional_documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    professionalId: uuid('professional_id')
      .notNull()
      .references(() => professionals.id, { onDelete: 'cascade' }),
    documentType: documentTypeEnum('document_type').notNull(),
    fileUrl: varchar('file_url').notNull(),
    verificationStatus: documentVerificationStatusEnum('verification_status')
      .notNull()
      .default('pending'),
    reviewedBy: uuid('reviewed_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    idxProfessionalDocumentsProfessionalId: index('idx_professional_documents_professional_id').on(table.professionalId),
    // Admin verification queue — filter by pending documents
    idxProfessionalDocumentsVerificationStatus: index('idx_professional_documents_verification_status').on(table.verificationStatus),
  }),
);
