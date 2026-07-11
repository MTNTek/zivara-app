# Design Document

## Overview

Sprint 1 implements the complete authentication and authorization module for Zivara. The design follows the established monorepo architecture: a NestJS `auth` module on the backend with its own controller, service, repository, strategies, DTOs, and tests; and React pages on the frontend using the existing route group structure.

---

## Architecture

### Token Architecture

```
Registration / Login
        │
        ▼
    AuthService
        │
        ├─► JWT Access Token (15 min, RS256-style but using HS256 with long secret)
        │   Payload: { sub: userId, email, role, employerId?, iat, exp }
        │   Returned in response body
        │
        └─► Refresh Token (opaque, 30 days)
            Stored as SHA-256 hash in refresh_tokens table
            Set as HTTP-only, Secure, SameSite=Strict cookie named 'zivara_rt'
```

### Request Authentication Flow

```
Client Request
    │
    ▼
JwtAuthGuard
    │
    ├─ No token → 401
    ├─ Invalid token → 401
    ├─ Account suspended → 403 (checked in JWT strategy)
    └─ Valid → attach user to request
                │
                ▼
            RolesGuard
                │
                ├─ No @Roles() decorator → allow
                └─ Role mismatch → 403
```

### Rate Limiting

Per-IP rate limiting is applied at the NestJS level using `@nestjs/throttler`:
- Auth endpoints: 10 req/min
- Account lockout (per user): 5 failed attempts → 15-min lockout stored in the `users` table using a `login_attempts` counter and `lockout_until` timestamp

---

## Components and Interfaces

### Backend: `AuthModule`

**File structure:**
```
src/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── auth.repository.ts
├── dto/
│   ├── register-professional.dto.ts
│   ├── register-employer.dto.ts
│   ├── login.dto.ts
│   ├── forgot-password.dto.ts
│   ├── reset-password.dto.ts
│   └── change-password.dto.ts
├── strategies/
│   ├── jwt.strategy.ts
│   └── jwt-refresh.strategy.ts
├── guards/
│   └── public.decorator.ts    (re-exported from here for convenience)
├── interfaces/
│   └── jwt-payload.interface.ts
└── auth.service.spec.ts
```

#### `AuthController` — endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/register/professional | Public | Professional registration |
| POST | /auth/register/employer | Public | Employer registration |
| GET | /auth/verify-email | Public | Email verification via token |
| POST | /auth/resend-verification | Public | Resend verification email |
| POST | /auth/login | Public | Login, issues tokens |
| POST | /auth/logout | JWT | Revoke refresh token |
| POST | /auth/refresh | Cookie | Silent token refresh |
| POST | /auth/forgot-password | Public | Send reset email |
| POST | /auth/reset-password | Public | Reset password with token |
| PATCH | /auth/password | JWT | Change password (authenticated) |
| GET | /auth/me | JWT | Get current user |

#### `AuthService` — methods

```typescript
registerProfessional(dto: RegisterProfessionalDto): Promise<RegisterResponseDto>
registerEmployer(dto: RegisterEmployerDto): Promise<RegisterResponseDto>
verifyEmail(token: string): Promise<void>
resendVerification(email: string): Promise<void>
login(dto: LoginDto, ip: string): Promise<LoginResponseDto>
logout(userId: string, refreshToken: string): Promise<void>
refreshTokens(userId: string, refreshTokenHash: string): Promise<TokenPairDto>
forgotPassword(email: string): Promise<void>
resetPassword(token: string, newPassword: string): Promise<void>
changePassword(userId: string, dto: ChangePasswordDto): Promise<void>
getCurrentUser(userId: string): Promise<UserDto>
```

#### `AuthRepository` — database access

