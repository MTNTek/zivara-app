# Changelog

All notable changes to Zivara are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v0.1.0] — Project Foundation

**Released:** 2025-07

### Summary

Establishes the full project foundation: monorepo structure, shared type library, documentation suite, and the scaffolding for both the NestJS API and Next.js frontend. No application feature code is included in this release — this version exists to give every subsequent feature a consistent, type-safe, and well-documented base to build on.

---

### Added

#### Repository Structure
- Root `package.json` with npm workspaces covering `apps/*` and `packages/*`
- `tsconfig.base.json` with strict TypeScript settings (`strict: true`, `target: ES2022`, `esModuleInterop: true`)
- `.env.example` listing all 15 required environment variables with descriptions
- `.gitignore` covering `node_modules`, `.env`, `dist`, `.next`, `*.tsbuildinfo`, and OS artifacts
- `README.md` with project overview, prerequisites, local setup instructions, and links to documentation

#### Documentation (`docs/`)
- `VISION.md` — mission statement, eight core values, target market (GCC), Phase 1 industries, user personas, product philosophy, and success metrics
- `PRODUCT.md` — Phase 1 industry table, three user role definitions (Professional, Employer, Administrator), six key user journeys, and seven product principles
- `ARCHITECTURE.md` — system architecture diagram, monorepo structure with rationale, full backend and frontend directory trees, technology stack table with rationale, module boundary diagram, and three data flow sequences (auth, API request, shift completion)
- `DATABASE.md` — full schema documentation for all 14 tables (column definitions, types, constraints, notes), entity relationship diagram, indexing strategy rationale, and migration approach
- `API.md` — API conventions (URL structure, HTTP methods, status codes), authentication scheme (JWT + refresh tokens, rotation, logout), error response format, offset and cursor pagination formats, RBAC summary, rate limiting table, versioning strategy, and request/response examples for key endpoints
- `DEPLOYMENT.md` — Docker local dev setup with service architecture, first-time setup commands, environment variable reference table, secrets management policy, Dockerfile descriptions, AWS infrastructure diagram, deployment flow, auto-scaling configuration, zero-downtime deployment strategy, staging environment, and rollback procedure
- `CHANGELOG.md` — this file

#### Shared Package (`packages/shared`)
- `UserRole` enum: `professional`, `employer`, `admin`
- `BaseUser` interface
- `JobStatus` enum: `draft`, `active`, `closed`, `expired`
- `EmploymentType` enum: `full_time`, `part_time`, `shift_based`, `contract`
- `ApplicationStatus` enum: `received`, `under_review`, `shortlisted`, `rejected`, `hired`, `withdrawn`
- `ShiftStatus` enum: `scheduled`, `confirmed`, `completed`, `cancelled`, `disputed`
- `NotificationType` enum covering all 18 platform notification types
- `index.ts` re-exporting all types and enums

#### NestJS API Scaffold (`apps/api`)
- NestJS 10 application bootstrapped with domain module structure
- Zod-based environment variable validation at startup (fails fast with descriptive errors)
- Global `HttpExceptionFilter` — strips stack traces from responses, logs full context server-side, returns `{ statusCode, error, message, requestId }`
- Global `LoggingInterceptor` — logs method, path, status code, and response time in milliseconds
- `JwtAuthGuard` extending `AuthGuard('jwt')`
- `RolesGuard` reading `@Roles()` decorator and validating JWT payload role
- `@Roles()` decorator using `SetMetadata`
- `@CurrentUser()` decorator extracting user from request
- Global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
- `GET /health` endpoint returning `{ status: 'ok', timestamp, version }`
- `tsconfig.json` with `emitDecoratorMetadata: true` and `experimentalDecorators: true`

#### Drizzle ORM Database Module (`apps/api`)
- Global `DatabaseModule` providing `DRIZZLE_CLIENT` injection token
- Schema files for all 14 tables: `users`, `refresh_tokens`, `professionals`, `professional_experience`, `professional_skills`, `professional_documents`, `employers`, `employer_members`, `jobs`, `job_required_skills`, `applications`, `shifts`, `ratings`, `notifications`, `payments`, `audit_logs`
- `drizzle.config.ts` with schema path and migrations output path
- Initial migration `0001_initial_schema.sql` creating all tables, foreign keys, check constraints, and indexes

#### Next.js Frontend Scaffold (`apps/web`)
- Next.js 14 application with App Router, TypeScript, Tailwind CSS, and ESLint
- Route group structure: `(public)`, `(auth)`, `(professional)`, `(employer)`, `(admin)` with layout files
- Root layout with `lang` and `dir` attributes driven by locale (`dir="rtl"` for Arabic)
- `next-intl` configured for `en` and `ar` with locale-aware routing
- `messages/en.json` and `messages/ar.json` with navigation, auth, common UI state, and validation message keys
- `src/middleware.ts` for locale detection and route protection
- `src/lib/api-client.ts` — typed fetch wrapper with Bearer token injection, silent 401 refresh, and typed `ApiError`
- `src/lib/auth.ts` — token storage helpers, JWT payload decoder, and expiry checker
- Tailwind CSS configured with RTL support and shadcn/ui CSS variables
- shadcn/ui initialized (New York style, neutral base color, CSS variables enabled)

#### Docker (`docker-compose.yml`, `docker-compose.prod.yml`)
- `docker-compose.yml` with three services: `postgres` (16-alpine, named volume, `pg_isready` health check), `api` (depends on healthy postgres), `web` (depends on api)
- `docker-compose.prod.yml` with production overrides: `restart: unless-stopped`, memory limits (`512m` API, `256m` web), no bind mounts
- `.dockerignore` for each app excluding `node_modules`, `.next`, `dist`, `.env`, and test files

---

### Architecture Decisions Recorded

- **Monorepo** with npm workspaces — shared types eliminate runtime type mismatches between frontend and backend
- **PostgreSQL + Drizzle ORM** — relational model fits the domain; type-safe queries with zero ORM overhead; schema-first migrations
- **JSONB for i18n content** — adding a third language requires no schema migration
- **JWT (15 min) + rotating refresh tokens (30 day)** — short-lived access tokens limit breach exposure; rotation prevents refresh token replay attacks
- **Three RBAC roles** (professional, employer, admin) — sufficient for Phase 1; enforced at controller level via guards
- **Domain-module folder structure** — each module owns its full vertical slice (controller, service, repository, DTOs, tests)
- **Next.js App Router route groups** — access control is structural and visual, not just runtime

---

[v0.1.0]: https://github.com/zivara/zivara_app/releases/tag/v0.1.0
