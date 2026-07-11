# Requirements Document

## Introduction

Sprint 1 implements the complete authentication and authorization module for the Zivara workforce marketplace. This module is the security foundation for the entire platform — every subsequent module depends on it. It must be production-ready, developer-friendly, and secure from day one.

---

## Glossary

| Term | Definition |
|------|------------|
| Access Token | Short-lived JWT (15 min) issued on successful login, carried in Authorization header |
| Refresh Token | Long-lived opaque token (30 days) stored in HTTP-only cookie, used to silently re-issue access tokens |
| Token Rotation | Each use of a refresh token invalidates the old token and issues a new one |
| Account Lockout | Temporary suspension of login after N consecutive failed attempts |
| Dev Mode | When `NODE_ENV=development` or `SKIP_EMAIL_VERIFICATION=true` — email verification is bypassed |
| RBAC | Role-Based Access Control — Professional, Employer, Admin |
| Audit Log | Immutable record of security-relevant events written to `audit_logs` table |

---

## Requirements

### Requirement 1: Professional Registration

**User Story:** As a professional, I want to register with minimal friction so that I can start browsing and applying for jobs as quickly as possible.

#### Acceptance Criteria

1. WHEN a professional submits the registration form with valid data, THEN the system SHALL create a user account with role `professional` and return a success response.
2. WHEN a professional registers, THEN the system SHALL collect ONLY: full name, email, password, phone number, and primary industry.
3. WHEN a professional registers with an email that already exists (non-deleted), THEN the system SHALL return HTTP 409 with message "An account with this email already exists."
4. WHEN a professional registers with an invalid email format, THEN the system SHALL return HTTP 400 with a clear field-level validation message.
5. WHEN a professional registers with a password shorter than 8 characters, THEN the system SHALL return HTTP 400 with the message "Password must be at least 8 characters."
6. WHEN `NODE_ENV=development` OR `SKIP_EMAIL_VERIFICATION=true`, THEN the system SHALL set `is_verified_email = true` automatically on registration without sending a verification email.
7. WHEN in production mode, THEN the system SHALL set `is_verified_email = false`, send a verification email with a time-limited token, and require email verification before the account can log in.
8. WHEN a professional registers successfully, THEN the system SHALL write an audit log entry with action `user_registered` and the new user's ID.

---

### Requirement 2: Employer Registration

**User Story:** As an employer, I want to register my company so that I can post jobs and find professionals.

#### Acceptance Criteria

1. WHEN an employer submits the registration form with valid data, THEN the system SHALL create a user account with role `employer` AND create a linked `employers` record.
2. WHEN an employer registers, THEN the system SHALL collect: full name, company name, trade license number, primary industry, operating country, email, and password.
3. WHEN an employer registers with a trade license number that is already in use (non-deleted), THEN the system SHALL return HTTP 409 with message "A company with this trade license number is already registered."
4. WHEN `NODE_ENV=development` OR `SKIP_EMAIL_VERIFICATION=true`, THEN the system SHALL set `is_verified_email = true` automatically.
5. WHEN in production mode, THEN the system SHALL require email verification before the employer can log in.
6. WHEN an employer registers successfully, THEN the system SHALL create an `employer_members` record linking the user to the employer with role `owner`.
7. WHEN an employer registers successfully, THEN the system SHALL write an audit log entry with action `employer_registered`.

---

### Requirement 3: Email Verification

**User Story:** As a new user in production, I want to verify my email so that my account is activated securely.

#### Acceptance Criteria

1. WHEN a user registers in production mode, THEN the system SHALL send a verification email containing a URL of the form `{FRONTEND_URL}/verify-email?token={token}`.
2. WHEN a verification token is valid and not expired (≤ 24 hours), THEN the system SHALL set `is_verified_email = true` and return HTTP 200.
3. WHEN a verification token is expired or invalid, THEN the system SHALL return HTTP 400 with message "This verification link is invalid or has expired."
4. WHEN a user requests a new verification email, THEN the system SHALL invalidate any previous token and issue a new one.
5. WHEN in dev mode, THEN `GET /auth/verify-email` SHALL still function (allowing manual testing of the flow) but registration auto-verifies.

---

### Requirement 4: Login

**User Story:** As a registered user, I want to log in so that I can access my account.

