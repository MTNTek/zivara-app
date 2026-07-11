# Requirements Document

## Introduction

Zivara is a production-grade workforce marketplace for the GCC region. Its mission is to make hiring simple, fast, fair, transparent, and reliable for both professionals seeking work and employers seeking talent. The platform serves three user roles — Professional, Employer, and Administrator — across six Phase 1 industries: Construction, Solar Energy, Hospitality, Cleaning, Domestic Services, and Private Tutoring.

All engineering decisions must uphold the platform's core values: Trust, Fairness, Transparency, Reliability, Respect, Simplicity, Compliance, and Quality.

---

## Glossary

| Term | Definition |
|------|------------|
| Professional | A job seeker registered on the platform seeking employment or shift-based work |
| Employer | A company or individual registered to post jobs and hire professionals |
| Administrator | A Zivara staff member managing the platform via the Admin Portal |
| Job Posting | A publicly visible listing created by an employer describing an open role |
| Application | A formal expression of interest submitted by a professional for a job posting |
| Shift | A time-bound work engagement (scheduled hours) assigned to a professional |
| Shortlist | An employer action explicitly selecting a professional as a candidate of interest |
| Verification | The process of confirming a user's identity and/or credentials |
| RBAC | Role-Based Access Control — permissions assigned based on user role |
| GCC | Gulf Cooperation Council — the target geographic market |
| i18n | Internationalization — the architecture supporting multiple languages |

---

## Requirements

### Requirement 1: Project Foundation

**User Story:** As a development team, I want a clean, modular project foundation so that all future features are built on a consistent, maintainable, and scalable base.

#### Acceptance Criteria

