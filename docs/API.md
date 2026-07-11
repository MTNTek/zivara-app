# Zivara — API

## Overview

The Zivara API is a RESTful JSON API served by the NestJS backend at port 4000. It is the single interface for all client applications — the Next.js web app, the future Flutter mobile app, and any third-party integrations.

**Base URL (production):** `https://api.zivara.com`  
**Base URL (local dev):** `http://localhost:4000`

---

## Conventions

### URL Structure

All API endpoints are versioned and prefixed:

```
/api/v1/{resource}
```

Examples:
```
GET  /api/v1/jobs
POST /api/v1/auth/login
GET  /api/v1/professionals/:id
```

### HTTP Methods

| Method | Meaning |
|--------|---------|
| GET | Read a resource or collection |
| POST | Create a new resource |
| PATCH | Partial update of an existing resource |
| DELETE | Remove a resource |
| PUT | Full replacement (used rarely; prefer PATCH) |

### Content Type

All requests with a body must include:
```
Content-Type: application/json
```

All responses are JSON with:
```
Content-Type: application/json; charset=utf-8
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success — response body contains the resource |
| 201 | Created — resource created; body contains the new resource |
| 204 | No Content — success with no response body (e.g., logout) |
| 400 | Bad Request — validation failure; body contains field-level errors |
| 401 | Unauthorized — missing or invalid access token |
| 403 | Forbidden — valid token but insufficient role or permissions |
| 404 | Not Found — resource does not exist |
| 409 | Conflict — duplicate resource (e.g., duplicate application) |
| 422 | Unprocessable Entity — business rule violation (e.g., applying to a closed job) |
| 429 | Too Many Requests — rate limit exceeded |
| 500 | Internal Server Error — unexpected server error |

---

## Authentication

Zivara uses a JWT access token + opaque refresh token scheme.

### Obtaining Tokens

```
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "..."
}
```

Response:
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "d9f3a2b1...",
  "expiresIn": 900
}
```

- `accessToken`: JWT signed with RS256, expiry 15 minutes, contains `userId`, `role`, `employerId` (if employer)
- `refreshToken`: opaque random token, 30-day expiry, stored hashed in the database
- `expiresIn`: seconds until the access token expires (always 900 = 15 minutes)

### Using the Access Token

Include the token in the `Authorization` header on every authenticated request:

```
Authorization: Bearer <accessToken>
```

### Refreshing the Access Token

When the access token expires, obtain a new pair:

```
POST /api/v1/auth/refresh
{
  "refreshToken": "d9f3a2b1..."
}
```

Response:
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "f7e4c3d2...",
  "expiresIn": 900
}
```

The old refresh token is invalidated immediately (rotation). The client must store and use the new refresh token.

### Logout

```
POST /api/v1/auth/logout
Authorization: Bearer <accessToken>
```

Revokes all refresh tokens for the authenticated user. Returns 204.

### Token Expiry Handling

The recommended client flow:
1. Attach the access token to every request
2. If a request returns 401, attempt a silent refresh using the refresh token
3. If the refresh also returns 401, clear all tokens and redirect to login

---

## Error Response Format

All error responses use a consistent shape:

```json
{
  "statusCode": 422,
  "error": "Unprocessable Entity",
  "message": "Cannot apply to a closed job posting",
  "requestId": "01HZ4K9BQR8MNXP3T6V7WY2C5D"
}
```

| Field | Type | Description |
|-------|------|-------------|
| statusCode | number | HTTP status code |
| error | string | HTTP status name |
| message | string | Human-readable description of the error |
| requestId | string | Unique request identifier for log correlation |

For validation errors (400), the `message` field is an array of field-level error strings:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": [
    "email must be a valid email address",
    "password must be at least 8 characters"
  ],
  "requestId": "01HZ4K9BQR8MNXP3T6V7WY2C5D"
}
```

Internal error details (stack traces, database errors, internal IDs) are never included in error responses. They are logged server-side with the full request context.

---

## Pagination

### Offset Pagination

Used for admin lists, analytics, and non-cursor-sensitive queries.

Request:
```
GET /api/v1/admin/users?page=2&limit=20
```

Response:
```json
{
  "data": [...],
  "meta": {
    "page": 2,
    "limit": 20,
    "total": 487,
    "totalPages": 25
  }
}
```

Default `limit`: 20. Maximum `limit`: 100.

### Cursor Pagination

Used for feeds, notification centers, and any list where items may change between pages (additions or deletions).

Request:
```
GET /api/v1/notifications?limit=20&cursor=01HZ4K9BQR8MNXP3T6V7WY2C5D
```

