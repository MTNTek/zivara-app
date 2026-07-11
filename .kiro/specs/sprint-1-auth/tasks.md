# Implementation Plan: Sprint 1 — Authentication & Authorization

## Overview

Implements the complete auth module in dependency order: schema → backend module → frontend pages → tests → self-review. No task starts until all its dependencies are complete and verified.

## Tasks

- [ ] 1. Extend database schema for authentication
  - Add `login_attempts SMALLINT DEFAULT 0` and `lockout_until TIMESTAMPTZ NULL` columns to the `users` table in `apps/api/src/database/schema/users.ts`
  - Create `apps/api/src/database/schema/email-tokens.ts` with the `email_tokens` table: `id` UUID PK, `user_id` FK→users, `token_hash` VARCHAR NOT NULL, `type` ENUM('email_verification','password_reset'), `expires_at` TIMESTAMPTZ NOT NULL, `used_at` TIMESTAMPTZ NULL, `created_at` TIMESTAMPTZ default now(); add indexes on `token_hash`, `user_id`, and `(type, used_at)`
  - Add the new schema file export to `apps/api/src/database/database.module.ts` combined schema object
  - Run `npx drizzle-kit generate` to produce the new migration
  - Run `npm run build` to verify TypeScript compiles clean
  - **Requirements:** 4.8, 11.3, 11.4

- [ ] 2. Install and configure auth dependencies
  - Install and pin: `@nestjs/throttler@6.2.1`, `cookie-parser@1.4.7`, `@types/cookie-parser@1.4.7`, `nodemailer@6.9.13`, `@types/nodemailer@6.4.14`
  - Add `SKIP_EMAIL_VERIFICATION`, `FRONTEND_URL`, `SMTP_FROM` to `apps/api/src/config/config.schema.ts` Zod schema (SKIP_EMAIL_VERIFICATION as optional boolean string, FRONTEND_URL as url string, SMTP_FROM as string)
  - Add `.env.example` entries for the new variables
  - Register `ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }])` in `app.module.ts`
  - Register `cookie-parser` middleware in `main.ts`
  - Add `THROTTLE_SKIP` environment flag for test environments
  - Run `npm run build` to verify clean compilation
  - **Requirements:** 11.1, 11.6

- [ ] 3. Create auth DTOs and interfaces
  - Create `apps/api/src/auth/interfaces/jwt-payload.interface.ts` with `JwtPayload` interface: `sub`, `email`, `role` (UserRole), `employerId?`, `iat`, `exp`
  - Create `apps/api/src/auth/dto/register-professional.dto.ts` with class-validator + Zod: `fullName` (string, min 2), `email` (valid email), `password` (string, min 8), `phone` (string, min 7), `primaryIndustry` (string)
  - Create `apps/api/src/auth/dto/register-employer.dto.ts`: `fullName`, `companyName`, `tradeLicenseNumber`, `industry`, `operatingCountry`, `email`, `password` (min 8)
  - Create `apps/api/src/auth/dto/login.dto.ts`: `email`, `password`
  - Create `apps/api/src/auth/dto/forgot-password.dto.ts`: `email`
  - Create `apps/api/src/auth/dto/reset-password.dto.ts`: `token`, `password` (min 8)
  - Create `apps/api/src/auth/dto/change-password.dto.ts`: `currentPassword`, `newPassword` (min 8)
  - Run `npm run build` to verify clean compilation
  - **Requirements:** 1.4, 1.5, validation requirements throughout

- [ ] 4. Create auth repository
  - Create `apps/api/src/auth/auth.repository.ts` implementing all repository methods defined in the design
  - Inject `DRIZZLE_CLIENT` using the `@Inject(DRIZZLE_CLIENT)` pattern from the existing common module
  - Implement all methods: `findUserByEmail`, `findUserById`, `createUser`, `updateUser`, `incrementLoginAttempts`, `lockAccount`, `resetLoginAttempts`, `createRefreshToken`, `findRefreshToken`, `revokeRefreshToken`, `revokeAllUserRefreshTokens`, `createVerificationToken`, `findVerificationToken`, `markVerificationTokenUsed`, `createPasswordResetToken`, `findPasswordResetToken`, `markPasswordResetTokenUsed`, `writeAuditLog`
  - All queries must filter `WHERE deleted_at IS NULL` for user lookups
  - Run `npm run build` to verify clean compilation
  - **Requirements:** 1.2, 4.3, 4.7, 6.2, 6.5, 11.3

