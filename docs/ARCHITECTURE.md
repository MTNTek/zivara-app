# Zivara — Architecture

## System Architecture

### High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                           Clients                               │
│   Browser (Next.js SSR/CSR)        Flutter Mobile (Phase 2)     │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS / TLS 1.2+
┌──────────────────────▼──────────────────────────────────────────┐
│                   Nginx / AWS ALB                               │
│         SSL termination · Rate limiting · Routing               │
│    /api/*  →  API service    |    /*  →  Web service            │
└──────────┬───────────────────────────────┬──────────────────────┘
           │                               │
┌──────────▼──────────────┐   ┌────────────▼────────────────────┐
│   Next.js Web App        │   │      NestJS REST API             │
│   apps/web               │   │      apps/api                   │
│   Port 3000              │   │      Port 4000                  │
│                          │   │                                 │
│  App Router              │   │  Domain modules:                │
│  TypeScript              │   │   auth, professionals,          │
│  Tailwind CSS            │   │   employers, jobs,              │
│  shadcn/ui               │   │   applications, shifts,         │
│  next-intl (EN/AR)       │   │   ratings, notifications,       │
└──────────────────────────┘   │   payments, search, admin       │
                               └─────────────┬───────────────────┘
                                             │ Drizzle ORM
                               ┌─────────────▼───────────────────┐
                               │     PostgreSQL 16                │
                               │     Single database             │
                               │     RDS Multi-AZ (production)   │
                               └─────────────────────────────────┘

Supporting services (production):
   AWS S3         — document and image storage (presigned URLs)
   AWS SES        — transactional email (verification, notifications)
   AWS CloudFront — CDN for static assets
   AWS ECR        — container registry
```

### Architecture Decisions

**Single database.** PostgreSQL is battle-tested for relational workloads. The domain fits the relational model naturally — professionals, employers, jobs, applications, shifts, payments, and ratings all have well-defined relationships and referential integrity requirements. A single database keeps operational complexity low at Phase 1 scale. Read replicas can be added when read scaling becomes necessary without changing application code.

**Nginx in front.** In local development, Nginx handles SSL termination, rate limiting on auth endpoints (5 requests/minute), and routing `/api/*` to the API container. In production, an AWS Application Load Balancer replaces Nginx for high availability. The routing logic is identical.

**Fully decoupled frontend and backend.** The web app communicates with the API over HTTP — the same way a future Flutter mobile app will. No server-side coupling, no shared memory, no internal RPC. This means the mobile app will have zero additional backend work and the frontend can be replaced or rewritten without touching the API.

---

## Monorepo Structure

```
zivara/
├── apps/
│   ├── api/                        # NestJS backend (port 4000)
│   └── web/                        # Next.js frontend (port 3000)
├── packages/
│   └── shared/                     # Shared TypeScript types and enums
├── docs/                           # All documentation
│   ├── VISION.md
│   ├── PRODUCT.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── CHANGELOG.md
├── docker-compose.yml              # Local dev: postgres + api + web
├── docker-compose.prod.yml         # Production overrides
├── .env.example                    # All required env keys (no values)
├── README.md
├── package.json                    # Root workspace config (npm workspaces)
└── tsconfig.base.json              # Shared TypeScript configuration
```

**Why a monorepo?** Shared TypeScript types between frontend and backend eliminate an entire class of runtime bugs. `ApplicationStatus` defined once in `packages/shared` and imported by both `apps/api` and `apps/web` means the compiler catches mismatches at build time — not at runtime in production. One repository means one CI pipeline, one place to manage dependencies, and atomic commits across the full stack.

---

## Backend Structure (`apps/api`)

The API is organized by **business domain modules** — not by technical layer. Each module owns its full vertical slice: controller, service, repository, DTOs, and tests.

```
apps/api/
├── src/
│   ├── main.ts                     # Bootstrap, global pipes, port from config
│   ├── app.module.ts               # Root module — imports all feature modules
│   │
│   ├── config/
│   │   └── config.schema.ts        # Zod env validation; fails fast on startup
│   │
│   ├── database/
│   │   ├── database.module.ts      # Global module; provides DRIZZLE_CLIENT token
│   │   ├── schema/                 # One schema file per domain entity
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
│   │   └── migrations/             # Drizzle-generated, versioned migration files
│   │
│   ├── common/
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts   # Extends AuthGuard('jwt')
│   │   │   └── roles.guard.ts      # Reads @Roles() decorator, checks JWT role
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts  # @Roles(...roles) using SetMetadata
│   │   │   └── current-user.decorator.ts
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts  # Logs method, path, status, response time
│   │   └── filters/
│   │       └── http-exception.filter.ts  # Strips stack traces; returns standard shape
│   │
│   ├── health/                     # GET /health — liveness probe
│   ├── auth/                       # JWT + refresh token auth
│   ├── professionals/              # Profile, documents, verification
│   ├── employers/                  # Company profile, sub-accounts, verification
│   ├── jobs/                       # Job postings, search, expiry
│   ├── applications/               # Application lifecycle, status transitions
│   ├── notifications/              # Dispatch, preferences, batching
│   ├── shifts/                     # Scheduling, confirmation, disputes
│   ├── ratings/                    # Submission, moderation, averages
│   ├── payments/                   # Initiation, earnings, billing
│   ├── search/                     # Unified search across jobs and professionals
│   └── admin/                      # Admin portal — verification, disputes, analytics
│
├── test/                           # E2E tests (supertest)
├── Dockerfile
├── package.json
└── tsconfig.json
```

### Module Pattern

Every module follows the same structure. Using `auth` as an example:

```
auth/
├── auth.module.ts
├── auth.controller.ts      # HTTP concerns only — routing, DTOs in/out
├── auth.service.ts         # Business logic — validation, rules, orchestration
├── auth.repository.ts      # Database queries — Drizzle calls only
├── dto/
│   ├── register.dto.ts
│   ├── login.dto.ts
│   └── refresh-token.dto.ts
├── strategies/
│   ├── jwt.strategy.ts
│   └── jwt-refresh.strategy.ts
└── auth.service.spec.ts    # Unit tests for business logic
```

The controller handles HTTP. The service handles business rules. The repository handles database access. Each layer is independently testable and replaceable.

---

## Frontend Structure (`apps/web`)

```
apps/web/
├── src/
│   ├── app/
│   │   ├── (public)/               # Unauthenticated pages
│   │   │   ├── page.tsx            # Home / landing
│   │   │   ├── jobs/
│   │   │   │   ├── page.tsx        # Public job listings
│   │   │   │   └── [id]/page.tsx   # Public job detail
│   │   │   └── employers/
│   │   │       └── [id]/page.tsx   # Public employer profile
│   │   ├── (auth)/                 # Registration, login, password reset
│   │   ├── (professional)/         # Authenticated professional dashboard
│   │   │   ├── layout.tsx          # Auth guard for professional role
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── applications/page.tsx
│   │   │   ├── shifts/page.tsx
│   │   │   └── notifications/page.tsx
│   │   ├── (employer)/             # Authenticated employer dashboard
│   │   │   ├── layout.tsx          # Auth guard for employer role
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── jobs/
│   │   │   ├── applications/page.tsx
│   │   │   ├── professionals/page.tsx
│   │   │   ├── shifts/page.tsx
│   │   │   └── billing/page.tsx
│   │   └── (admin)/                # Admin portal (admin role only)
│   │       ├── layout.tsx          # Auth guard for admin role
│   │       ├── dashboard/page.tsx
│   │       ├── verifications/page.tsx
│   │       ├── disputes/page.tsx
│   │       ├── users/page.tsx
│   │       └── analytics/page.tsx
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn/ui primitives (auto-generated)
│   │   └── [domain]/               # Hand-crafted domain components
│   │       ├── job-card.tsx
│   │       ├── professional-card.tsx
│   │       ├── application-status-badge.tsx
│   │       └── rating-stars.tsx
│   │
│   ├── lib/
│   │   ├── api-client.ts           # Typed fetch wrapper; handles 401 + silent refresh
│   │   ├── auth.ts                 # Token storage, JWT decode, expiry check
│   │   └── i18n.ts                 # next-intl configuration
│   │
│   ├── hooks/                      # Custom React hooks
│   ├── messages/
│   │   ├── en.json                 # English UI strings
│   │   └── ar.json                 # Arabic UI strings
│   └── middleware.ts               # Locale detection + route protection
│
├── public/
├── Dockerfile
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

Route groups `(public)`, `(auth)`, `(professional)`, `(employer)`, and `(admin)` map directly to user roles. Each authenticated group has its own layout with an auth guard. Access control is structural and visual — not just a runtime check.

---

## Shared Package (`packages/shared`)

```
packages/shared/
├── src/
│   ├── types/
│   │   ├── user.types.ts           # UserRole enum, BaseUser interface
│   │   ├── job.types.ts            # JobStatus, EmploymentType enums
│   │   ├── application.types.ts    # ApplicationStatus enum
│   │   ├── shift.types.ts          # ShiftStatus enum
│   │   └── notification.types.ts   # NotificationType enum (18 types)
│   └── index.ts                    # Re-exports all types and enums
├── package.json                    # name: @zivara/shared
└── tsconfig.json
```

---

## Technology Stack

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Frontend framework | Next.js | 14 | App Router with SSR/SSG, TypeScript-first, excellent i18n support via next-intl |
| Frontend language | TypeScript | 5 | Type safety end-to-end; shared types with backend via `packages/shared` |
| Frontend styling | Tailwind CSS | 3 | Utility-first CSS with RTL support (`rtl:` variant), no runtime overhead |
| UI components | shadcn/ui | latest | Unstyled, accessible Radix UI components; owned in-project, not a black-box dependency |
| i18n | next-intl | 3 | First-class App Router support, locale routing, RTL, ICU message format |
| Backend framework | NestJS | 10 | TypeScript-native, module-based, built-in DI, excellent testing support |
| Backend language | TypeScript | 5 | Shared types with frontend; strict compilation catches bugs at build time |
| Database | PostgreSQL | 16 | Battle-tested RDBMS; foreign key enforcement; JSONB for i18n content fields |
| ORM | Drizzle ORM | 0.30 | Type-safe SQL queries, zero overhead, schema-first, excellent migration tooling |
| Auth | JWT + Refresh tokens | — | 15-min access tokens (RS256); 30-day refresh tokens with rotation; standard pattern |
| Validation | Zod | 3 | Schema validation for env vars and DTOs; TypeScript type inference from schemas |
| Container | Docker | — | Consistent environments from dev to production |
| Reverse proxy | Nginx (dev) / AWS ALB (prod) | — | SSL termination, rate limiting, routing |
| Cloud compute | AWS ECS Fargate | — | Serverless containers; auto-scaling; no EC2 management |
| Database hosting | AWS RDS PostgreSQL | — | Multi-AZ for production; automated backups; managed patching |
| File storage | AWS S3 | — | Private bucket with presigned URLs for document access |
| CDN | AWS CloudFront | — | Static asset delivery at edge |
| Email | AWS SES | — | Transactional email (verification, notifications); GCC-region capable |
| Container registry | AWS ECR | — | Private registry integrated with ECS deployments |

---

## Module Boundaries

Modules are strictly separated. Cross-module dependencies flow in one direction only — no circular imports.

```
auth ──────────────────────────────────┐
                                       │
professionals ──┐                      │
                ├──── applications ────┼──── notifications
employers ──────┤         │            │
                │         ▼            │
jobs ───────────┘      shifts ─────────┼──── payments
                          │            │
                          └────────────┴──── ratings

admin (reads from all modules, writes to audit_logs)
search (reads from jobs and professionals)
```

**Rules:**
- `common/` can be imported by any module
- `packages/shared` can be imported by any module in either app
- `auth` module is imported only by `app.module.ts` and individual feature modules that need `JwtAuthGuard`
- `admin` module imports references to other modules' services for cross-module admin operations
- No feature module imports another feature module's repository directly — cross-module data access goes through the other module's service

---

## Data Flow

### Authentication Flow

```
Client
  │ POST /api/v1/auth/login {email, password}
  ▼
NestJS AuthController
  │ AuthService.login()
  ├── bcrypt.compare(password, hash)
  ├── generate JWT access token (15 min, RS256)
  ├── generate opaque refresh token
  ├── hash refresh token → store in refresh_tokens table
  └── return { accessToken, refreshToken }
  ▼
Client stores tokens
  └── accessToken in memory
  └── refreshToken in httpOnly cookie (recommended) or localStorage
```

### API Request Flow

```
Client
  │ GET /api/v1/jobs/[id]
  │ Authorization: Bearer <accessToken>
  ▼
Nginx → NestJS
  │ LoggingInterceptor: log request
  │ JwtAuthGuard: validate and decode JWT
  │ RolesGuard: check role against @Roles() decorator
  │ JobsController.findOne(id)
  │ JobsService.getJob(id)
  │ JobsRepository: Drizzle query → PostgreSQL
  │ Return JobDto
  │ LoggingInterceptor: log response time
  ▼
Client receives typed response
```

### Application Status Change Flow

```
Employer
  │ PATCH /api/v1/applications/[id]/status {status: "shortlisted"}
  ▼
ApplicationsController
  │ ApplicationsService.updateStatus(id, 'shortlisted')
  ├── validate transition is allowed
  ├── update applications table
  ├── update last_reviewed_at
  └── NotificationsService.send(professionalId, 'application_shortlisted', context)
        ├── create notifications record (in-app)
        └── SES.sendEmail() in professional's language_preference
```

### Shift Completion and Payment Flow

```
Both parties confirm shift completion
  │ ShiftsService.confirmCompletion(shiftId, userId)
  ├── update shifts.employer_confirmed_completion or professional_confirmed_completion
  └── IF both confirmed:
        ├── ShiftsService updates status → 'completed'
        ├── PaymentsService.initiatePayment(shiftId)
        │     ├── create payments record (status: 'processing')
        │     └── NotificationsService.send() to both parties
        └── RatingsService triggers rating prompt for both parties
```
