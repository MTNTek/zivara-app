# Zivara — Database

## Design Philosophy

Tables are designed around business entities and rules — not around what the UI needs to display or what an API endpoint returns. Every table has one clear responsibility. Relationships are enforced at the database level with foreign keys. No table exists purely as a UI concern.

**JSONB for i18n content.** User-generated content that requires translation (job titles, descriptions, notification bodies) is stored as JSONB: `{ "en": "Construction Worker", "ar": "عامل بناء" }`. Adding a third language (e.g., Chinese) requires inserting a new key into existing records — no schema migration.

**Informational nationality fields.** `professionals.nationality` and `professionals.country_of_origin` are stored for the professional's own use. They are never used as automatic exclusion criteria. The `professionals.show_nationality` flag gives the professional control over whether employers can see this information.

---

## Schema: All 14 Tables

---

### `users`

Central identity and authentication record. One row per registered user regardless of role.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| email | VARCHAR(255) | UNIQUE NOT NULL | Lowercase-normalised on insert |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt, cost factor 12 |
| role | ENUM('professional','employer','admin') | NOT NULL | |
| language_preference | ENUM('en','ar') | NOT NULL DEFAULT 'en' | Used for notification language |
| is_verified_email | BOOLEAN | NOT NULL DEFAULT false | Activated after email verification link clicked |
| is_active | BOOLEAN | NOT NULL DEFAULT true | false = soft-deleted or banned |
| suspended_at | TIMESTAMPTZ | NULL | Populated on suspension |
| suspension_reason | TEXT | NULL | Required when suspended_at is set |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | Updated by Drizzle trigger on any change |

**Indexes:**
- `users_email_idx` UNIQUE on `email`
- `users_role_idx` on `role` (for admin user-list queries)
- `users_is_active_idx` on `is_active` (common filter)

---

### `refresh_tokens`

Stores hashed refresh tokens for session management and rotation.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| user_id | UUID | NOT NULL FK → users.id ON DELETE CASCADE | |
| token_hash | VARCHAR(255) | NOT NULL | SHA-256 hash of the opaque token |
| expires_at | TIMESTAMPTZ | NOT NULL | now() + 30 days at issuance |
| revoked_at | TIMESTAMPTZ | NULL | Set on logout, rotation, or account suspension |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**Indexes:**
- `refresh_tokens_user_id_idx` on `user_id`
- `refresh_tokens_token_hash_idx` on `token_hash` (lookup on every refresh request)

**Notes:** On logout or account suspension, all rows for a `user_id` have `revoked_at` set. On token rotation, the old row is revoked and a new row is inserted atomically.

---

### `professionals`

Professional profile. One-to-one with `users` where role = 'professional'.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| user_id | UUID | NOT NULL FK → users.id UNIQUE | One-to-one relationship enforced |
| full_name | VARCHAR(255) | NOT NULL | |
| phone | VARCHAR(30) | NULL | |
| nationality | VARCHAR(100) | NULL | Informational only |
| show_nationality | BOOLEAN | NOT NULL DEFAULT false | Professional controls employer visibility |
| country_of_origin | VARCHAR(100) | NULL | Informational only — never used for filtering |
| current_city | VARCHAR(100) | NULL | |
| current_country | VARCHAR(100) | NULL | |
| primary_industry | VARCHAR(100) | NULL | One of the 6 Phase 1 industries |
| bio | TEXT | NULL | |
| profile_photo_url | VARCHAR(500) | NULL | S3 presigned path |
| is_profile_public | BOOLEAN | NOT NULL DEFAULT true | false = excluded from employer search |
| verification_status | ENUM('unverified','pending','verified','rejected') | NOT NULL DEFAULT 'unverified' | |
| profile_completeness | SMALLINT | NOT NULL DEFAULT 0 | 0–100; computed and cached on profile update |
| government_id_hash | VARCHAR(255) | NULL | SHA-256 hash; used for duplicate detection only |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**Indexes:**
- `professionals_user_id_idx` UNIQUE on `user_id`
- `professionals_verification_status_idx` on `verification_status`
- `professionals_is_profile_public_idx` on `is_profile_public`
- `professionals_primary_industry_idx` on `primary_industry`
- `professionals_profile_completeness_idx` on `profile_completeness DESC` (search ranking)
- `professionals_government_id_hash_idx` on `government_id_hash` (duplicate detection)