- [ ] 5. Create JWT strategies
  - Install and pin `@nestjs/passport@10.0.3` (already installed), `@nestjs/jwt@10.2.0` (already installed), `passport-jwt@4.0.1` (already installed)
  - Create `apps/api/src/auth/strategies/jwt.strategy.ts`: validates JWT from Authorization Bearer header; loads user from DB; throws `ForbiddenException` if `suspendedAt IS NOT NULL`; returns `JwtPayload` user object
  - Create `apps/api/src/auth/strategies/jwt-refresh.strategy.ts`: extracts refresh token from `zivara_rt` HTTP-only cookie; validates the raw token against stored SHA-256 hash; attaches refresh token metadata to request
  - Update `apps/api/src/common/guards/jwt-auth.guard.ts` to skip routes decorated with `@Public()`
  - Create `apps/api/src/auth/decorators/public.decorator.ts` using `SetMetadata('isPublic', true)`
  - Run `npm run build` to verify clean compilation
  - **Requirements:** 10.1, 10.2, 10.4, 10.5

- [ ] 6. Create email service
  - Create `apps/api/src/common/email/email.service.ts` using `nodemailer`
  - Implement `sendVerificationEmail(to: string, token: string, locale: 'en' | 'ar'): Promise<void>` — sends HTML email with link `{FRONTEND_URL}/verify-email?token={rawToken}`
  - Implement `sendPasswordResetEmail(to: string, token: string, locale: 'en' | 'ar'): Promise<void>` — sends HTML email with link `{FRONTEND_URL}/reset-password?token={rawToken}`
  - In dev mode (`SKIP_EMAIL_VERIFICATION=true`), log the email content to console instead of sending
  - Create `apps/api/src/common/email/email.module.ts` and export `EmailService`
  - Run `npm run build` to verify clean compilation
  - **Requirements:** 3.1, 7.3, dev mode friendly

- [ ] 7. Implement AuthService
  - Create `apps/api/src/auth/auth.service.ts` implementing ALL methods from the design
  - `registerProfessional`: hash password (bcrypt cost 12), create user, in dev auto-verify, in prod create email token and send verification email, write audit log
  - `registerEmployer`: same as professional plus create `employers` record and `employer_members` record with role `owner`, write audit log
  - `login`: find user, check deletion/suspension/lockout/verification, compare password (bcrypt.compare), issue access JWT + refresh token (SHA-256 hash stored, raw token in cookie), reset lockout counter, write audit log
  - `logout`: hash the raw refresh token from cookie, find token, revoke it, clear cookie, write audit log
  - `refreshTokens`: find token by hash, check revocation/expiry, detect reuse (revoke all + audit log), rotate (revoke old, issue new pair)
  - `forgotPassword`: find user (always return success), generate reset token, store hash, send email
  - `resetPassword`: find token by hash, check expiry/used, hash new password, update user, mark token used, revoke all refresh tokens, write audit log
  - `changePassword`: verify current password, check not same as new, hash new password, update user, revoke other refresh tokens, write audit log
  - `getCurrentUser`: return safe user DTO (no passwordHash)
  - Inject `JwtService`, `AuthRepository`, `EmailService`, `ConfigService`
  - Run `npm run build` to verify clean compilation
  - **Requirements:** 1, 2, 3, 4, 5, 6, 7, 8, 9

- [ ] 8. Implement AuthController
  - Create `apps/api/src/auth/auth.controller.ts` with all endpoints from the design
  - Apply `@Throttle({ default: { limit: 10, ttl: 60000 } })` to all auth endpoints
  - Apply `@Public()` to: register, verify-email, resend-verification, login, forgot-password, reset-password, refresh
  - Apply `@UseGuards(JwtAuthGuard)` to: logout, change-password, me
  - Extract IP address from request for login attempt tracking
  - Extract refresh token from `zivara_rt` cookie in logout and refresh endpoints
  - Set refresh token HTTP-only cookie on login and refresh responses; clear it on logout
  - Create `apps/api/src/auth/auth.module.ts` registering: `JwtModule.register({ secret, signOptions: { expiresIn: '15m' } })`, `PassportModule`, `AuthService`, `AuthRepository`, `JwtStrategy`, `JwtRefreshStrategy`; import `EmailModule`
  - Register `AuthModule` in `app.module.ts`
  - Run `npm run build` to verify clean compilation
  - **Requirements:** all controller-level requirements

