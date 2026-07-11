# Zivara — Product

## Phase 1 Industries

Zivara launches with six industries. Each was selected based on hiring volume in the GCC, underserved professional populations, and the opportunity for a trusted marketplace to improve outcomes for both sides.

| Industry | Typical Roles | Common Hiring Pattern |
|----------|--------------|----------------------|
| Construction | Site worker, foreman, safety officer, scaffolder, mason, electrician, plumber | Project-based, high volume, frequent contractor churn |
| Solar Energy | Installation technician, electrician, project coordinator, site supervisor | Project-based, growing rapidly in GCC |
| Hospitality | Hotel receptionist, housekeeping staff, F&B server, events coordinator, chef | Seasonal peaks, shift-based, high turnover |
| Cleaning | Commercial cleaner, residential cleaner, supervisor, facility coordinator | Recurring shifts, contract-based |
| Domestic Services | Housekeeper, cook, driver, childcare worker, nanny | Long-term placements, trust-sensitive |
| Private Tutoring | Academic tutor, language instructor, test prep specialist, music/arts teacher | Part-time, flexible, skills-driven |

---

## User Roles

### Professional

A Professional is an individual registered on Zivara seeking employment or shift-based work.

**What they need from the platform:**
- A profile that credibly represents their skills and experience
- Visibility to employers who are looking for someone like them
- Honest feedback on where their applications stand
- Confidence that they will be paid fairly and on time for shifts completed
- A verified badge that means something in the market

**Key capabilities:**
- Create and manage a professional profile with work history, skills, documents, and photo
- Control profile visibility (public or private)
- Browse and search job postings by industry, location, employment type, salary, and skills
- Apply for jobs in three steps or fewer
- Track application status across all active and historical applications
- View and confirm assigned shifts
- Receive and submit ratings after shift completion
- Manage notification preferences
- Set language preference (English or Arabic)

---

### Employer

An Employer is a company or individual registered on Zivara to post jobs and hire professionals.

**What they need from the platform:**
- Confidence that professionals they contact are who they claim to be
- A fast path from "I need someone" to "I have someone"
- A clean view of their hiring pipeline without complexity
- Transparent costs and payments

**Key capabilities:**
- Create and manage a company profile with trade license, description, and logo
- Post, manage, and track job postings
- Search and browse professional profiles by industry, skills, location, availability, and verification status
- Review and manage applications with status transitions (Received → Under Review → Shortlisted → Rejected → Hired)
- Manage team members under the company account (Owner, Manager, Recruiter)
- Schedule and manage shifts for hired professionals
- Rate professionals after shift completion
- View billing: platform fees, payments to professionals, pending amounts
- Receive a Verified Employer badge upon trade license approval and in-good-standing status

---

### Administrator

An Administrator is a Zivara staff member with full platform visibility and moderation capabilities.

**What they need from the platform:**
- A clear dashboard showing the current state of the platform
- Efficient workflows for verification, dispute resolution, and moderation
- A complete, immutable audit trail of every action they take