---

### `professional_experience`

Work history entries. Multiple rows per professional.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| professional_id | UUID | NOT NULL FK → professionals.id ON DELETE CASCADE | |
| job_title | VARCHAR(255) | NOT NULL | |
| company_name | VARCHAR(255) | NOT NULL | |
| industry | VARCHAR(100) | NULL | |
| start_date | DATE | NOT NULL | |
| end_date | DATE | NULL | NULL = current position |
| description | TEXT | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**Indexes:**
- `prof_experience_professional_id_idx` on `professional_id`

---

### `professional_skills`

Skills associated with a professional. Multiple rows per professional.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| professional_id | UUID | NOT NULL FK → professionals.id ON DELETE CASCADE | |
| skill_name | VARCHAR(100) | NOT NULL | |
| years_experience | SMALLINT | NULL | Approximate years, provided by professional |

**Indexes:**
- `prof_skills_professional_id_idx` on `professional_id`
- `prof_skills_skill_name_idx` on `skill_name` (search filter)

---

### `professional_documents`

Verification documents uploaded by professionals. Reviewed by administrators.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| professional_id | UUID | NOT NULL FK → professionals.id ON DELETE CASCADE | |
| document_type | ENUM('id','passport','certification','other') | NOT NULL | |
| file_url | VARCHAR(500) | NOT NULL | Private S3 object path; served via presigned URL |
| verification_status | ENUM('pending','approved','rejected') | NOT NULL DEFAULT 'pending' | |
| reviewed_by | UUID | NULL FK → users.id | Admin who reviewed; NULL until reviewed |
| reviewed_at | TIMESTAMPTZ | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**Indexes:**
- `prof_docs_professional_id_idx` on `professional_id`
- `prof_docs_verification_status_idx` on `verification_status`

---

### `employers`

Company profile and verification state. One row per employer company.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| owner_user_id | UUID | NOT NULL FK → users.id | The account Owner; also in employer_members |
| company_name | VARCHAR(255) | NOT NULL | |
| trade_license_number | VARCHAR(100) | UNIQUE NOT NULL | GCC trade license number |
| trade_license_url | VARCHAR(500) | NULL | S3 path to uploaded license document |
| industry | VARCHAR(100) | NOT NULL | |
| description | TEXT | NULL | |
| logo_url | VARCHAR(500) | NULL | |
| website_url | VARCHAR(500) | NULL | |
| employee_count_range | VARCHAR(20) | NULL | e.g. "10-50", "50-200", "200+" |
| operating_country | VARCHAR(100) | NOT NULL | Primary country of operation |
| verification_status | ENUM('unverified','pending','verified','rejected','suspended') | NOT NULL DEFAULT 'unverified' | |
| is_badge_visible | BOOLEAN | NOT NULL DEFAULT false | true only when verified AND no active compliance flags |
| compliance_flag | BOOLEAN | NOT NULL DEFAULT false | Triggers automatic badge removal |
| verified_at | TIMESTAMPTZ | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**Indexes:**
- `employers_owner_user_id_idx` on `owner_user_id`
- `employers_trade_license_number_idx` UNIQUE on `trade_license_number`
- `employers_verification_status_idx` on `verification_status`
- `employers_industry_idx` on `industry`

---

### `employer_members`

Sub-accounts and team members under an employer company.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| employer_id | UUID | NOT NULL FK → employers.id ON DELETE CASCADE | |
| user_id | UUID | NOT NULL FK → users.id ON DELETE CASCADE | |
| role | ENUM('owner','manager','recruiter') | NOT NULL | Controls what actions this member can perform |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**Constraints:**
- UNIQUE on `(employer_id, user_id)` — one membership record per user per company