- [ ] 9. Write backend unit tests
  - Create `apps/api/src/auth/auth.service.spec.ts` covering:
    - `registerProfessional`: happy path, duplicate email (409), password too short (400)
    - `login`: valid credentials (200 + tokens), wrong password (401), locked account (429), suspended account (403), unverified email (403), soft-deleted account (401)
    - `refreshTokens`: valid rotation (new pair), revoked token (401), expired token (401), reuse detection (revoke all + audit log)
    - `forgotPassword`: existing email (sends email), non-existing email (same 200 response, no email sent)
    - `resetPassword`: valid token (success), expired token (400), used token (400)
    - `changePassword`: correct current password (success), wrong current password (401), same password (400)
  - Mock `AuthRepository`, `JwtService`, `EmailService`, `ConfigService`
  - All 25+ test cases must pass
  - Run `npm test -- --testPathPattern=auth.service.spec` and verify all pass
  - **Requirements:** full test coverage requirement

- [ ] 10. Write backend integration tests
  - Create `apps/api/test/auth.e2e-spec.ts` covering:
    - Full flow: professional registration (dev mode) → immediate login → refresh tokens → logout → refresh fails after logout
    - Full flow: employer registration → login → access protected endpoint → get current user
    - Account lockout: 5 failed logins → 429 on 6th → success after lockout expires
    - Rate limiting: 11 rapid requests to login → 429
    - Password reset flow: forgot-password → extract token from email service mock → reset → login with new password → old password fails
    - RBAC: professional token → access employer-only route → 403; admin token → access admin route → 200
    - Refresh token reuse detection: use a refresh token → revoke it manually → use it again → verify ALL user tokens revoked
  - Use a real test database (spin up in-memory or use Docker-based test DB)
  - All tests must pass with `npm run test:e2e`
  - **Requirements:** security review requirement

- [ ] 11. Build frontend — Professional registration page
  - Create `apps/web/src/app/(auth)/register/page.tsx` — server component wrapping `ProfessionalRegisterForm`
  - Create `apps/web/src/components/auth/ProfessionalRegisterForm.tsx` — `'use client'` form with react-hook-form + zod: full name, email, password (with show/hide toggle), phone, industry dropdown
  - Install and pin `react-hook-form@7.51.5`, `@hookform/resolvers@3.3.4` in `apps/web`
  - Implement in English and Arabic (using `next-intl` `useTranslations`)
  - On success in dev mode: redirect to `/dashboard`; in prod mode: redirect to `/verify-email` confirmation page
  - On error: display inline field errors; on 409 show "An account with this email already exists."
  - Show spinner + disable submit on pending
  - RTL layout works correctly in Arabic
  - Run `npx tsc --noEmit` to verify clean compilation
  - **Requirements:** 12.1, 12.6, 12.7, 12.8, 12.9, 12.10

- [ ] 12. Build frontend — Employer registration page
  - Create `apps/web/src/app/(auth)/register/employer/page.tsx`
  - Create `apps/web/src/components/auth/EmployerRegisterForm.tsx` with fields: full name, company name, trade license number, industry, country (GCC countries dropdown), email, password
  - Same i18n, RTL, loading state, error handling as professional form
  - Run `npx tsc --noEmit` to verify clean compilation
  - **Requirements:** 12.2

- [ ] 13. Build frontend — Login page
  - Update `apps/web/src/app/(auth)/login/page.tsx` to use `LoginForm` component
  - Create `apps/web/src/components/auth/LoginForm.tsx` with email + password fields, "Forgot password?" link, loading state
  - On success: store access token, redirect to appropriate dashboard based on role (professional → `/dashboard`, employer → `/employer/dashboard`, admin → `/admin/dashboard`)
  - On 401: show "Invalid email or password."
  - On 403 (unverified): show "Please verify your email before logging in."
  - On 403 (suspended): show "Your account has been suspended. Please contact support."
  - On 429: show "Too many attempts. Please try again in 15 minutes."
  - Run `npx tsc --noEmit` to verify clean compilation
  - **Requirements:** 12.3, 12.6, 12.7, 12.8