**Key capabilities:**
- Dashboard: total users by role, new registrations today, active job postings, open disputes, pending verifications, flagged content
- Review and approve or reject professional verification requests
- Review and approve, reject, or suspend employer trade license submissions
- Suspend any user account (immediately terminates all active sessions)
- Moderate flagged ratings: approve publication, remove rating, or request revision
- Review and resolve shift disputes with full context (shift details, both parties' accounts, submitted evidence)
- Notify both parties of dispute outcomes
- View platform analytics: job posting trends by industry, application volume, verification turnaround, user growth
- Every action is logged with administrator ID, timestamp, and a mandatory reason field

---

## Key User Journeys

### Professional: Getting Hired

1. Professional registers with email, phone, nationality, current location, and primary industry
2. Email verification is required before account activation
3. Professional completes their profile: work experience, skills, certifications, languages, photo
4. Profile completeness indicator shows progress toward 100%
5. Professional uploads verification documents (ID, certifications) — these enter a pending review queue
6. Administrator reviews and approves documents; "Verified" badge appears on profile
7. Professional searches for jobs by industry, location, employment type, salary range, skills
8. Professional views job details and applies in three steps or fewer
9. Professional receives confirmation notification immediately upon application submission
10. Professional monitors application status in their dashboard (Received → Under Review → Shortlisted → Hired)
11. If shortlisted, professional receives a notification that accurately reflects the actual status change
12. Once hired, employer creates and assigns a shift
13. Professional receives shift notification with full details (date, time, location, role)
14. Professional confirms shift attendance
15. After shift completion, both parties confirm completion
16. Professional receives payment within 24 hours of confirmed completion
17. Professional submits rating for employer; employer submits rating for professional

---

### Professional: Managing Applications

1. Professional views their Applications dashboard: each application shows job title, employer name, current status, and date applied
2. If an employer has not reviewed within 14 days, a reminder is sent to the employer — professional is not burdened by the delay
3. If professional decides to withdraw an application, they withdraw with one action; employer is notified; application is removed from employer's active pipeline
4. If rejected, professional receives a respectful notification; reason is included only if employer provided one
5. System prevents duplicate applications to the same active job posting

---

### Employer: Posting a Job and Hiring

1. Employer registers: company name, trade license number, industry, contact details, operating country
2. Trade license submitted for admin review
3. Administrator approves trade license; Verified Employer badge appears on company profile
4. Employer creates a job posting: title, industry, location, employment type, description, required skills, optional salary range, optional expiry date
5. If no expiry date is set, job auto-expires after 60 days
6. Job becomes publicly visible to professionals within 2 minutes of posting
7. Applications arrive in employer's dashboard; employer sees total applications, shortlisted count, pending actions
8. Employer reviews applications and progresses statuses
9. Employer shortlists promising candidates; each shortlisted professional receives an accurate notification
10. Employer moves selected candidate to Hired status
11. Employer creates a shift for the hired professional
12. Professional confirms shift; employer is notified
13. Shift completed; employer confirms completion
14. Payment is initiated within 24 hours
15. Employer rates the professional; professional rates the employer
16. Employer can view job posting performance: total views, total applications, shortlisted count, hired count

---

### Employer: Managing a Team Account

1. Employer Owner creates the company account
2. Owner invites team members (HR managers, recruiters) to the company account
3. Each team member is assigned a role: Owner, Manager, or Recruiter
4. Managers can post and manage jobs, review applications, and manage shifts
5. Recruiters can review applications and communicate with candidates
6. Only the Owner can perform sensitive operations such as deleting job postings or removing members
7. All team member actions are scoped to the employer account — a recruiter cannot see or affect another company's data

---

### Administrator: Verifying a Professional

1. Administrator sees pending verification requests on the dashboard
2. Administrator opens a verification request and reviews uploaded documents
3. Administrator can approve, reject, or request additional documents
4. On approval, professional's "Verified" badge becomes visible on their profile
5. On rejection or request for more documents, professional is notified with the outcome
6. Every decision is logged with the administrator's ID, timestamp, and a reason

---

### Administrator: Resolving a Dispute

1. Shift dispute is raised by either party after shift completion
2. Administrator sees the dispute in their open disputes queue
3. Administrator views full context: shift date, time, location, both parties' profiles, submitted evidence
4. Administrator makes a decision and records the outcome and reason
5. Both parties receive a notification of the outcome
6. If dispute involved payment, payment is released or held based on administrator's decision
7. Action is logged in full in the audit trail

---

## Product Principles

### Privacy by design
Professionals control the visibility of sensitive information. Nationality and country of origin are never displayed to employers by default — the professional opts in explicitly if they choose to share it. Profile visibility can be set to private, removing the professional from all employer search results entirely.

### Notifications that tell the truth
A notification reflects exactly what happened. A "Shortlisted" notification is sent only when a candidate was actually shortlisted by an employer — not as an engagement tactic or approximation. Bulk employer actions that would trigger many notifications in quick succession are batched into a summary to prevent notification fatigue.

### Search that is fair
Nationality and country of origin are not visible sort or filter criteria in the standard employer search interface. AI-assisted ranking runs transparently in the background and is logged for explainability. Administrators can review why any result was ranked as it was.

### Verification that means something
A "Verified Professional" badge requires a human administrator to have reviewed the professional's documents. A "Verified Employer" badge requires a human administrator to have approved the trade license. Badges are removed automatically if the account is suspended or a compliance flag is raised. There is no self-verification.

### Payments that professionals can rely on
Payment is initiated automatically within 24 hours of confirmed shift completion. Both parties are notified of every payment event — initiation, completion, or failure. A professional should never have to chase payment through the platform.

### Compliance built in, not bolted on
Country of origin is informational only. Any employer configuration that restricts candidates by origin requires documented justification, administrator review, and a full audit trail before taking effect. Admin actions carry mandatory reason fields. The audit log is append-only.
