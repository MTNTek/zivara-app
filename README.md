# Zivara

Zivara is a production-grade workforce marketplace for the GCC region. It connects professionals seeking work with employers seeking talent across six Phase 1 industries: Construction, Solar Energy, Hospitality, Cleaning, Domestic Services, and Private Tutoring.

The platform serves three user roles — **Professional**, **Employer**, and **Administrator** — and is built around the core values of trust, fairness, transparency, reliability, respect, simplicity, compliance, and quality.

---

## Architecture Overview

```
Browser / Mobile
      │
   Nginx (SSL termination, rate limiting, routing)
      │
      ├── Next.js Web App  (apps/web)   — Port 3000
      └── NestJS REST API  (apps/api)   — Port 4000
                │
           PostgreSQL  (Drizzle ORM)    — Port 5432
```

This is a **monorepo** with two applications and one shared package:

| Path | Contents |
|---|---|
| `apps/api` | NestJS REST API — business logic, auth, database access |
| `apps/web` | Next.js frontend — SSR, App Router, Tailwind CSS, shadcn/ui |
| `packages/shared` | Shared TypeScript types, enums, and constants |

---

## Prerequisites

Before you begin, ensure you have the following installed:

| Tool | Minimum version | Install |
|---|---|---|
| Node.js | 20.x LTS | https://nodejs.org |
| npm | 10.x | Bundled with Node 20 |
| Docker Desktop | 24.x | https://www.docker.com/products/docker-desktop |
| Docker Compose | v2 (bundled with Docker Desktop) | — |
| Git | 2.x | https://git-scm.com |

> **Windows users:** Docker Desktop requires WSL 2. Enable it via `wsl --install` before installing Docker.

---

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-org/zivara.git
cd zivara
```

### 2. Copy the environment file

```bash
cp .env.example .env
```

Open `.env` and fill in the required values. At minimum, you need:

- `DATABASE_URL` — provided automatically if you use Docker Compose (see below)
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` — generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- `JWT_ACCESS_EXPIRY=15m` and `JWT_REFRESH_EXPIRY=30d`
- `NODE_ENV=development`
- `API_PORT=4000`
- `WEB_PORT=3000`
- `NEXT_PUBLIC_API_URL=http://localhost:4000`

SMTP and AWS values can be left blank during initial local development if you do not need email or file upload functionality.

### 3. Start the full stack with Docker Compose

```bash
docker compose up --build
```

This starts three services:

| Service | URL | Notes |
|---|---|---|
| PostgreSQL | `localhost:5432` | Database with persistent volume |
| NestJS API | http://localhost:4000 | REST API with hot reload |
| Next.js Web | http://localhost:3000 | Frontend with hot reload |

The API will fail fast at startup if any required environment variable is missing, printing a descriptive error listing the exact missing keys.

### 4. (Alternative) Run services individually without Docker

Install dependencies from the monorepo root:

```bash
npm install
```

Start the API in development mode:

```bash
npm run dev -w apps/api
```

Start the web app in development mode:

```bash
npm run dev -w apps/web
```

The PostgreSQL database still requires Docker (or a locally installed PostgreSQL 16 instance).

---

## Available Scripts

Run these from the **monorepo root**:

| Script | Description |
|---|---|
| `npm run dev` | Start all apps in development mode (watch) |
| `npm run build` | Build all apps and packages |
| `npm run test` | Run all test suites |
| `npm run lint` | Lint all apps and packages |

To target a specific workspace:

```bash
npm run test -w apps/api
npm run build -w packages/shared
```

---

## Project Structure

```
zivara/
├── apps/
│   ├── api/              # NestJS backend (Port 4000)
│   └── web/              # Next.js frontend (Port 3000)
├── packages/
│   └── shared/           # Shared TS types and enums
├── docs/                 # Extended documentation
├── docker-compose.yml    # Local development stack
├── .env.example          # Environment variable template
├── tsconfig.base.json    # Shared TypeScript config
└── package.json          # Workspace root
```

---

## Documentation

Full documentation is in the [`docs/`](./docs/) directory:

| File | Contents |
|---|---|
| [`docs/VISION.md`](./docs/VISION.md) | Mission, core values, and product philosophy |
| [`docs/PRODUCT.md`](./docs/PRODUCT.md) | User roles, industries, and key user journeys |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | System architecture, tech stack, module boundaries |
| [`docs/DATABASE.md`](./docs/DATABASE.md) | Full schema documentation and migration approach |
| [`docs/API.md`](./docs/API.md) | API conventions, auth scheme, error format, pagination |
| [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) | Docker setup, env management, AWS deployment |
| [`docs/CHANGELOG.md`](./docs/CHANGELOG.md) | Version history |

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, next-intl |
| Backend | NestJS 10, TypeScript, Passport, JWT |
| Database | PostgreSQL 16, Drizzle ORM |
| Infrastructure | Docker, AWS ECS Fargate, RDS, S3, SES, CloudFront |
| Testing | Jest, Supertest |

---

## Contributing

1. All changes must go through a pull request — no direct pushes to `main`.
2. All tests must pass before a PR can be merged (`npm run test`).
3. New features must include unit tests with ≥ 80% coverage on business-critical paths.
4. Update [`docs/CHANGELOG.md`](./docs/CHANGELOG.md) with every release.

---

## License

Proprietary — © Zivara. All rights reserved.