1. WHEN the project is initialized, THEN it SHALL contain two top-level workspaces: `apps/web` (Next.js frontend) and `apps/api` (NestJS backend), with shared types in `packages/shared`.
2. WHEN a developer sets up the project locally, THEN a single `docker-compose.yml` SHALL spin up PostgreSQL, the API, and the web app with no manual configuration steps beyond copying `.env.example`.
3. WHEN the project is structured, THEN folder names SHALL reflect business domains (e.g., `professionals`, `employers`, `jobs`, `applications`, `shifts`, `ratings`, `notifications`, `admin`) and SHALL NOT reflect UI pages or API routes.
4. WHEN any module is added, THEN it SHALL be self-contained with its own controllers, services, repositories, DTOs, and tests.
5. WHEN the repository is cloned, THEN a `README.md` SHALL be present with clear setup, development, and deployment instructions.
6. THE project SHALL include the following documentation files at the root level: `VISION.md`, `PRODUCT.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `DEPLOYMENT.md`, `CHANGELOG.md`.
7. WHEN environment variables are required, THEN they SHALL be validated at application startup and the process SHALL fail fast with a descriptive error if any required variable is missing.

---

### Requirement 2: Database Architecture

**User Story:** As a platform architect, I want a database designed around business rules so that the data model is clean, reliable, and supports the full business domain without coupling to UI or API concerns.

#### Acceptance Criteria

1. WHEN the database is designed, THEN each table SHALL have one clear, single responsibility aligned to a business entity.
2. WHEN relationships are defined, THEN foreign key constraints SHALL be enforced at the database level.
3. WHEN the platform stores a professional's country of origin, THEN that field SHALL be informational only and SHALL NOT be used as an automatic exclusion criterion in job matching or search results. IF an employer wishes to configure a country-based exclusion for a legitimate business reason or as required by applicable law, THEN the configuration SHALL require: documented justification, human review and approval by a Zivara administrator, and a full audit trail of the decision before the exclusion takes effect.
4. WHEN the schema is created, THEN all tables SHALL include `created_at` and `updated_at` timestamps managed automatically.
5. WHEN migrations are run, THEN they SHALL be versioned, sequential, and reproducible using Drizzle ORM migration tooling.
6. WHEN the database is designed, THEN it SHALL support multi-language content fields (English and Arabic at launch) in a way that allows adding further languages (e.g., Chinese) without schema restructuring.
7. WHEN the database grows, THEN it SHALL support future GCC geographic expansion (additional countries, cities, regions) without requiring structural changes.

---

### Requirement 3: Authentication and Authorization

**User Story:** As a user, I want secure, simple authentication so that I can access the platform safely without friction.

#### Acceptance Criteria

1. WHEN a user registers, THEN the system SHALL support registration for three roles: Professional, Employer, and Administrator.
2. WHEN a user logs in with valid credentials, THEN the system SHALL issue a short-lived JWT access token and a long-lived refresh token.
3. WHEN an access token expires, THEN the system SHALL silently reissue a new access token using the refresh token without requiring the user to log in again, provided the refresh token is valid and not revoked.
4. WHEN a refresh token is used, THEN it SHALL be rotated (old token invalidated, new token issued) to prevent replay attacks.
5. WHEN a user logs out, THEN the refresh token SHALL be revoked server-side immediately.
6. WHEN any API endpoint is accessed, THEN the system SHALL enforce RBAC, granting access only to roles with the appropriate permission.
7. WHEN a professional attempts to access an employer-only endpoint (or vice versa), THEN the system SHALL return HTTP 403 Forbidden.
8. WHEN passwords are stored, THEN they SHALL be hashed using bcrypt with a minimum cost factor of 12.
9. WHEN a user requests a password reset, THEN the system SHALL send a time-limited (≤ 1 hour) reset link to their registered email.
10. WHEN an account is suspended by an administrator, THEN all active sessions for that account SHALL be invalidated immediately.
11. WHEN a new user registers, THEN email verification SHALL be required before the account is activated.

---

### Requirement 4: Professional Module

**User Story:** As a professional, I want to create and manage my profile so that employers can discover me and I can apply for jobs that match my skills.

#### Acceptance Criteria

1. WHEN a professional registers, THEN the system SHALL collect: full name, email, phone number, nationality, current location (city/country), and primary industry.
2. WHEN a professional completes their profile, THEN they SHALL be able to add: work experience, education, skills, certifications, languages spoken, and a profile photo.
3. WHEN a professional uploads documents (e.g., ID, certifications), THEN the system SHALL store them securely and associate them with the professional's verification status.
4. WHEN a professional's identity is verified by an administrator, THEN a visible "Verified" badge SHALL appear on their public profile.
5. WHEN a professional's profile is public, THEN it SHALL be discoverable by employers via search without requiring the employer to know the professional's name.
6. WHEN a professional sets their profile to private, THEN it SHALL NOT appear in employer search results.
7. WHEN a professional views their profile, THEN they SHALL see a completeness indicator showing what percentage of their profile is filled in.
8. WHEN a professional's profile reaches 100% completion, THEN the system SHALL surface that profile higher in relevant search results.
9. WHEN a professional edits their profile, THEN changes SHALL be saved immediately and reflected in search results within 5 minutes.
10. THE system SHALL detect duplicate professional profiles (same name, phone, or government ID) and flag them for administrator review rather than silently allowing duplicates.

---

### Requirement 5: Employer Module

**User Story:** As an employer, I want to create a company profile and manage my hiring activity so that I can find and hire the right professionals efficiently.

#### Acceptance Criteria

1. WHEN an employer registers, THEN the system SHALL collect: company name, trade license number, industry, primary contact name, email, phone number, and operating country.
2. WHEN an employer submits a trade license, THEN an administrator SHALL review and approve it before the employer can post jobs publicly.
3. WHEN an employer is verified AND their account is in good standing (no active suspensions, no unresolved compliance flags), THEN a "Verified Employer" badge SHALL appear on their public company profile. IF the employer's account is subsequently suspended or a compliance flag is raised, THEN the badge SHALL be removed until the issue is resolved.
4. WHEN an employer creates a company profile, THEN they SHALL be able to add: company description, logo, website, number of employees, and locations.
5. WHEN an employer account has multiple users (e.g., HR team), THEN the system SHALL support sub-accounts under one company with role-based permissions (Owner, Manager, Recruiter).
6. WHEN an employer views their dashboard, THEN they SHALL see: active job postings, total applications received, shortlisted candidates, and pending actions requiring their attention.
7. WHEN an employer searches for professionals, THEN the system SHALL return results ranked by relevance to the employer's industry and job requirements, with AI-powered matching running transparently in the background.
8. WHEN an employer views a professional's profile, THEN they SHALL see the professional's skills, experience, verification status, and ratings. IF the professional has explicitly chosen to make their nationality or country of origin visible, THEN the employer SHALL be permitted to see that information; otherwise, nationality and country of origin SHALL NOT be displayed to employers.

---

### Requirement 6: Job Postings

**User Story:** As an employer, I want to post jobs quickly and clearly so that the right professionals can find and apply to them.

#### Acceptance Criteria

1. WHEN an employer creates a job posting, THEN the system SHALL require: job title, industry, location (city/country), employment type (full-time, part-time, shift-based, contract), job description, and required skills.
2. WHEN an employer posts a job, THEN it SHALL become publicly visible to professionals browsing the platform within 2 minutes of posting.
3. WHEN a professional browses job listings without being registered, THEN they SHALL be able to see the job title, industry, location, employment type, and a summary — but SHALL be prompted to register to view full details and apply.
4. WHEN an employer sets a salary range on a job posting, THEN it SHALL be displayed transparently to all viewers.
5. WHEN a job posting is closed by the employer or expired, THEN it SHALL no longer accept new applications and SHALL be removed from public search results.
6. WHEN a job posting is created, THEN the employer SHALL be able to set an expiry date; IF no expiry date is set, THEN the job SHALL auto-expire after 60 days.
7. WHEN an employer edits an active job posting, THEN existing applications SHALL NOT be affected and applicants SHALL NOT be notified of minor edits (e.g., typo fixes).
8. WHEN a job posting is duplicated by an employer, THEN the system SHALL create a new draft with the same content, requiring the employer to review and publish it separately.
9. WHEN an employer views a job posting's performance, THEN they SHALL see: total views, total applications, shortlisted count, and hired count.
10. THE system SHALL use AI to suggest relevant professionals for each job posting, but these suggestions SHALL be presented as recommendations, not automatic matches.

---

### Requirement 7: Applications

**User Story:** As a professional, I want to apply for jobs simply and track my application status transparently so that I always know where I stand.

#### Acceptance Criteria

1. WHEN a professional applies for a job, THEN the application SHALL require no more than 3 steps to submit.
2. WHEN a professional submits an application, THEN the system SHALL confirm receipt with a notification.
3. WHEN an employer reviews an application, THEN they SHALL be able to set the status to one of: Received, Under Review, Shortlisted, Rejected, Hired.
4. WHEN an employer sets an application status to "Shortlisted", THEN the professional SHALL receive a notification that they have been shortlisted.
5. WHEN an application status changes to any status OTHER than "Shortlisted", THEN the professional SHALL NOT receive a "Shortlisted" notification — the notification type SHALL exactly match the actual status change.
6. WHEN a professional is rejected, THEN they SHALL receive a respectful rejection notification without disclosing the reason unless the employer explicitly provides one.
7. WHEN a professional views their applications dashboard, THEN they SHALL see each application with its current status, the job title, the employer name, and the date applied.
8. WHEN an employer has not reviewed an application within 14 days, THEN the system SHALL send the employer a reminder notification.
9. WHEN a professional withdraws an application, THEN the employer SHALL be notified and the application SHALL be removed from their active pipeline.
10. THE system SHALL prevent a professional from submitting duplicate applications to the same active job posting.

---

### Requirement 8: Notifications

**User Story:** As a user, I want to receive timely and accurate notifications so that I can stay informed without being misled or overwhelmed.

#### Acceptance Criteria

1. WHEN a triggering event occurs, THEN the system SHALL send a notification that accurately reflects only what has actually happened (e.g., a "Shortlisted" notification SHALL only be sent when an employer explicitly shortlists a candidate); IF no triggering event has occurred, THEN the system SHALL have full flexibility in how it handles or suppresses notifications, but SHALL NOT fabricate or misrepresent an event.
2. WHEN a user receives a notification, THEN it SHALL be delivered via: in-app notification center AND email.
3. WHEN a user views their notification center, THEN unread notifications SHALL be visually distinct from read notifications.
4. WHEN a user clicks a notification, THEN they SHALL be taken directly to the relevant context (e.g., the specific application, job posting, or profile).
5. WHEN a user wants to manage their notifications, THEN they SHALL be able to toggle specific notification types on or off from their account settings.
6. WHEN the system sends a notification, THEN it SHALL respect the user's preferred language (English or Arabic) for the notification content.
7. WHEN a batch of notifications would be triggered in quick succession (e.g., bulk employer actions), THEN the system SHALL batch them into a single summary notification rather than flooding the user.
8. THE system SHALL never send promotional or marketing notifications without explicit opt-in from the user.

---

### Requirement 9: Shifts

**User Story:** As an employer, I want to schedule and manage shifts for hired professionals so that work schedules are transparent and disputes are minimized.

#### Acceptance Criteria

1. WHEN an employer creates a shift, THEN it SHALL require: professional assigned, shift date, start time, end time, location, and role/task description.
2. WHEN a shift is created and assigned to a professional, THEN the professional SHALL receive a notification with the full shift details.
3. WHEN a professional confirms a shift, THEN the employer SHALL be notified of the confirmation.
4. WHEN a professional cannot attend a confirmed shift, THEN they SHALL be able to cancel with a reason, and the employer SHALL be notified immediately.
5. WHEN a shift is completed, THEN both the employer and professional SHALL be prompted to confirm completion before any payment or rating process begins.
6. WHEN a shift completion is disputed, THEN the dispute SHALL be escalated to an administrator for review.
7. WHEN shifts are viewed by a professional, THEN they SHALL be presented in a clear calendar or list view with upcoming, active, and past shifts clearly categorized.
8. WHEN an employer views their shifts dashboard, THEN they SHALL see all scheduled, active, and completed shifts with professional names and statuses.

---

### Requirement 10: Ratings and Reviews

**User Story:** As a platform participant, I want to rate and review my experience so that trust is built through transparent feedback.

#### Acceptance Criteria

1. WHEN a shift is completed and confirmed by both parties, THEN both the employer and the professional SHALL be prompted to submit a rating (1–5 stars) and an optional written review.
2. WHEN a rating is submitted, THEN it SHALL be permanent and SHALL NOT be deletable by the submitting party (only modifiable by administrators in cases of abuse).
3. WHEN a professional's ratings are displayed, THEN the average star rating and total number of ratings SHALL be visible on their public profile.
4. WHEN an employer's ratings are displayed, THEN the average star rating and total number of ratings SHALL be visible on their public company profile.
5. WHEN a user submits a rating containing prohibited content (hate speech, personal attacks, false claims), THEN the system SHALL flag it for administrator review before publishing.
6. WHEN a rating is under review, THEN it SHALL NOT be visible publicly until cleared by an administrator.
7. WHEN a professional or employer disputes a published rating, THEN the dispute SHALL be reviewed by an administrator who can remove or keep the rating.
8. THE system SHALL weight recent ratings more heavily than older ratings when computing the displayed average, to reflect current behavior.

---

### Requirement 11: Admin Portal

**User Story:** As an administrator, I want full visibility and control over the platform so that I can maintain quality, resolve disputes, and ensure compliance.

#### Acceptance Criteria

1. WHEN an administrator logs in, THEN they SHALL land on a dashboard showing: total users (by role), new registrations today, active job postings, open disputes, pending verifications, and flagged content.
2. WHEN an administrator reviews a professional's verification request, THEN they SHALL be able to: approve, reject, or request additional documents.
3. WHEN an administrator reviews an employer's trade license, THEN they SHALL be able to: approve, reject, or suspend the employer account.
4. WHEN an administrator suspends any account, THEN all active sessions for that account SHALL be terminated immediately and the user SHALL be notified via email.
5. WHEN an administrator reviews a flagged rating, THEN they SHALL be able to: approve publication, remove the rating, or request a revision from the submitter.
6. WHEN an administrator views a dispute, THEN they SHALL see the full context: the shift details, both parties' accounts, and the submitted evidence.
7. WHEN an administrator resolves a dispute, THEN both parties SHALL be notified of the outcome.
8. WHEN an administrator views platform analytics, THEN they SHALL see: job posting trends by industry, application volume, verification turnaround time, and user growth over selectable time periods.
9. WHEN an administrator performs any action (approve, reject, suspend, resolve), THEN that action SHALL be logged with the administrator's ID, timestamp, and a reason field.
10. THE admin portal SHALL be accessible only to users with the Administrator role and SHALL be served from a separate, protected route.

---

### Requirement 12: Search and Discovery

**User Story:** As a platform user, I want powerful, fast, and fair search so that I can find what I need without bias or friction.

#### Acceptance Criteria

1. WHEN a professional searches for jobs, THEN they SHALL be able to filter by: industry, location (country and city), employment type, salary range, and required skills.
2. WHEN an employer searches for professionals, THEN they SHALL be able to filter by: industry, skills, location, availability, and verification status.
3. WHEN search results are returned, THEN they SHALL be ordered by relevance, with AI-assisted ranking running transparently in the background.
4. WHEN AI ranking influences search results, THEN the system SHALL be capable of providing a human-readable explanation of why a result was ranked highly (for administrator review), even if that explanation is not surfaced to end users.
5. WHEN search results are displayed, THEN nationality or country of origin SHALL NOT be a visible sort or filter criterion available to employers in the standard search interface.
6. WHEN a search returns no results, THEN the system SHALL display a helpful message with suggested alternative search terms or relaxed filters.
7. WHEN a professional searches for jobs, THEN they SHALL be able to save a search and receive notifications when new matching jobs are posted.

---

### Requirement 13: Payments

**User Story:** As a platform participant, I want payments to be transparent and timely so that I can trust the financial side of the platform.

#### Acceptance Criteria

1. WHEN a shift is completed and confirmed, THEN the system SHALL initiate the payment process within 24 hours.
2. WHEN a payment is processed, THEN both the employer and the professional SHALL receive a notification confirming the transaction.
3. WHEN a professional views their earnings, THEN they SHALL see a clear breakdown: completed shifts, pending payments, processed payments, and any deductions.
4. WHEN an employer views their billing, THEN they SHALL see a clear breakdown: platform fees, payments to professionals, and pending amounts.
5. WHEN a payment is disputed, THEN it SHALL be escalated to an administrator and held pending resolution.
6. WHEN a payment fails, THEN both parties SHALL be notified immediately with clear instructions on how to resolve the issue.
7. THE payment system SHALL comply with applicable financial regulations in each GCC country where the platform operates.

---

### Requirement 14: Internationalisation (i18n)

**User Story:** As a user in the GCC, I want to use the platform in my preferred language so that I can interact with it naturally and without barriers.

#### Acceptance Criteria

1. WHEN the platform launches, THEN it SHALL support English and Arabic fully — all UI text, notifications, emails, and error messages SHALL be available in both languages.
2. WHEN a user selects Arabic as their language, THEN the entire UI SHALL render in RTL (right-to-left) layout.
3. WHEN a new language is added in the future (e.g., Chinese), THEN it SHALL be possible to add it by supplying translation files only, without modifying application code or database schema.
4. WHEN a user sets their language preference, THEN it SHALL be persisted to their account and respected across all devices and sessions.
5. WHEN a notification or email is sent, THEN it SHALL be in the recipient's preferred language.

---

### Requirement 15: Non-Functional Requirements

**User Story:** As a platform operator, I want the system to be performant, secure, accessible, and production-ready so that users can trust it with their livelihoods.

#### Acceptance Criteria

1. WHEN a page is loaded, THEN the Time to First Contentful Paint (FCP) SHALL be under 2 seconds on a standard 4G connection.
2. WHEN the API receives a standard request, THEN the p95 response time SHALL be under 300ms under normal load conditions.
3. WHEN the system is under peak load (defined as 10x normal traffic), THEN it SHALL degrade gracefully without data loss or corruption.
4. WHEN user data is stored or transmitted, THEN it SHALL be encrypted at rest (AES-256) and in transit (TLS 1.2+).
5. WHEN any API endpoint is called, THEN it SHALL be protected against: SQL injection, XSS, CSRF, and brute-force attacks.
6. WHEN the frontend is rendered, THEN it SHALL meet WCAG 2.1 AA accessibility standards.
7. WHEN the platform is deployed, THEN it SHALL be containerized using Docker and deployable to AWS with zero-downtime rolling deployments.
8. WHEN a system error occurs, THEN it SHALL be logged with full context (request ID, timestamp, user ID if available, stack trace) and SHALL NOT expose internal implementation details to the end user.
9. WHEN the platform stores personal data, THEN it SHALL comply with applicable GCC data protection regulations.
10. WHEN automated tests are run, THEN unit test coverage SHALL be ≥ 80% for all business-critical modules (auth, applications, payments, notifications).
