# Design Document

## Overview

Zivara is a production-grade workforce marketplace for the GCC. The architecture follows a monorepo structure with two independent applications — a Next.js frontend and a NestJS backend — backed by PostgreSQL via Drizzle ORM. The system is designed around business domains, not UI pages or API endpoints. Every major decision prioritizes trust, simplicity, and long-term maintainability over cleverness or premature optimization.

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Clients                              │
│   Browser (Next.js SSR/CSR)     Flutter Mobile (Phase 2)    │
└───────────────────┬─────────────────────────────────────────┘
                    │ HTTPS / TLS 1.2+
┌───────────────────▼─────────────────────────────────────────┐
│                   Nginx (Reverse Proxy)                     │
│          SSL termination · Rate limiting · Routing          │
└──────────┬────────────────────────────┬─────────────────────┘
           │                            │
┌──────────▼──────────┐    ┌────────────▼────────────────────┐
│   Next.js Web App   │    │      NestJS REST API            │
│   apps/web          │    │      apps/api                   │
│   Port 3000         │    │      Port 4000                  │
└─────────────────────┘    └────────────┬────────────────────┘
                                        │
                           ┌────────────▼────────────────────┐
                           │     PostgreSQL Database          │
                           │     Drizzle ORM                  │
                           └─────────────────────────────────┘
