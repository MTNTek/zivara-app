# Zivara — Workforce Marketplace

The most trusted workforce marketplace in the GCC. Built for professionals seeking work and employers seeking talent in Construction, Solar Energy, Hospitality, Cleaning, Domestic Services, and Private Tutoring.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | NestJS 10, TypeScript |
| Database | PostgreSQL 16, Drizzle ORM |
| Auth | JWT (15 min) + rotating refresh tokens, RBAC |
| Infrastructure | Docker, Nginx, AWS ECS Fargate + RDS |
| Mobile | Flutter (Phase 2) |

---

## Prerequisites

- **Node.js** 20 LTS
- **npm** 10+
- **Docker Desktop** 4.x (for local PostgreSQL)

---

## Local Development Setup

### First time

```bash
# 1. Clone the repository
git clone https://github.com/MTNTek/zivara-app.git
cd zivara-app

# 2. Install all dependencies
npm install

# 3. Copy environment file
cp .env.example .env
# .env already has working development defaults — no changes needed for local dev

# 4. Start PostgreSQL
make up
# or: docker compose up postgres -d

# 5. Apply database migrations
make migrate
# or: cd apps/api && npm run db:migrate

# 6. Seed development data
make seed
# or: cd apps/api && npm run db:seed

# 7. Start the API (terminal 1)
make api
# or: cd apps/api && npm run start:dev

# 8. Start the web app (terminal 2)
make web
# or: cd apps/web && npm run dev
```

After setup:
- **Web app**: http://localhost:3000
- **API**: http://localhost:4000
- **Health check**: http://localhost:4000/health

### Development login credentials

All accounts use password: **`Zivara2024!`**

| Role | Email |
|------|-------|
| Admin | admin@zivara.com |
| Employer (Construction) | hr@alfardan-construction.com |
| Employer (Solar) | careers@solarvision-gulf.com |
| Employer (Hospitality) | talent@royalpalm-hospitality.com |
| Employer (Cleaning) | jobs@cleanpro-services.com |
| Employer (Domestic) | hire@homewise-domestic.com |
| Professional | mohammed.rashidi@example.com |
| Professional | priya.sharma@example.com |

---

## Available Commands

```bash
make up        # Start PostgreSQL in Docker
make down      # Stop all containers
make reset     # Delete database and restart fresh
make migrate   # Apply pending migrations
make seed      # Populate with development data
make verify    # Check database health and row counts
make api       # Start API in dev mode (hot reload)
make web       # Start web app in dev mode (hot reload)
make build     # Build all packages
make test      # Run all unit tests
make lint      # Run linting
make stack     # Start full stack in Docker (slower)
```

---

## Project Structure

```
zivara-app/
├── apps/
│   ├── api/          # NestJS backend (port 4000)
│   └── web/          # Next.js frontend (port 3000)
├── packages/
│   └── shared/       # Shared TypeScript types and enums
├── docs/             # Architecture, API, deployment docs
├── nginx/            # Nginx configuration
├── .github/
│   └── workflows/    # CI/CD pipelines
└── docker-compose.yml
```

---

## Business Modules

| Module | API Routes | Status |
|--------|-----------|--------|
| Authentication | `/auth/*` | ✅ |
| Professionals | `/professionals/*` | ✅ |
| Employers | `/employers/*` | ✅ |
| Jobs | `/jobs/*` | ✅ |
| Applications | `/applications/*` | ✅ |
| Notifications | `/notifications/*` | ✅ |
| Shifts | `/shifts/*` | ✅ |
| Ratings | `/ratings/*` | ✅ |
| Admin | `/admin/*` | ✅ |

---

## Running Tests

```bash
# Unit tests
cd apps/api && npm test

# E2E tests (requires running PostgreSQL)
cd apps/api && npm run test:e2e
```

---

## Documentation

| Document | Location |
|----------|----------|
| Vision & Mission | `docs/VISION.md` |
| Product Guide | `docs/PRODUCT.md` |
| Architecture | `docs/ARCHITECTURE.md` |
| Database Schema | `docs/DATABASE.md` |
| API Reference | `docs/API.md` |
| Deployment Guide | `docs/DEPLOYMENT.md` |
| Changelog | `docs/CHANGELOG.md` |

---

## CI/CD

Every pull request runs:
1. TypeScript type-check
2. Unit tests (57+ tests)
3. API build
4. Database migrations against test DB
5. E2E tests
6. Docker image build

Merges to `main` trigger automatic deployment to AWS ECS Fargate (requires AWS secrets configured in GitHub repo settings).

---

## License

Proprietary — © 2025 Zivara. All rights reserved.