#### Acceptance Criteria

1. WHEN a user submits valid email and password credentials, THEN the system SHALL return a JWT access token (15 min) and set a refresh token in an HTTP-only, Secure, SameSite=Strict cookie.
2. WHEN a user logs in, THEN the response body SHALL include: `accessToken`, `expiresIn`, `user` object (id, email, role).
3. WHEN a user provides an incorrect password, THEN the system SHALL return HTTP 401 with generic message "Invalid email or password." — never indicating which field is wrong.
4. WHEN a user provides an email that does not exist, THEN the system SHALL return HTTP 401 with the same generic message "Invalid email or password."
5. WHEN a user's email is not verified (production mode), THEN the system SHALL return HTTP 403 with message "Please verify your email address before logging in."
6. WHEN a user's account is suspended, THEN the system SHALL return HTTP 403 with message "Your account has been suspended. Please contact support."
7. WHEN a user's account is soft-deleted, THEN the system SHALL return HTTP 401 with the generic message "Invalid email or password."
8. WHEN a user fails authentication 5 consecutive times within 15 minutes, THEN the system SHALL lock the account for 15 minutes and return HTTP 429 with message "Too many failed attempts. Please try again in 15 minutes."
9. WHEN a successful login occurs, THEN the system SHALL reset the failed attempt counter and write an audit log entry with action `user_login`.
10. WHEN a failed login occurs, THEN the system SHALL increment the failed attempt counter and write an audit log entry with action `user_login_failed`.

---

### Requirement 5: Logout

**User Story:** As a logged-in user, I want to log out so that my session is securely terminated.

#### Acceptance Criteria

1. WHEN a user calls `POST /auth/logout` with a valid access token, THEN the system SHALL revoke the current refresh token by setting `revoked_at = now()` in the database.
2. WHEN logout is called, THEN the system SHALL clear the refresh token HTTP-only cookie by setting it with `Max-Age=0`.
3. WHEN logout is called, THEN the system SHALL return HTTP 200 with `{ message: "Logged out successfully." }`.
4. WHEN logout is called with an already-revoked or missing refresh token, THEN the system SHALL still return HTTP 200 (idempotent operation).
5. WHEN a user logs out, THEN the system SHALL write an audit log entry with action `user_logout`.

---

### Requirement 6: Refresh Token Rotation

**User Story:** As a logged-in user, I want my session to silently renew so that I am never unexpectedly logged out during normal use.

#### Acceptance Criteria

1. WHEN a client sends a valid, non-revoked, non-expired refresh token (via HTTP-only cookie), THEN the system SHALL issue a new access token AND a new refresh token.
2. WHEN a new refresh token is issued, THEN the old refresh token SHALL be revoked (its `revoked_at` set to now) atomically within the same database transaction.
3. WHEN a refresh token has been revoked, THEN the system SHALL return HTTP 401 with message "Session expired. Please log in again."
4. WHEN a refresh token has expired, THEN the system SHALL return HTTP 401 with message "Session expired. Please log in again."
5. WHEN refresh token reuse is detected (a revoked token is used again), THEN the system SHALL revoke ALL refresh tokens for that user (session invalidation) and write an audit log entry with action `refresh_token_reuse_detected`.

---

### Requirement 7: Forgot Password

**User Story:** As a user who has forgotten their password, I want to receive a reset link so that I can regain access to my account.

#### Acceptance Criteria

1. WHEN a user submits a valid email to `POST /auth/forgot-password`, THEN the system SHALL send a password reset email with a time-limited token (≤ 1 hour) to that email, if an account exists.
2. WHEN a user submits an email that does not exist, THEN the system SHALL return HTTP 200 with the same generic response — never revealing whether an account exists.
3. WHEN the email is sent, THEN it SHALL contain a link of the form `{FRONTEND_URL}/reset-password?token={token}`.
4. WHEN a reset token is already active for a user and a new request is made, THEN the previous token SHALL be invalidated before the new one is created.

---

### Requirement 8: Reset Password

**User Story:** As a user with a valid reset token, I want to set a new password so that I can regain access.

#### Acceptance Criteria