```

**Why this shape?**
- Nginx in front handles SSL, rate limiting, and routes `/api/*` to the API and everything else to the web app. This is the simplest production-grade setup with no over-engineering.
- The frontend and backend are fully decoupled. The web app talks to the API over HTTP, exactly as the Flutter mobile app will — no special coupling.
- One database. PostgreSQL is battle-tested, relational data fits the domain perfectly, and a single database keeps operations simple at Phase 1 scale.

---

## Monorepo Structure

**Why a monorepo?** Shared TypeScript types between frontend and backend eliminate an entire class of bugs. A single repository means one CI pipeline, one place to manage dependencies, and atomic commits across layers.

```
zivara/
├── apps/
│   ├── api/                    # NestJS backend
│   └── web/                    # Next.js frontend
├── packages/
│   └── shared/                 # Shared TypeScript types, enums, constants
├── docs/                       # All documentation files
│   ├── VISION.md
│   ├── PRODUCT.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── CHANGELOG.md
├── docker-compose.yml          # Local dev: postgres + api + web
├── docker-compose.prod.yml     # Production overrides
├── .env.example
├── README.md
├── package.json                # Root workspace config (pnpm/npm workspaces)
└── tsconfig.base.json          # Shared TS config
```

Every folder has a single, clear purpose. No `utils`, no `helpers`, no `misc`.


---

## Backend Structure (`apps/api`)

The API is organized by **business domain modules**, not by technical layers. Each module owns its entire vertical slice.

```
apps/api/
├── src/
│   ├── main.ts                     # Bootstrap, validation pipe, global config
│   ├── app.module.ts               # Root module — imports all feature modules
│   │
│   ├── config/                     # Environment validation (Joi/zod schema)
│   │   └── config.schema.ts
│   │
│   ├── database/                   # Drizzle ORM setup, schema exports, migrations
│   │   ├── database.module.ts
│   │   ├── schema/                 # One file per domain entity
│   │   │   ├── users.ts
│   │   │   ├── professionals.ts
│   │   │   ├── employers.ts
│   │   │   ├── jobs.ts
│   │   │   ├── applications.ts
│   │   │   ├── shifts.ts
│   │   │   ├── ratings.ts
│   │   │   ├── notifications.ts
│   │   │   ├── payments.ts
│   │   │   └── audit-logs.ts
│   │   └── migrations/             # Drizzle-generated migration files
│   │
│   ├── common/                     # Shared guards, decorators, interceptors, pipes
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts
│   │   │   └── current-user.decorator.ts
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts
│   │   └── filters/
│   │       └── http-exception.filter.ts
│   │
│   ├── auth/                       # Authentication & token management
│   ├── professionals/              # Professional profiles, documents, verification
│   ├── employers/                  # Employer profiles, sub-accounts, verification
│   ├── jobs/                       # Job postings, search, AI suggestions
│   ├── applications/               # Application lifecycle, status transitions
│   ├── notifications/              # Notification dispatch, preferences
│   ├── shifts/                     # Shift scheduling, confirmation, disputes
│   ├── ratings/                    # Ratings, reviews, moderation
│   ├── payments/                   # Payment processing, earnings, billing
│   ├── search/                     # Unified search across jobs and professionals
│   └── admin/                      # Admin portal — verification, disputes, analytics
│
├── test/                           # E2E tests (supertest)
├── Dockerfile
├── package.json
└── tsconfig.json
```

### Module Structure (pattern applied to every module)

Each module is fully self-contained. Using `auth` as an example:

```
auth/
├── auth.module.ts
├── auth.controller.ts          # HTTP routes
├── auth.service.ts             # Business logic
├── auth.repository.ts          # Database queries (Drizzle)
├── dto/
│   ├── register.dto.ts
│   ├── login.dto.ts
│   └── refresh-token.dto.ts
├── strategies/
│   ├── jwt.strategy.ts
│   └── jwt-refresh.strategy.ts
└── auth.service.spec.ts        # Unit tests
```

**Why this pattern?** The controller handles HTTP concerns only. The service owns all business logic. The repository owns all database access. This makes each layer independently testable and easy to replace.


---

## Frontend Structure (`apps/web`)

The frontend uses Next.js App Router with TypeScript, Tailwind CSS, and shadcn/ui. Pages are organized by user role and domain, not by UI component type.

```
apps/web/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (public)/               # Unauthenticated pages (job browse, landing)
│   │   │   ├── page.tsx            # Home / landing
│   │   │   ├── jobs/
│   │   │   │   ├── page.tsx        # Public job listings
│   │   │   │   └── [id]/page.tsx   # Public job detail
│   │   │   └── employers/
│   │   │       └── [id]/page.tsx   # Public employer profile
│   │   │
│   │   ├── (auth)/                 # Auth flows
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   │
│   │   ├── (professional)/         # Professional dashboard (authenticated)
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── applications/page.tsx
│   │   │   ├── shifts/page.tsx
│   │   │   └── notifications/page.tsx
│   │   │
│   │   ├── (employer)/             # Employer dashboard (authenticated)
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── jobs/
│   │   │   │   ├── page.tsx        # Job listing management
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── applications/page.tsx
│   │   │   ├── professionals/page.tsx
│   │   │   ├── shifts/page.tsx
│   │   │   └── billing/page.tsx
│   │   │
│   │   └── (admin)/                # Admin portal (protected route, admin role only)
│   │       ├── layout.tsx
│   │       ├── dashboard/page.tsx
│   │       ├── verifications/page.tsx
│   │       ├── disputes/page.tsx
│   │       ├── users/page.tsx
│   │       └── analytics/page.tsx
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn/ui primitives (auto-generated, not hand-written)
│   │   └── [domain]/               # Domain-specific composed components
│   │       ├── job-card.tsx
│   │       ├── professional-card.tsx
│   │       ├── application-status-badge.tsx
│   │       └── rating-stars.tsx
│   │
│   ├── lib/
│   │   ├── api-client.ts           # Typed fetch wrapper for API calls
│   │   ├── auth.ts                 # Auth state helpers
│   │   └── i18n.ts                 # next-intl setup
│   │
│   ├── hooks/                      # Custom React hooks
│   ├── messages/                   # i18n translation files
│   │   ├── en.json
│   │   └── ar.json
│   └── middleware.ts               # Route protection + locale detection
│
├── public/
├── Dockerfile
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

**Key decisions:**
- Route groups `(public)`, `(auth)`, `(professional)`, `(employer)`, `(admin)` map directly to user roles. Each group has its own layout with appropriate auth guards. This makes access control visual and structural — not just a runtime check.
- `components/ui/` is owned by shadcn — never edited directly. Domain components in `components/[domain]/` are hand-crafted and composable.
- Translation files live at `messages/en.json` and `messages/ar.json`. Adding Chinese is adding `messages/zh.json` — no code changes.


---

## Shared Package (`packages/shared`)

```
packages/shared/
├── src/
│   ├── types/
│   │   ├── user.types.ts           # UserRole enum, base user interfaces
│   │   ├── job.types.ts            # JobStatus, EmploymentType enums
│   │   ├── application.types.ts    # ApplicationStatus enum
│   │   ├── shift.types.ts          # ShiftStatus enum
│   │   └── notification.types.ts   # NotificationType enum
│   └── index.ts
├── package.json
└── tsconfig.json
```

**Why?** Enums like `ApplicationStatus` defined once and imported by both the API and web app means the compiler catches mismatches at build time — not at runtime in production.

---

## Database Design

### Design Philosophy

Tables are designed around business entities and rules — not around what the UI needs to display. Every table has one clear responsibility. Relationships are enforced at the database level with foreign keys.

### i18n Strategy

For user-generated content that requires translation (job titles, descriptions, etc.), a JSONB column stores translations:

```sql
-- Example: job title stored as JSONB
title JSONB NOT NULL  -- { "en": "Construction Worker", "ar": "عامل بناء" }
```

Adding a new language is inserting a new key into existing JSONB objects — no schema migration required.

For platform-owned UI strings, translation files (`en.json`, `ar.json`) handle it entirely on the frontend.

### Core Schema

#### `users` — Identity and authentication

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| email | VARCHAR UNIQUE NOT NULL | |
| password_hash | VARCHAR NOT NULL | bcrypt, cost 12 |
| role | ENUM('professional','employer','admin') NOT NULL | |
| language_preference | ENUM('en','ar') DEFAULT 'en' | |
| is_verified_email | BOOLEAN DEFAULT false | |
| is_active | BOOLEAN DEFAULT true | |
| suspended_at | TIMESTAMPTZ NULL | |
| suspension_reason | TEXT NULL | |
| created_at | TIMESTAMPTZ DEFAULT now() | |
| updated_at | TIMESTAMPTZ DEFAULT now() | |

#### `refresh_tokens` — Session management

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → users.id | |
| token_hash | VARCHAR NOT NULL | hashed before storage |
| expires_at | TIMESTAMPTZ NOT NULL | |
| revoked_at | TIMESTAMPTZ NULL | |
| created_at | TIMESTAMPTZ DEFAULT now() | |

#### `professionals` — Professional profile

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → users.id UNIQUE | one-to-one |
| full_name | VARCHAR NOT NULL | |
| phone | VARCHAR | |
| nationality | VARCHAR | informational only |
| show_nationality | BOOLEAN DEFAULT false | professional controls visibility |
| country_of_origin | VARCHAR | informational only — never used for filtering |
| current_city | VARCHAR | |
| current_country | VARCHAR | |
| primary_industry | VARCHAR | |
| bio | TEXT NULL | |
| profile_photo_url | VARCHAR NULL | |
| is_profile_public | BOOLEAN DEFAULT true | |
| verification_status | ENUM('unverified','pending','verified','rejected') DEFAULT 'unverified' | |
| profile_completeness | SMALLINT DEFAULT 0 | 0–100, computed and cached |
| government_id_hash | VARCHAR NULL | hashed for duplicate detection only |
| created_at | TIMESTAMPTZ DEFAULT now() | |
| updated_at | TIMESTAMPTZ DEFAULT now() | |


#### `professional_experience` — Work history

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| professional_id | UUID FK → professionals.id | |
| job_title | VARCHAR NOT NULL | |
| company_name | VARCHAR NOT NULL | |
| industry | VARCHAR | |
| start_date | DATE NOT NULL | |
| end_date | DATE NULL | null = current job |
| description | TEXT NULL | |
| created_at | TIMESTAMPTZ DEFAULT now() | |

#### `professional_skills` — Skills junction

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| professional_id | UUID FK → professionals.id | |
| skill_name | VARCHAR NOT NULL | |
| years_experience | SMALLINT NULL | |

#### `professional_documents` — Uploaded verification documents

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| professional_id | UUID FK → professionals.id | |
| document_type | ENUM('id','passport','certification','other') | |
| file_url | VARCHAR NOT NULL | S3 presigned path |
| verification_status | ENUM('pending','approved','rejected') DEFAULT 'pending' | |
| reviewed_by | UUID FK → users.id NULL | admin who reviewed |
| reviewed_at | TIMESTAMPTZ NULL | |
| created_at | TIMESTAMPTZ DEFAULT now() | |

#### `employers` — Company profile

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| owner_user_id | UUID FK → users.id | the account owner |
| company_name | VARCHAR NOT NULL | |
| trade_license_number | VARCHAR UNIQUE NOT NULL | |
| trade_license_url | VARCHAR NULL | |
| industry | VARCHAR NOT NULL | |
| description | TEXT NULL | |
| logo_url | VARCHAR NULL | |
| website_url | VARCHAR NULL | |
| employee_count_range | VARCHAR NULL | e.g. "10-50" |
| operating_country | VARCHAR NOT NULL | |
| verification_status | ENUM('unverified','pending','verified','rejected','suspended') DEFAULT 'unverified' | |
| is_badge_visible | BOOLEAN DEFAULT false | true only when verified + in good standing |
| compliance_flag | BOOLEAN DEFAULT false | triggers badge removal |
| verified_at | TIMESTAMPTZ NULL | |
| created_at | TIMESTAMPTZ DEFAULT now() | |
| updated_at | TIMESTAMPTZ DEFAULT now() | |

#### `employer_members` — Sub-accounts / team members

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| employer_id | UUID FK → employers.id | |
| user_id | UUID FK → users.id | |
| role | ENUM('owner','manager','recruiter') NOT NULL | |
| created_at | TIMESTAMPTZ DEFAULT now() | |

#### `jobs` — Job postings

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| employer_id | UUID FK → employers.id | |
| created_by | UUID FK → users.id | which team member posted |
| title | JSONB NOT NULL | { "en": "...", "ar": "..." } |
| description | JSONB NOT NULL | |
| industry | VARCHAR NOT NULL | |
| city | VARCHAR NOT NULL | |
| country | VARCHAR NOT NULL | |
| employment_type | ENUM('full_time','part_time','shift_based','contract') NOT NULL | |
| salary_min | NUMERIC(10,2) NULL | |
| salary_max | NUMERIC(10,2) NULL | |
| salary_currency | CHAR(3) DEFAULT 'AED' | ISO 4217 |
| status | ENUM('draft','active','closed','expired') DEFAULT 'draft' | |
| view_count | INTEGER DEFAULT 0 | |
| expires_at | TIMESTAMPTZ NOT NULL | employer-set or now() + 60 days |
| created_at | TIMESTAMPTZ DEFAULT now() | |
| updated_at | TIMESTAMPTZ DEFAULT now() | |

#### `job_required_skills` — Skills for a job

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| job_id | UUID FK → jobs.id | |
| skill_name | VARCHAR NOT NULL | |


#### `applications` — Job applications

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| job_id | UUID FK → jobs.id | |
| professional_id | UUID FK → professionals.id | |
| status | ENUM('received','under_review','shortlisted','rejected','hired','withdrawn') DEFAULT 'received' | |
| cover_note | TEXT NULL | optional short message |
| rejection_reason | TEXT NULL | only if employer provides one |
| last_reviewed_at | TIMESTAMPTZ NULL | for 14-day reminder logic |
| created_at | TIMESTAMPTZ DEFAULT now() | |
| updated_at | TIMESTAMPTZ DEFAULT now() | |
| UNIQUE (job_id, professional_id) | | prevents duplicate applications |

#### `shifts` — Scheduled work engagements

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| employer_id | UUID FK → employers.id | |
| professional_id | UUID FK → professionals.id | |
| application_id | UUID FK → applications.id NULL | origin application |
| shift_date | DATE NOT NULL | |
| start_time | TIME NOT NULL | |
| end_time | TIME NOT NULL | |
| location | TEXT NOT NULL | |
| role_description | TEXT NOT NULL | |
| status | ENUM('scheduled','confirmed','completed','cancelled','disputed') DEFAULT 'scheduled' | |
| professional_confirmed_at | TIMESTAMPTZ NULL | |
| employer_confirmed_completion | BOOLEAN DEFAULT false | |
| professional_confirmed_completion | BOOLEAN DEFAULT false | |
| cancelled_by | UUID FK → users.id NULL | |
| cancellation_reason | TEXT NULL | |
| created_at | TIMESTAMPTZ DEFAULT now() | |
| updated_at | TIMESTAMPTZ DEFAULT now() | |

#### `ratings` — Post-shift ratings

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| shift_id | UUID FK → shifts.id | |
| reviewer_id | UUID FK → users.id | |
| reviewee_id | UUID FK → users.id | |
| reviewer_role | ENUM('professional','employer') | |
| stars | SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5) | |
| review_text | TEXT NULL | |
| moderation_status | ENUM('pending','approved','flagged','removed') DEFAULT 'approved' | |
| flagged_reason | TEXT NULL | |
| reviewed_by_admin | UUID FK → users.id NULL | |
| created_at | TIMESTAMPTZ DEFAULT now() | |

#### `notifications` — In-app notification log

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → users.id | recipient |
| type | VARCHAR NOT NULL | e.g. 'application_shortlisted', 'shift_assigned' |
| title | JSONB NOT NULL | { "en": "...", "ar": "..." } |
| body | JSONB NOT NULL | |
| reference_type | VARCHAR NULL | e.g. 'application', 'shift' |
| reference_id | UUID NULL | |
| is_read | BOOLEAN DEFAULT false | |
| created_at | TIMESTAMPTZ DEFAULT now() | |

#### `payments` — Payment records

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| shift_id | UUID FK → shifts.id | |
| professional_id | UUID FK → professionals.id | |
| employer_id | UUID FK → employers.id | |
| gross_amount | NUMERIC(10,2) NOT NULL | |
| platform_fee | NUMERIC(10,2) NOT NULL | |
| net_amount | NUMERIC(10,2) NOT NULL | |
| currency | CHAR(3) DEFAULT 'AED' | |
| status | ENUM('pending','processing','completed','failed','disputed','held') DEFAULT 'pending' | |
| initiated_at | TIMESTAMPTZ NULL | |
| completed_at | TIMESTAMPTZ NULL | |
| created_at | TIMESTAMPTZ DEFAULT now() | |
| updated_at | TIMESTAMPTZ DEFAULT now() | |

#### `audit_logs` — Admin action audit trail

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| admin_id | UUID FK → users.id | |
| action | VARCHAR NOT NULL | e.g. 'employer_verified', 'account_suspended' |
| target_type | VARCHAR NOT NULL | e.g. 'employer', 'professional', 'rating' |
| target_id | UUID NOT NULL | |
| reason | TEXT NOT NULL | required for every admin action |
| metadata | JSONB NULL | additional context |
| created_at | TIMESTAMPTZ DEFAULT now() | |


---

## Authentication Design

### Token Strategy

- **Access token**: JWT, 15-minute expiry, signed with RS256, contains `userId`, `role`, `employerId` (if applicable)
- **Refresh token**: opaque random token, stored as a hash in `refresh_tokens` table, 30-day expiry
- **Rotation**: every refresh call invalidates the old token and issues a new one
- **Revocation**: logout and account suspension both write `revoked_at` to all matching rows in `refresh_tokens`

### RBAC

Three roles: `professional`, `employer`, `admin`. Guards applied at the controller method level using a `@Roles()` decorator. The `RolesGuard` reads the role from the JWT payload and compares against the decorator value. No permission table needed at Phase 1 — role-level access is sufficient.

Employer sub-accounts (Owner / Manager / Recruiter) are enforced at the service layer by checking `employer_members.role` for sensitive operations (e.g., only Owner can delete a job posting).

---

## i18n Design

### Backend
- All user-facing strings returned from the API are in JSONB format: `{ "en": "...", "ar": "..." }`
- Notification content is generated server-side in the recipient's `language_preference`
- Email templates exist for both languages, selected at send time

### Frontend
- `next-intl` handles all UI string translations
- RTL layout is applied globally via `dir="rtl"` on `<html>` when `locale === 'ar'`
- Tailwind's `rtl:` variant handles layout mirroring
- Adding a new language: add `messages/zh.json`, register the locale in next-intl config — zero code changes elsewhere

---

## AI Integration Design

AI runs entirely as background infrastructure. It is never surfaced to users as "AI."

| Capability | Where it runs | What it returns |
|---|---|---|
| Job–professional matching | Background job, triggered on new job post | Ranked list of professional IDs stored in a `job_suggestions` cache |
| Professional recommendations for employers | Search service | Adjusted relevance scores |
| Duplicate detection | Registration service | Flag for admin review |
| Rating content moderation | Rating submission | `flagged` status if prohibited content detected |
| Search ranking | Search service | Relevance score multiplier |

All AI decisions are logged with their input features and output scores in a separate `ai_decisions` table for explainability and administrator review. AI never takes an action autonomously — it only influences ranking and flags items for human review.

---

## Security Design

| Concern | Approach |
|---|---|
| SQL injection | Drizzle ORM parameterized queries — no raw SQL with user input |
| XSS | Next.js escapes by default; `DOMPurify` for any user-generated HTML |
| CSRF | SameSite cookie + custom header check on state-mutating requests |
| Brute force | Nginx rate limiting (5 req/min on auth endpoints) + account lockout after 10 failed attempts |
| Data at rest | AWS RDS encryption (AES-256) |
| Data in transit | TLS 1.2+ enforced at Nginx |
| Secrets | Environment variables only — never in code or git |
| File uploads | Validated by MIME type + file size limit (10MB); stored in private S3 bucket, accessed via presigned URLs |

---

## Infrastructure Design

```
AWS
├── ECS Fargate            # API containers (auto-scaling)
├── ECS Fargate            # Web containers (auto-scaling)
├── RDS PostgreSQL         # Multi-AZ for production
├── S3                     # Document and image storage
├── CloudFront             # CDN for static assets
├── SES                    # Transactional email
├── ALB                    # Load balancer (replaces Nginx in AWS)
└── ECR                    # Container registry
```

**Local development** uses `docker-compose.yml` with Nginx, the API, the web app, and PostgreSQL — mirroring production closely without cloud cost.

---

## Development Roadmap

Build order follows the approved specification exactly:

| Phase | Module | Dependencies |
|---|---|---|
| 1 | Project Foundation | — |
| 2 | Database schema + migrations | Foundation |
| 3 | Authentication | Database |
| 4 | Professional Module | Auth |
| 5 | Employer Module | Auth |
| 6 | Jobs | Employer |
| 7 | Applications | Jobs, Professional |
| 8 | Notifications | Applications |
| 9 | Shifts | Applications |
| 10 | Ratings | Shifts |
| 11 | Payments | Shifts |
| 12 | Search & Discovery | Jobs, Professional |
| 13 | Admin Portal | All modules |
| 14 | Production Infrastructure | All modules |
| 15 | Mobile (Flutter) | Stable backend API |

No phase starts until the previous phase has complete tests, complete UX review, security review, and documentation update.

---

## Components and Interfaces

### Backend Components

#### `AuthService`
- `register(dto: RegisterDto): Promise<UserDto>` — creates user, hashes password, sends verification email
- `login(dto: LoginDto): Promise<TokenPairDto>` — validates credentials, issues JWT + refresh token
- `refreshTokens(token: string): Promise<TokenPairDto>` — rotates refresh token, issues new access token
- `logout(userId: string): Promise<void>` — revokes all refresh tokens for user
- `resetPassword(token: string, newPassword: string): Promise<void>`

#### `ProfessionalsService`
- `createProfile(userId: string, dto: CreateProfessionalDto): Promise<ProfessionalDto>`
- `updateProfile(id: string, dto: UpdateProfessionalDto): Promise<ProfessionalDto>`
- `getPublicProfile(id: string): Promise<PublicProfessionalDto>` — omits nationality if `show_nationality=false`
- `setProfileVisibility(id: string, isPublic: boolean): Promise<void>`
- `computeCompleteness(id: string): Promise<number>` — returns 0–100 score
- `detectDuplicates(dto: RegisterDto): Promise<boolean>` — checks name, phone, gov ID hash

#### `EmployersService`
- `createProfile(userId: string, dto: CreateEmployerDto): Promise<EmployerDto>`
- `updateBadgeVisibility(id: string): Promise<void>` — recomputes badge based on verification + compliance state
- `addMember(employerId: string, dto: AddMemberDto): Promise<void>`
- `removeMember(employerId: string, memberId: string): Promise<void>`

#### `JobsService`
- `createJob(employerId: string, dto: CreateJobDto): Promise<JobDto>`
- `publishJob(id: string): Promise<void>` — transitions draft → active
- `closeJob(id: string): Promise<void>`
- `duplicateJob(id: string): Promise<JobDto>` — creates draft copy
- `getJobStats(id: string): Promise<JobStatsDto>` — views, applications, shortlisted, hired

#### `ApplicationsService`
- `apply(professionalId: string, jobId: string, dto: ApplyDto): Promise<ApplicationDto>`
- `updateStatus(id: string, status: ApplicationStatus, reason?: string): Promise<ApplicationDto>` — triggers notification matching exact status
- `withdraw(id: string, professionalId: string): Promise<void>`
- `checkStaleApplications(): Promise<void>` — scheduled job, sends 14-day reminders

#### `NotificationsService`
- `send(userId: string, type: NotificationType, context: Record<string, unknown>): Promise<void>` — dispatches in-app + email in user's language
- `markRead(id: string, userId: string): Promise<void>`
- `updatePreferences(userId: string, dto: NotificationPreferencesDto): Promise<void>`

#### `ShiftsService`
- `createShift(employerId: string, dto: CreateShiftDto): Promise<ShiftDto>`
- `confirmShift(id: string, professionalId: string): Promise<void>`
- `cancelShift(id: string, userId: string, reason: string): Promise<void>`
- `confirmCompletion(id: string, userId: string): Promise<void>` — when both sides confirm, triggers payment + rating flow
- `raiseDispute(id: string, userId: string, evidence: string): Promise<void>`

#### `RatingsService`
- `submitRating(dto: SubmitRatingDto): Promise<RatingDto>` — flags prohibited content before saving
- `computeAverageRating(userId: string): Promise<RatingAverageDto>` — time-decayed weighted average
- `moderateRating(id: string, adminId: string, decision: ModerationDecision): Promise<void>`

#### `PaymentsService`
- `initiatePayment(shiftId: string): Promise<PaymentDto>`
- `getEarnings(professionalId: string): Promise<EarningsDto>`
- `getBilling(employerId: string): Promise<BillingDto>`
- `disputePayment(id: string, userId: string): Promise<void>`

#### `SearchService`
- `searchJobs(query: JobSearchQueryDto): Promise<PaginatedResult<JobDto>>`
- `searchProfessionals(query: ProfessionalSearchQueryDto): Promise<PaginatedResult<PublicProfessionalDto>>`
- `saveSearch(userId: string, dto: SaveSearchDto): Promise<void>`

#### `AdminService`
- `getDashboardStats(): Promise<AdminDashboardDto>`
- `reviewVerification(id: string, adminId: string, decision: VerificationDecision, reason: string): Promise<void>`
- `suspendAccount(userId: string, adminId: string, reason: string): Promise<void>`
- `resolveDispute(disputeId: string, adminId: string, outcome: string): Promise<void>`
- `getAnalytics(filters: AnalyticsFiltersDto): Promise<AnalyticsDto>`

### Frontend Components

#### Shared
- `<JobCard />` — job title, industry, location, employment type, salary range, employer badge
- `<ProfessionalCard />` — name, photo, skills, verification badge, average rating
- `<ApplicationStatusBadge />` — color-coded status pill
- `<RatingStars />` — display-only star rating with count
- `<VerifiedBadge />` — shown on verified professional and employer profiles
- `<NotificationBell />` — header icon with unread count
- `<LanguageSwitcher />` — toggles en/ar, persists to account

#### Professional Dashboard
- `<ApplicationsDashboard />` — list of applications with live status
- `<ShiftCalendar />` — upcoming/active/past shifts
- `<ProfileCompletenessBar />` — visual 0–100% indicator

#### Employer Dashboard
- `<JobPostingManager />` — CRUD for job postings
- `<ApplicationPipeline />` — kanban-style or list view per job
- `<ProfessionalSearchPanel />` — search + filter + AI-ranked results

#### Admin Portal
- `<VerificationQueue />` — pending verification requests
- `<DisputeViewer />` — full dispute context panel
- `<AuditLogTable />` — immutable log of all admin actions
- `<PlatformAnalyticsChart />` — time-series charts by industry

---

## Data Models

Shared TypeScript types in `packages/shared/src/types/`:

```typescript
// user.types.ts
export enum UserRole {
  Professional = 'professional',
  Employer = 'employer',
  Admin = 'admin',
}

// application.types.ts
export enum ApplicationStatus {
  Received = 'received',
  UnderReview = 'under_review',
  Shortlisted = 'shortlisted',
  Rejected = 'rejected',
  Hired = 'hired',
  Withdrawn = 'withdrawn',
}

// job.types.ts
export enum EmploymentType {
  FullTime = 'full_time',
  PartTime = 'part_time',
  ShiftBased = 'shift_based',
  Contract = 'contract',
}

export enum JobStatus {
  Draft = 'draft',
  Active = 'active',
  Closed = 'closed',
  Expired = 'expired',
}

// shift.types.ts
export enum ShiftStatus {
  Scheduled = 'scheduled',
  Confirmed = 'confirmed',
  Completed = 'completed',
  Cancelled = 'cancelled',
  Disputed = 'disputed',
}

// notification.types.ts
export enum NotificationType {
  ApplicationReceived = 'application_received',
  ApplicationShortlisted = 'application_shortlisted',
  ApplicationRejected = 'application_rejected',
  ApplicationHired = 'application_hired',
  ApplicationWithdrawn = 'application_withdrawn',
  ShiftAssigned = 'shift_assigned',
  ShiftConfirmed = 'shift_confirmed',
  ShiftCancelled = 'shift_cancelled',
  ShiftCompletionPrompt = 'shift_completion_prompt',
  PaymentProcessed = 'payment_processed',
  PaymentFailed = 'payment_failed',
  RatingReceived = 'rating_received',
  VerificationApproved = 'verification_approved',
  VerificationRejected = 'verification_rejected',
  AccountSuspended = 'account_suspended',
}
```

**Key invariant**: `NotificationType.ApplicationShortlisted` is the **only** notification type dispatched when `ApplicationStatus` transitions to `Shortlisted`. The `NotificationsService.send()` method maps status transitions to notification types with a strict, exhaustive switch — no fallthrough.

---

## Correctness Properties

These are the formal correctness properties the implementation must satisfy, validated through property-based and integration tests.

### Property 1: Notification Accuracy

**Validates: Requirements 7.4, 7.5, 8.1**

For every notification of type `ApplicationShortlisted` sent to a professional, there exists an `applications` row with `status = 'shortlisted'` and `professional_id` matching the recipient. No `ApplicationShortlisted` notification is ever sent for any other status transition.

### Property 2: No Duplicate Applications

**Validates: Requirements 7.10**

For any `(job_id, professional_id)` pair, at most one non-withdrawn application row exists in the `applications` table at any point in time.

### Property 3: Badge Consistency

**Validates: Requirements 5.3**

A `"Verified Employer"` badge is displayed if and only if `employers.verification_status = 'verified'` AND `employers.compliance_flag = false` AND the employer account is not suspended.

### Property 4: Country of Origin Exclusion Gate

**Validates: Requirements 2.3, 12.5**

No job search or professional ranking query filters by `country_of_origin` or `nationality` unless a corresponding approved row exists in `audit_logs` with `action = 'country_exclusion_approved'` for that employer, created after admin approval.

### Property 5: Payment Integrity

**Validates: Requirements 13.1, 13.3, 13.4**

For every `payments` row with `status = 'completed'`, `gross_amount = net_amount + platform_fee` holds true.

### Property 6: Token Rotation

**Validates: Requirements 3.4**

After a refresh token is used, the used token's `revoked_at` is non-null within the same database transaction that issues the new token. No refresh token can be used twice.

### Property 7: Shift Completion Prerequisite

**Validates: Requirements 9.5, 13.1**

A `payments` row with `status != 'pending'` for a given shift exists only if `shifts.employer_confirmed_completion = true` AND `shifts.professional_confirmed_completion = true` for that shift.

### Property 8: Rating Immutability

**Validates: Requirements 10.2, 11.9**

Once a `ratings` row is inserted with `moderation_status = 'approved'`, it can only be modified by a user with `role = 'admin'`, and any such modification produces a corresponding `audit_logs` row.

---

## Error Handling

### API Error Response Format

All errors return a consistent JSON shape — never exposing stack traces or internal details:

```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "You do not have permission to perform this action.",
  "requestId": "req_01j..."
}
```

A global `HttpExceptionFilter` in NestJS catches all exceptions, strips internal details, logs the full context server-side (request ID, user ID, stack trace), and returns the safe response.

### Key Error Scenarios

| Scenario | HTTP Status | Behaviour |
|---|---|---|
| Invalid credentials | 401 | Generic message — no indication of which field was wrong |
| Expired access token | 401 | Client silently retries with refresh token |
| Revoked/expired refresh token | 401 | Client redirected to login |
| Insufficient role | 403 | Standard forbidden response |
| Duplicate application | 409 | "You have already applied to this job" |
| Job expired | 422 | "This job posting is no longer accepting applications" |
| Validation failure | 400 | Field-level error messages (safe to show users) |
| Internal server error | 500 | Generic message; full details logged only |

---

## Testing Strategy

### Backend

- **Unit tests** (`*.service.spec.ts`): Test all service methods with mocked repositories. Target ≥ 80% coverage on business-critical modules.
- **Integration tests** (`test/*.e2e-spec.ts`): Test full HTTP flows against a real test database (Docker). Covers auth flows, application lifecycle, notification dispatch, and payment initiation.
- **Property-based tests**: Use `fast-check` to verify the correctness properties listed above — especially notification accuracy, duplicate prevention, and payment integrity.

### Frontend

- **Component tests** (Vitest + Testing Library): Test domain components with mocked API responses.
- **E2E tests** (Playwright): Cover the critical user journeys — registration, job application (≤3 steps), shift confirmation, and admin verification workflow.

### CI

Every pull request runs: lint → type check → unit tests → integration tests. Deployment is blocked if any check fails.