```typescript
findUserByEmail(email: string): Promise<User | null>
findUserById(id: string): Promise<User | null>
createUser(data: CreateUserData): Promise<User>
updateUser(id: string, data: Partial<User>): Promise<void>
incrementLoginAttempts(userId: string): Promise<void>
lockAccount(userId: string, until: Date): Promise<void>
resetLoginAttempts(userId: string): Promise<void>
createRefreshToken(data: CreateRefreshTokenData): Promise<RefreshToken>
findRefreshToken(tokenHash: string): Promise<RefreshToken | null>
revokeRefreshToken(id: string): Promise<void>
revokeAllUserRefreshTokens(userId: string): Promise<void>
createVerificationToken(userId: string, token: string, expiresAt: Date): Promise<void>
findVerificationToken(token: string): Promise<VerificationToken | null>
markVerificationTokenUsed(id: string): Promise<void>
createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void>
findPasswordResetToken(token: string): Promise<PasswordResetToken | null>
markPasswordResetTokenUsed(id: string): Promise<void>
writeAuditLog(adminId: string, action: string, targetType: string, targetId: string, reason: string, metadata?: Record<string, unknown>): Promise<void>
```

### Additional Schema: `email_tokens`

The existing schema doesn't have a dedicated token table. We'll add an `email_tokens` table to store verification and password-reset tokens:

```
email_tokens
├── id UUID PK
├── user_id UUID FK → users.id
├── token_hash VARCHAR NOT NULL  (SHA-256 of the raw token)
├── type ENUM('email_verification', 'password_reset')
├── expires_at TIMESTAMPTZ NOT NULL
├── used_at TIMESTAMPTZ NULL
├── created_at TIMESTAMPTZ DEFAULT now()
```

We also add two columns to `users`:
- `login_attempts SMALLINT DEFAULT 0` — failed login counter
- `lockout_until TIMESTAMPTZ NULL` — account lockout expiry

### JWT Strategy

```typescript
// jwt.strategy.ts
validate(payload: JwtPayload) {
  // Check suspension on every request to sensitive routes
  if (user.suspendedAt && !user.deletedAt) throw ForbiddenException
  return { id: payload.sub, email: payload.email, role: payload.role, employerId: payload.employerId }
}
```

### Token Generation

```typescript
// Refresh token — opaque, stored as hash
const rawToken = crypto.randomBytes(32).toString('hex') // 64-char hex string
const tokenHash = createHash('sha256').update(rawToken).digest('hex')
// rawToken → sent to client in cookie
// tokenHash → stored in database

// Email verification / password reset tokens
const rawToken = crypto.randomBytes(32).toString('hex')
const tokenHash = createHash('sha256').update(rawToken).digest('hex')
// rawToken → embedded in email link
// tokenHash → stored in email_tokens table
```

### Frontend Pages

```
src/app/(auth)/
├── register/
│   ├── page.tsx              Professional registration (default /register)
│   └── employer/page.tsx     Employer registration
├── login/page.tsx
├── forgot-password/page.tsx
├── reset-password/page.tsx
└── verify-email/page.tsx     "Check your email" confirmation screen
```

Each page is a React Server Component wrapper that imports a `'use client'` form component. Forms use `react-hook-form` + `zod` for client-side validation with server-side validation as the authoritative source.

---

## Data Models

### Schema additions (`users` table — new columns)

```typescript
loginAttempts: smallint('login_attempts').notNull().default(0),
lockoutUntil: timestamp('lockout_until', { withTimezone: true }),
```

### New table: `email_tokens`

