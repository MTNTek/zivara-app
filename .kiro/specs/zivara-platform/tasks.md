# Implementation Plan: Zivara Platform — Sprint 2 (Professional Module)

## Overview

Sprint 2 builds the Professional Module end-to-end: backend API (profile CRUD, experience, skills, documents, verification, completeness), frontend profile pages, and tests. The module follows the same vertical-slice pattern established in Sprint 1. No feature is complete until backend, frontend, and tests are all done.

## Tasks

- [x] 1. Initialize monorepo root and workspace configuration
- [x] 2. Create documentation structure
- [x] 3. Initialize shared package (`packages/shared`)
- [x] 4. Initialize NestJS backend (`apps/api`)
- [x] 5. Set up Drizzle ORM database module and complete schema
- [x] 6. Initialize Next.js frontend (`apps/web`)
- [x] 7. Create Docker Compose for local development
- [x] 8. Create API health check endpoint and finalize module wiring
- [x] 9. Complete local PostgreSQL development environment
- [x] 10. Complete backend authentication module
- [x] 11. Write authentication tests
- [x] 12. Build frontend authentication pages

- [ ] 13. Build professionals backend module
  - Create `apps/api/src/professionals/professionals.module.ts` and register it in `app.module.ts`
  - Create `apps/api/src/professionals/professionals.repository.ts` with all DB queries: findById, findByUserId, updateProfile, addExperience, updateExperience, deleteExperience, addSkill, deleteSkill, listSkills, computeAndSaveCompleteness
  - Create `apps/api/src/professionals/professionals.service.ts` with: getMyProfile, updateMyProfile, getPublicProfile (omit nationality if show_nationality=false), setProfileVisibility, addExperience, updateExperience, deleteExperience, addSkill, deleteSkill, computeCompleteness (0–100 score based on filled fields)
  - Create `apps/api/src/professionals/professionals.controller.ts` with routes: GET /professionals/me, PATCH /professionals/me, PATCH /professionals/me/visibility, GET /professionals/:id (public), POST /professionals/me/experience, PATCH /professionals/me/experience/:id, DELETE /professionals/me/experience/:id, POST /professionals/me/skills, DELETE /professionals/me/skills/:id
  - Create DTOs in `apps/api/src/professionals/dto/`: UpdateProfileDto, AddExperienceDto, UpdateExperienceDto, AddSkillDto — all with class-validator decorators
  - Completeness score formula: full_name(15) + phone(10) + bio(10) + profile_photo_url(10) + primary_industry(10) + current_city+current_country(10) + at least 1 skill(15) + at least 1 experience(15) + nationality visibility set(5) = 100
  - Completeness is recomputed and saved to `profile_completeness` column on every profile/skill/experience update
  - All routes require `professional` role via `@Roles(UserRole.Professional)` + `JwtAuthGuard`
  - Public profile endpoint (`GET /professionals/:id`) is marked `@Public()` but respects `is_profile_public` flag — returns 404 if profile is private
  - Profile responses NEVER include `government_id_hash` or `password_hash`
  - Run `npm run build` — must exit 0
  - **Requirements:** 4.1, 4.2, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9

- [ ] 14. Write professional module tests
  - Create `apps/api/src/professionals/professionals.service.spec.ts` with unit tests covering: getMyProfile returns full profile, getPublicProfile omits nationality when show_nationality=false, getPublicProfile returns 404 when profile is private, updateMyProfile updates fields and recomputes completeness, addExperience creates experience row, deleteExperience rejects if not owned by professional, addSkill creates skill, computeCompleteness returns correct score for partial and complete profiles
  - All tests must pass with `npm test`
  - **Requirements:** 4.1–4.9, 15.10

- [ ] 15. Build professional profile frontend pages
  - Create `apps/web/src/app/(professional)/profile/page.tsx` — displays the authenticated professional's full profile with completeness bar, edit button, all experience and skills listed, verification badge if verified
  - Create `apps/web/src/app/(professional)/profile/edit/page.tsx` — edit form for: full name, phone, bio, primary industry (select), current city, current country, nationality (optional), show_nationality toggle; calls PATCH /professionals/me; redirects back to profile on success
  - Create `apps/web/src/app/(professional)/profile/experience/new/page.tsx` — add experience form: job title, company name, industry, start date, end date (optional, "current role" checkbox), description; calls POST /professionals/me/experience
  - Create `apps/web/src/app/(public)/professionals/[id]/page.tsx` — public professional profile: shows name, bio, industry, city/country, skills, experience, average rating, verified badge; respects is_profile_public (shows 404 message if private); does NOT show nationality unless professional chose to show it
  - All pages: accessible, EN/AR messages in messages files, no TypeScript errors
  - Run `npx tsc --noEmit` in `apps/web` — must exit 0
  - **Requirements:** 4.1–4.9, 14.1, 15.6

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"] },
    { "wave": 2, "tasks": ["13"] },
    { "wave": 3, "tasks": ["14", "15"] }
  ],
  "dependencies": {
    "1": [], "2": ["1"], "3": ["1"], "4": ["1", "3"],
    "5": ["4"], "6": ["1", "3"], "7": ["4", "6"], "8": ["4", "5"],
    "9": ["5", "7"], "10": ["4", "5", "8"], "11": ["10"], "12": ["6", "10"],
    "13": ["10", "11"],
    "14": ["13"],
    "15": ["13", "12"]
  }
}
```

## Notes

- Tasks 14 and 15 can run in parallel once Task 13 is complete.
- The public profile (`GET /professionals/:id`) must respect the `is_profile_public` flag.
- Country of origin is stored but NEVER used as a search/filter criterion.
- `government_id_hash` is NEVER returned in any API response.
- Completeness recomputes on every mutation — it is cached, not live-computed.