- [ ] 14. Build frontend — Forgot password and reset password pages
  - Create `apps/web/src/components/auth/ForgotPasswordForm.tsx` — email field, submit shows "If an account exists for that email, you'll receive a reset link shortly."
  - Update `apps/web/src/app/(auth)/forgot-password/page.tsx` to use the form
  - Create `apps/web/src/components/auth/ResetPasswordForm.tsx` — reads `token` from URL search params, new password + confirm password fields with match validation
  - Update `apps/web/src/app/(auth)/reset-password/page.tsx` to use the form
  - Create `apps/web/src/app/(auth)/verify-email/page.tsx` — static confirmation page "Check your email" shown after registration in prod mode
  - Run `npx tsc --noEmit` to verify clean compilation
  - **Requirements:** 12.4, 12.5

- [ ] 15. Update auth i18n messages
  - Add all auth-specific messages to `apps/web/src/messages/en.json` and `apps/web/src/messages/ar.json`
  - Keys needed: all form labels, placeholders, error messages, success messages for all auth pages
  - Ensure no hardcoded English strings remain in any auth component
  - **Requirements:** 12.6

- [ ] 16. Update frontend API client for auth
  - Create `apps/web/src/lib/api/auth.ts` with typed functions:
    - `registerProfessional(data)`, `registerEmployer(data)`, `login(data)`, `logout()`, `forgotPassword(email)`, `resetPassword(token, password)`, `changePassword(data)`, `refreshTokens()`, `getCurrentUser()`
  - Each function uses the existing `apiClient` wrapper
  - Export types: `LoginResponse`, `RegisterResponse`, `CurrentUser`
  - Run `npx tsc --noEmit` to verify clean compilation
  - **Requirements:** frontend integration

- [ ] 17. Engineering self-review and documentation update
  - Verify all 8 correctness properties from the design document hold by reviewing the implementation
  - Run full test suite: `npm test` and `npm run test:e2e` — ALL tests must pass
  - Manually test the complete flow in dev mode: register professional → login → access protected route → change password → logout → attempt refresh → confirm 401
  - Manually test rate limiting: trigger 10+ rapid login attempts and confirm 429
  - Update `docs/API.md` with all new auth endpoints (request/response examples for each)
  - Update `docs/CHANGELOG.md` with Sprint 1 entry
  - Confirm: no `console.log` with sensitive data, no raw passwords logged, no stack traces in responses
  - **Requirements:** all — sprint complete when all tests pass and self-review is clean

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"] },
    { "wave": 2, "tasks": ["2", "3"] },
    { "wave": 3, "tasks": ["4", "5", "6"] },
    { "wave": 4, "tasks": ["7"] },
    { "wave": 5, "tasks": ["8"] },
    { "wave": 6, "tasks": ["9", "11"] },
    { "wave": 7, "tasks": ["10", "12", "13", "14", "15", "16"] },
    { "wave": 8, "tasks": ["17"] }
  ],
  "dependencies": {
    "1": [],
    "2": ["1"],
    "3": ["1"],
    "4": ["1", "3"],
    "5": ["2", "3"],
    "6": ["2"],
    "7": ["4", "5", "6"],
    "8": ["7"],
    "9": ["7"],
    "10": ["8"],
    "11": ["16"],
    "12": ["16"],
    "13": ["16"],
    "14": ["16"],
    "15": [],
    "16": ["3"],
    "17": ["9", "10", "11", "12", "13", "14", "15"]
  }
}
```

## Notes

- bcrypt cost factor 12 is used throughout — do NOT use Argon2 (not in the approved stack)
- SKIP_EMAIL_VERIFICATION=true bypasses ONLY email sending — JWT, RBAC, lockout, rate limiting all remain active
- All token storage uses SHA-256 hashes only — raw tokens are never persisted
- The `audit_logs` table uses `admin_id` FK but auth events use the acting user's ID — for non-admin auth events, write the user's own ID as `admin_id` (the field records "who performed the action")
- Cookie name: `zivara_rt`; path: `/auth`; httpOnly; secure in production; sameSite: strict
- The `email_tokens` table handles both verification and password reset — the `type` column distinguishes them