```typescript
export const emailTokenTypeEnum = pgEnum('email_token_type', [
  'email_verification',
  'password_reset',
]);

export const emailTokens = pgTable('email_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash').notNull(),
  type: emailTokenTypeEnum('type').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

---

## Correctness Properties

### Property 1: Refresh Token Single-Use

**Validates: Requirements 6.2, 6.5**

For every refresh token row where `revoked_at IS NOT NULL`, no new access token is issued using that `token_hash`. Each use of a refresh token atomically sets `revoked_at` on the consumed token before issuing the new token pair.

### Property 2: Login Attempt Counter Accuracy

**Validates: Requirements 4.8, 4.9**

For any user with `login_attempts >= 5` AND `lockout_until > now()`, the system returns HTTP 429 and does NOT attempt password verification. The counter resets to 0 on successful login.

### Property 3: Password Hash Opacity

**Validates: Requirements 11.2, 11.3**

The raw password is never stored or logged. Only the bcrypt hash (cost 12) is persisted. The raw refresh token is never stored — only its SHA-256 hash.

### Property 4: Token Reuse Attack Detection

**Validates: Requirement 6.5**

IF a refresh token with `revoked_at IS NOT NULL` is presented, THEN ALL refresh tokens for that user SHALL be revoked within the same transaction, and an audit log entry with action `refresh_token_reuse_detected` SHALL be created.

### Property 5: Email Enumeration Prevention

**Validates: Requirements 4.3, 4.4, 7.2**

The HTTP response body and status code for "email does not exist" and "password incorrect" are identical. The `forgot-password` endpoint always returns 200 regardless of whether the email exists.

### Property 6: Audit Log Completeness

**Validates: Requirements 1.8, 2.7, 4.9, 4.10, 5.5, 8.5, 9.4**

Every authentication event (register, login, logout, failed login, password change, password reset, token reuse) produces exactly one `audit_logs` row before the response is sent.

### Property 7: Dev Mode Bypass Scope

**Validates: Requirements 1.6, 2.4**

When `SKIP_EMAIL_VERIFICATION=true`, ONLY email verification is bypassed. JWT signing, RBAC guards, password hashing, refresh token rotation, account lockout, and rate limiting all remain fully active.

### Property 8: Suspension Check on Every Request

**Validates: Requirement 10.5**

The JWT strategy validates `user.suspendedAt` on every authenticated request. A token issued before suspension is rejected after suspension takes effect.

---

## Error Handling

All auth errors return the standard shape `{ statusCode, error, message, requestId }`. Specific patterns:

| Scenario | Status | Message |
|---|---|---|
| Wrong password or email | 401 | "Invalid email or password." |
| Email not verified | 403 | "Please verify your email address before logging in." |
| Account suspended | 403 | "Your account has been suspended. Please contact support." |
| Account locked out | 429 | "Too many failed attempts. Please try again in 15 minutes." |
| Token expired/invalid | 401 | "Session expired. Please log in again." |
| Reset token invalid | 400 | "This reset link is invalid or has expired." |
| Reset token used | 400 | "This reset link has already been used." |
| Email already exists | 409 | "An account with this email already exists." |
| Trade license duplicate | 409 | "A company with this trade license number is already registered." |

---

## Testing Strategy

### Unit tests (`auth.service.spec.ts`)
- `registerProfessional` — happy path, duplicate email, password too short
- `login` — valid credentials, wrong password, locked account, suspended account, unverified email
- `refreshTokens` — valid rotation, revoked token, reuse detection
- `forgotPassword` — existing email, non-existing email (same response)
- `resetPassword` — valid token, expired token, used token
- `changePassword` — correct current password, wrong current password, same password

### Integration tests (`test/auth.e2e-spec.ts`)
- Full register → verify (dev mode) → login → refresh → logout flow
- Rate limiting triggers at 10 req/min
- Account lockout after 5 failed logins
- Password reset end-to-end flow

---

## Security Design

| Concern | Implementation |
|---|---|
| Password storage | bcrypt, cost factor 12 |
| Refresh token storage | SHA-256 hash only |
| Reset/verification tokens | `crypto.randomBytes(32)`, SHA-256 hash stored |
| Cookie settings | `httpOnly: true`, `secure: true` (prod), `sameSite: 'strict'`, `path: '/auth'` |
| Rate limiting | `@nestjs/throttler` — 10 req/min on all auth endpoints |
| Account lockout | 5 failures in 15 min → locked for 15 min, stored in DB |
| Error messages | Generic — never reveal whether email exists or which field failed |
| Internal error exposure | Global HttpExceptionFilter strips all stack traces |
| Token reuse | Detected → revoke all user tokens + audit log |