1. WHEN a user submits a valid (non-expired) reset token and a new password, THEN the system SHALL hash the new password, update the user record, and revoke all existing refresh tokens for that user.
2. WHEN the reset is successful, THEN the system SHALL return HTTP 200 with `{ message: "Password reset successfully. Please log in." }`.
3. WHEN a reset token is expired or invalid, THEN the system SHALL return HTTP 400 with message "This reset link is invalid or has expired."
4. WHEN a reset token has already been used, THEN the system SHALL return HTTP 400 with message "This reset link has already been used."
5. WHEN password is reset, THEN the system SHALL write an audit log entry with action `password_reset`.

---

### Requirement 9: Change Password

**User Story:** As a logged-in user, I want to change my password so that I can keep my account secure.

#### Acceptance Criteria

1. WHEN a logged-in user submits their current password and a new password to `PATCH /auth/password`, THEN the system SHALL verify the current password before updating.
2. WHEN the current password is incorrect, THEN the system SHALL return HTTP 401 with message "Current password is incorrect."
3. WHEN the new password is the same as the current password, THEN the system SHALL return HTTP 400 with message "New password must be different from your current password."
4. WHEN the password is changed successfully, THEN the system SHALL revoke all other active refresh tokens (forcing re-login on other devices) and write an audit log entry with action `password_changed`.

---

### Requirement 10: RBAC and Route Protection

**User Story:** As the platform, I want every route protected by role so that users can only access what they are permitted to.

#### Acceptance Criteria

1. WHEN any request is made to a protected route without a valid access token, THEN the system SHALL return HTTP 401.
2. WHEN a request is made to a route restricted to a specific role with a token belonging to a different role, THEN the system SHALL return HTTP 403.
3. WHEN an administrator accesses the admin portal, THEN only users with `role = admin` SHALL be permitted.
4. WHEN a route is decorated with `@Public()`, THEN no authentication is required for that route.
5. WHEN a suspended account's access token is presented (within its 15-min lifetime), THEN the system SHALL return HTTP 403 — suspension is checked on every request to sensitive endpoints.

---

### Requirement 11: Security Controls

**User Story:** As the platform operator, I want robust security controls so that the authentication system is resistant to common attacks.

#### Acceptance Criteria

1. WHEN any authentication endpoint receives more than 10 requests per minute from the same IP, THEN the system SHALL return HTTP 429 Too Many Requests.
2. WHEN passwords are stored, THEN they SHALL be hashed using bcrypt with cost factor 12.
3. WHEN refresh tokens are stored, THEN only the SHA-256 hash of the token SHALL be stored in the database — the raw token is only ever transmitted to the client.
4. WHEN password reset and verification tokens are generated, THEN they SHALL be cryptographically random (32 bytes from `crypto.randomBytes`).
5. WHEN any authentication error occurs, THEN the response SHALL never include a stack trace or internal system details.
6. WHEN CSRF protection is required, THEN the system SHALL use the double-submit cookie pattern for state-mutating endpoints called from the browser.

---

### Requirement 12: Frontend Authentication Pages

**User Story:** As a user, I want clean, simple authentication pages in English and Arabic so that I can register and log in without friction.

#### Acceptance Criteria

1. WHEN a professional visits `/register`, THEN they SHALL see a form with: full name, email, password, phone number, and industry selector — nothing else.
2. WHEN an employer visits `/register/employer`, THEN they SHALL see a form with: full name, company name, trade license number, industry, country, email, and password.
3. WHEN a user visits `/login`, THEN they SHALL see an email + password form with a "Forgot password?" link.
4. WHEN a user visits `/forgot-password`, THEN they SHALL see an email input and a submit button.
5. WHEN a user visits `/reset-password?token=xxx`, THEN they SHALL see a new password + confirm password form.
6. WHEN the locale is Arabic, THEN ALL pages SHALL render in RTL layout with Arabic labels.
7. WHEN a form is submitted with validation errors, THEN errors SHALL appear inline next to the relevant field.
8. WHEN a form is submitting, THEN a loading state SHALL be shown and the submit button SHALL be disabled to prevent double submission.
9. WHEN registration succeeds in production, THEN the user SHALL be shown a "Check your email to verify your account" confirmation screen.
10. WHEN registration succeeds in dev mode, THEN the user SHALL be immediately redirected to their dashboard.