**Indexes:**
- `employer_members_employer_id_idx` on `employer_id`
- `employer_members_user_id_idx` on `user_id`

---

### `jobs`

Job postings created by employers. Title and description are JSONB for i18n.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| employer_id | UUID | NOT NULL FK → employers.id | |
| created_by | UUID | NOT NULL FK → users.id | Which team member posted the job |
| title | JSONB | NOT NULL | `{ "en": "...", "ar": "..." }` |
| description | JSONB | NOT NULL | `{ "en": "...", "ar": "..." }` |
| industry | VARCHAR(100) | NOT NULL | |
| city | VARCHAR(100) | NOT NULL | |
| country | VARCHAR(100) | NOT NULL | |
| employment_type | ENUM('full_time','part_time','shift_based','contract') | NOT NULL | |
| salary_min | NUMERIC(10,2) | NULL | |
| salary_max | NUMERIC(10,2) | NULL | |
| salary_currency | CHAR(3) | NOT NULL DEFAULT 'AED' | ISO 4217 currency code |
| status | ENUM('draft','active','closed','expired') | NOT NULL DEFAULT 'draft' | |
| view_count | INTEGER | NOT NULL DEFAULT 0 | Incremented on each unique view |
| expires_at | TIMESTAMPTZ | NOT NULL | Set by employer, or DEFAULT now() + 60 days |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**Indexes:**
- `jobs_employer_id_idx` on `employer_id`
- `jobs_status_idx` on `status`
- `jobs_industry_idx` on `industry`
- `jobs_country_city_idx` on `(country, city)`
- `jobs_employment_type_idx` on `employment_type`
- `jobs_expires_at_idx` on `expires_at` (expiry background job)
- `jobs_title_gin_idx` GIN on `title` (full-text search across JSON content)

---

### `job_required_skills`

Skills required for a job posting. Multiple rows per job.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| job_id | UUID | NOT NULL FK → jobs.id ON DELETE CASCADE | |
| skill_name | VARCHAR(100) | NOT NULL | |

**Indexes:**
- `job_skills_job_id_idx` on `job_id`
- `job_skills_skill_name_idx` on `skill_name` (search filter)

---

### `applications`

Application lifecycle for a professional applying to a job.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| job_id | UUID | NOT NULL FK → jobs.id | |
| professional_id | UUID | NOT NULL FK → professionals.id | |
| status | ENUM('received','under_review','shortlisted','rejected','hired','withdrawn') | NOT NULL DEFAULT 'received' | |
| cover_note | TEXT | NULL | Optional short message from professional |
| rejection_reason | TEXT | NULL | Populated only if employer explicitly provides one |
| last_reviewed_at | TIMESTAMPTZ | NULL | Updated on any status change; used for 14-day reminder logic |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**Constraints:**
- UNIQUE on `(job_id, professional_id)` — prevents duplicate applications

**Indexes:**
- `applications_job_id_idx` on `job_id`
- `applications_professional_id_idx` on `professional_id`
- `applications_status_idx` on `status`
- `applications_last_reviewed_at_idx` on `last_reviewed_at` (14-day reminder job)

---

### `shifts`