Response:
```json
{
  "data": [...],
  "meta": {
    "limit": 20,
    "nextCursor": "01HZ4K9BQR8MNXP3T6V7WY2C6E",
    "hasMore": true
  }
}
```

`cursor` is an opaque string (typically a ULID or encoded timestamp+ID pair). If `hasMore` is false, there are no more results. If `nextCursor` is null, the client has reached the end.

---

## RBAC: Role-Based Access

Every endpoint declares which roles may access it. Accessing an endpoint without the required role returns 403.

| Role | Access |
|------|--------|
| `professional` | Own profile, job search, applications, shifts (as professional), notifications, ratings |
| `employer` | Company profile, job postings, applications (as employer), shifts (as employer), payments (billing view), professional search |
| `admin` | All of the above plus admin portal endpoints (verifications, disputes, analytics, user management) |

Employer sub-account roles (Owner, Manager, Recruiter) are enforced at the service layer within the employer scope. All three sub-roles still authenticate as `employer` in the JWT.

---

## Request Validation

All request bodies are validated using class-validator DTOs with NestJS `ValidationPipe` configured with:
- `whitelist: true` — strips unknown fields
- `forbidNonWhitelisted: true` — returns 400 if unknown fields are present
- `transform: true` — coerces strings to numbers, parses dates, etc.

Validation errors return 400 with an array of field-level messages.

---

## Rate Limiting

Rate limiting is applied at the Nginx / AWS ALB layer.

| Endpoint Group | Limit |
|---------------|-------|
| `POST /api/v1/auth/login` | 5 requests / minute per IP |
| `POST /api/v1/auth/refresh` | 10 requests / minute per IP |
| `POST /api/v1/auth/register` | 3 requests / minute per IP |
| All other endpoints | 300 requests / minute per authenticated user |

Exceeding a rate limit returns 429 with a `Retry-After` header indicating seconds until the limit resets.

---

## Versioning

The current API version is `v1`. The version appears in the URL path prefix: `/api/v1/`.

When a breaking change is required, a new version (`v2`) is introduced alongside `v1`. Both versions are maintained in parallel for a deprecation period (minimum 6 months). Clients are notified of deprecation via a `Deprecation` response header.

Non-breaking changes (new optional fields, new endpoints) are added to the existing version without a version bump.

---

## Key Resource Endpoints

The following is a summary of the primary endpoints. Each module's full endpoint documentation lives alongside its code.

### Authentication

```
POST   /api/v1/auth/register          Register a new user (professional or employer)
POST   /api/v1/auth/login             Authenticate and receive token pair
POST   /api/v1/auth/refresh           Rotate refresh token
POST   /api/v1/auth/logout            Revoke all sessions
POST   /api/v1/auth/verify-email      Verify email address with token
POST   /api/v1/auth/forgot-password   Request password reset email
POST   /api/v1/auth/reset-password    Set new password using reset token
```

### Professionals

```
POST   /api/v1/professionals          Create professional profile
GET    /api/v1/professionals/:id      Get public professional profile
PATCH  /api/v1/professionals/:id      Update own profile
GET    /api/v1/professionals/me       Get own full profile
POST   /api/v1/professionals/:id/documents   Upload verification document
GET    /api/v1/professionals/:id/documents   List own documents
```

### Employers

```
POST   /api/v1/employers              Create employer profile
GET    /api/v1/employers/:id          Get public employer profile
PATCH  /api/v1/employers/:id          Update own employer profile
GET    /api/v1/employers/me           Get own full employer profile
POST   /api/v1/employers/:id/members  Invite a team member
DELETE /api/v1/employers/:id/members/:memberId  Remove a team member
```

### Jobs

```
GET    /api/v1/jobs                   List active jobs (public, filterable)
GET    /api/v1/jobs/:id               Get job detail (public for active jobs)
POST   /api/v1/jobs                   Create a job posting (employer)
PATCH  /api/v1/jobs/:id               Update a job posting (employer)
POST   /api/v1/jobs/:id/publish       Publish a draft job (employer)
POST   /api/v1/jobs/:id/close         Close a job posting (employer)
POST   /api/v1/jobs/:id/duplicate     Duplicate a job posting (employer)
GET    /api/v1/jobs/:id/stats         Get job performance stats (employer)
```

### Applications

```
POST   /api/v1/applications           Apply to a job (professional)
GET    /api/v1/applications           List own applications (professional) or received applications (employer)
GET    /api/v1/applications/:id       Get application detail
PATCH  /api/v1/applications/:id/status  Update application status (employer)
DELETE /api/v1/applications/:id       Withdraw application (professional)
```