Scheduled work engagements between an employer and a hired professional.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| employer_id | UUID | NOT NULL FK → employers.id | |
| professional_id | UUID | NOT NULL FK → professionals.id | |
| application_id | UUID | NULL FK → applications.id | Origin application; NULL for shifts created without a job application |
| shift_date | DATE | NOT NULL | |
| start_time | TIME | NOT NULL | |
| end_time | TIME | NOT NULL | |
| location | TEXT | NOT NULL | |
| role_description | TEXT | NOT NULL | What the professional is expected to do |
| status | ENUM('scheduled','confirmed','completed','cancelled','disputed') | NOT NULL DEFAULT 'scheduled' | |
| professional_confirmed_at | TIMESTAMPTZ | NULL | Set when professional confirms attendance |
| employer_confirmed_completion | BOOLEAN | NOT NULL DEFAULT false | |
| professional_confirmed_completion | BOOLEAN | NOT NULL DEFAULT false | Payment triggered when both are true |
| cancelled_by | UUID | NULL FK → users.id | |
| cancellation_reason | TEXT | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**Indexes:**
- `shifts_employer_id_idx` on `employer_id`
- `shifts_professional_id_idx` on `professional_id`
- `shifts_status_idx` on `status`
- `shifts_shift_date_idx` on `shift_date` (calendar views)

---

### `ratings`

Post-shift ratings submitted by either party. Permanent once submitted.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| shift_id | UUID | NOT NULL FK → shifts.id | |
| reviewer_id | UUID | NOT NULL FK → users.id | |
| reviewee_id | UUID | NOT NULL FK → users.id | |
| reviewer_role | ENUM('professional','employer') | NOT NULL | Which role is giving the rating |
| stars | SMALLINT | NOT NULL CHECK (stars BETWEEN 1 AND 5) | |
| review_text | TEXT | NULL | Optional written review |
| moderation_status | ENUM('pending','approved','flagged','removed') | NOT NULL DEFAULT 'approved' | flagged = held for admin review |
| flagged_reason | TEXT | NULL | Set by AI content moderation or manual flag |
| reviewed_by_admin | UUID | NULL FK → users.id | Admin who made moderation decision |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**Constraints:**
- UNIQUE on `(shift_id, reviewer_id)` — one rating per person per shift

**Indexes:**
- `ratings_reviewee_id_idx` on `reviewee_id` (profile average computation)
- `ratings_shift_id_idx` on `shift_id`
- `ratings_moderation_status_idx` on `moderation_status`
- `ratings_created_at_idx` on `created_at DESC` (time-weighted average computation)

---

### `notifications`

In-app notification log. One row per notification event per recipient.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| user_id | UUID | NOT NULL FK → users.id ON DELETE CASCADE | Recipient |
| type | VARCHAR(100) | NOT NULL | e.g. 'application_shortlisted', 'shift_assigned' |
| title | JSONB | NOT NULL | `{ "en": "...", "ar": "..." }` |
| body | JSONB | NOT NULL | `{ "en": "...", "ar": "..." }` |
| reference_type | VARCHAR(50) | NULL | e.g. 'application', 'shift', 'payment' |
| reference_id | UUID | NULL | ID of the referenced entity; enables deep linking |
| is_read | BOOLEAN | NOT NULL DEFAULT false | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**Indexes:**
- `notifications_user_id_idx` on `user_id`
- `notifications_user_id_is_read_idx` on `(user_id, is_read)` (unread count queries)
- `notifications_created_at_idx` on `created_at DESC` (notification center sorted by recency)

---

### `payments`

Payment record created when a shift is confirmed complete by both parties.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| shift_id | UUID | NOT NULL FK → shifts.id UNIQUE | One payment per shift |
| professional_id | UUID | NOT NULL FK → professionals.id | |
| employer_id | UUID | NOT NULL FK → employers.id | |
| gross_amount | NUMERIC(10,2) | NOT NULL | Total amount before platform fee |
| platform_fee | NUMERIC(10,2) | NOT NULL | Zivara service fee |
| net_amount | NUMERIC(10,2) | NOT NULL | gross_amount - platform_fee |
| currency | CHAR(3) | NOT NULL DEFAULT 'AED' | ISO 4217 |
| status | ENUM('pending','processing','completed','failed','disputed','held') | NOT NULL DEFAULT 'pending' | |
| initiated_at | TIMESTAMPTZ | NULL | When payment processing began |
| completed_at | TIMESTAMPTZ | NULL | When payment was successfully transferred |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**Indexes:**
- `payments_shift_id_idx` UNIQUE on `shift_id`
- `payments_professional_id_idx` on `professional_id` (earnings view)
- `payments_employer_id_idx` on `employer_id` (billing view)
- `payments_status_idx` on `status`

---

### `audit_logs`

Append-only log of every action taken by an administrator. Never modified.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| admin_id | UUID | NOT NULL FK → users.id | The administrator who performed the action |
| action | VARCHAR(100) | NOT NULL | e.g. 'employer_verified', 'account_suspended', 'rating_removed' |
| target_type | VARCHAR(50) | NOT NULL | e.g. 'employer', 'professional', 'rating', 'dispute' |
| target_id | UUID | NOT NULL | ID of the affected entity |
| reason | TEXT | NOT NULL | Mandatory: every admin action requires a stated reason |
| metadata | JSONB | NULL | Additional context (e.g., previous status, documents reviewed) |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**Indexes:**
- `audit_logs_admin_id_idx` on `admin_id`
- `audit_logs_target_type_target_id_idx` on `(target_type, target_id)` (audit history for an entity)
- `audit_logs_created_at_idx` on `created_at DESC`

**Note:** No UPDATE or DELETE is ever issued against this table. Rows are inserted only.

---

## Relationships

```
users (1) ──────────────────── (0..1) professionals
users (1) ──────────────────── (0..*) employer_members
users (1) ──────────────────── (0..*) refresh_tokens
users (1) ──────────────────── (0..*) notifications

professionals (1) ──────────── (0..*) professional_experience
professionals (1) ──────────── (0..*) professional_skills
professionals (1) ──────────── (0..*) professional_documents
professionals (1) ──────────── (0..*) applications
professionals (1) ──────────── (0..*) shifts
professionals (1) ──────────── (0..*) payments

employers (1) ───────────────── (0..*) employer_members
employers (1) ───────────────── (0..*) jobs
employers (1) ───────────────── (0..*) shifts
employers (1) ───────────────── (0..*) payments

jobs (1) ────────────────────── (0..*) job_required_skills
jobs (1) ────────────────────── (0..*) applications

applications (1) ────────────── (0..1) shifts

shifts (1) ──────────────────── (0..2) ratings  [one per side]
shifts (1) ──────────────────── (0..1) payments

users (1) ───────────────────── (0..*) audit_logs [as admin_id]
```

---

## Indexing Strategy

All primary keys use UUID with `gen_random_uuid()` — no sequential integer IDs exposed externally.

**Standard index patterns:**
- Every foreign key column has an index (cascade lookup and join performance)
- Columns used in `WHERE` clauses for filtering have individual indexes
- Columns used in `ORDER BY` on large tables have directional indexes (e.g., `created_at DESC`)
- Columns used in GIN indexes support full-text search on JSONB content (e.g., `jobs.title`)
- Composite indexes are added where combined filter patterns are frequent and well-understood

**What is not indexed:**
- Columns updated frequently with low selectivity (e.g., `view_count`, `is_read`)
- Boolean columns on small tables where a full scan is faster than an index

---

## Migration Approach

Migrations use Drizzle ORM's migration tooling (`drizzle-kit`).

**Rules:**
- Every schema change produces a new migration file in `apps/api/src/database/migrations/`
- Migration files are named with a sequential timestamp prefix: `0001_initial_schema.sql`, `0002_add_show_nationality.sql`
- Migrations are forward-only. No rollback scripts. If a change needs to be undone, a new migration reverts it
- Migrations are run automatically on application startup in development. In production, migrations are run as a pre-deployment step in the CI/CD pipeline before new containers are deployed
- Every migration is reviewed before merge. Destructive operations (DROP COLUMN, DROP TABLE) require explicit sign-off

**Initial migration** (`0001_initial_schema.sql`) creates all 14 tables, all foreign key constraints, all check constraints, and all indexes in dependency order.