### Shifts

```
POST   /api/v1/shifts                 Create a shift (employer)
GET    /api/v1/shifts                 List shifts (filtered by role)
GET    /api/v1/shifts/:id             Get shift detail
POST   /api/v1/shifts/:id/confirm     Professional confirms attendance
POST   /api/v1/shifts/:id/confirm-completion  Either party confirms shift completion
POST   /api/v1/shifts/:id/cancel      Cancel a shift
POST   /api/v1/shifts/:id/dispute     Raise a dispute
```

### Ratings

```
POST   /api/v1/ratings                Submit a rating for a completed shift
GET    /api/v1/ratings?revieweeId=:id List ratings for a professional or employer
```

### Notifications

```
GET    /api/v1/notifications          List notifications for authenticated user
PATCH  /api/v1/notifications/:id/read  Mark notification as read
POST   /api/v1/notifications/read-all  Mark all as read
PATCH  /api/v1/notifications/preferences  Update notification preferences
```

### Payments

```
GET    /api/v1/payments/earnings      Professional earnings summary
GET    /api/v1/payments/billing       Employer billing summary
POST   /api/v1/payments/:id/dispute   Dispute a payment
```

### Search

```
GET    /api/v1/search/jobs            Search and filter jobs
GET    /api/v1/search/professionals   Search and filter professionals (employer only)
POST   /api/v1/search/save            Save a job search (professional)
```

### Admin

```
GET    /api/v1/admin/dashboard        Platform statistics
GET    /api/v1/admin/verifications    List pending verification requests
POST   /api/v1/admin/verifications/:id/approve    Approve verification
POST   /api/v1/admin/verifications/:id/reject     Reject verification
POST   /api/v1/admin/verifications/:id/request-docs  Request additional documents
POST   /api/v1/admin/users/:id/suspend  Suspend a user account
GET    /api/v1/admin/disputes         List open disputes
POST   /api/v1/admin/disputes/:id/resolve  Resolve a dispute
GET    /api/v1/admin/ratings/flagged  List flagged ratings pending review
POST   /api/v1/admin/ratings/:id/approve  Approve a flagged rating for publication
POST   /api/v1/admin/ratings/:id/remove   Remove a rating
GET    /api/v1/admin/analytics        Platform analytics
```

### Health

```
GET    /health                        Liveness probe (no auth required)
```

---

## Request and Response Examples

### Register a Professional

```
POST /api/v1/auth/register
{
  "email": "ahmed.hassan@example.com",
  "password": "SecurePass123!",
  "role": "professional",
  "fullName": "Ahmed Hassan",
  "phone": "+971501234567",
  "currentCity": "Dubai",
  "currentCountry": "UAE",
  "primaryIndustry": "Construction"
}
```

Response `201`:
```json
{
  "id": "01HZ4K9BQR8MNXP3T6V7WY2C5D",
  "email": "ahmed.hassan@example.com",
  "role": "professional",
  "isVerifiedEmail": false,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Create a Job Posting

```
POST /api/v1/jobs
Authorization: Bearer <accessToken>
{
  "title": { "en": "Solar Panel Installer", "ar": "فني تركيب الألواح الشمسية" },
  "description": { "en": "We are looking for experienced solar panel installers...", "ar": "نبحث عن فنيين متمرسين في تركيب الألواح الشمسية..." },
  "industry": "Solar Energy",
  "city": "Abu Dhabi",
  "country": "UAE",
  "employmentType": "full_time",
  "salaryMin": 3000,
  "salaryMax": 5000,
  "salaryCurrency": "AED",
  "requiredSkills": ["Solar PV Installation", "Electrical Wiring", "Safety Compliance"],
  "expiresAt": "2024-03-15T00:00:00Z"
}
```

Response `201`:
```json
{
  "id": "01HZ5L0CQS9NOYQ4U7W8XZ3D6E",
  "status": "draft",
  "createdAt": "2024-01-15T10:35:00Z"
}
```

### Update Application Status

```
PATCH /api/v1/applications/01HZ4K9BQR8MNXP3T6V7WY2C5D/status
Authorization: Bearer <accessToken>
{
  "status": "shortlisted"
}
```

Response `200`:
```json
{
  "id": "01HZ4K9BQR8MNXP3T6V7WY2C5D",
  "status": "shortlisted",
  "updatedAt": "2024-01-15T11:00:00Z"
}
```

The professional receives a notification with type `application_shortlisted` immediately.
