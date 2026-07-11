# Zivara — Deployment

## Overview

Zivara runs in Docker containers locally and on AWS ECS Fargate in production. The local development environment mirrors production as closely as possible to eliminate "works on my machine" failures. The only meaningful differences are that Nginx handles SSL/routing locally instead of an ALB, and email is routed to a local SMTP capture tool instead of SES.

---

## Local Development

### Prerequisites

- **Docker Desktop** 4.x or newer (includes Docker Compose v2)
- **Node.js** 20 LTS
- **pnpm** 8.x (`npm install -g pnpm`)
- A terminal and a `.env` file copied from `.env.example`

### First-Time Setup

```bash
# 1. Clone the repository
git clone https://github.com/zivara/zivara_app.git
cd zivara_app

# 2. Copy environment variable template
cp .env.example .env

# 3. Fill in required values in .env
#    DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET are the minimum required.
#    See the Environment Variables section below for the full list.

# 4. Start all services
docker compose up --build
```

After a successful start, the following are available:
- **Web app**: http://localhost:3000
- **API**: http://localhost:4000
- **API health check**: http://localhost:4000/health
- **PostgreSQL**: localhost:5432 (accessible from host for database clients)

### Service Architecture (Local)

```
docker-compose.yml
├── postgres         # PostgreSQL 16-alpine, port 5432
│                    # Named volume: postgres_data
│                    # Health check: pg_isready -U postgres
│
├── api              # NestJS backend, port 4000
│   build: apps/api  # Depends on postgres (healthy)
│   env_file: .env
│
└── web              # Next.js frontend, port 3000
    build: apps/web  # Depends on api
    NEXT_PUBLIC_API_URL=http://api:4000
```

The `api` service waits for the `postgres` health check to pass before starting, preventing connection failures on cold start. The `web` service depends on `api` being up before it attempts API calls.

### Stopping and Resetting

```bash
# Stop all services (preserves database volume)
docker compose down

# Stop and delete all data (full reset)
docker compose down -v

# Rebuild a single service after code changes
docker compose up --build api
```

### Running Without Docker (for faster iteration)

For tight development loops, you can run the API and web app directly on the host with a Dockerized PostgreSQL instance only:

```bash
# Start only the database
docker compose up postgres -d

# Install dependencies
pnpm install

# Run the API (watches for TypeScript changes)
pnpm --filter @zivara/api dev

# Run the web app (in a separate terminal)
pnpm --filter @zivara/web dev
```

### Database Migrations (Local)

Migrations run automatically on API startup in development. To run them manually or generate new ones:

```bash
# Generate a migration after schema changes
pnpm --filter @zivara/api db:generate

# Apply pending migrations
pnpm --filter @zivara/api db:migrate

# View current schema state
pnpm --filter @zivara/api db:studio
```

---

## Environment Variables

All required environment variables are listed in `.env.example`. The API validates all variables at startup using a Zod schema — the process exits immediately with a descriptive error listing every missing or invalid variable.

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/zivara` |
| `JWT_ACCESS_SECRET` | Secret key for signing JWT access tokens | 64-char random hex string |
| `JWT_REFRESH_SECRET` | Secret key for signing refresh token JWTs (if JWT-based) | 64-char random hex string |
| `JWT_ACCESS_EXPIRY` | Access token lifetime | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token lifetime | `30d` |
| `SMTP_HOST` | SMTP server hostname | `smtp.ses.us-east-1.amazonaws.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username / SES access key | `AKIAIOSFODNN7EXAMPLE` |
| `SMTP_PASS` | SMTP password / SES secret key | `wJalrXUtnFEMI/K7MDENG...` |
| `AWS_S3_BUCKET` | S3 bucket name for document storage | `zivara-documents-prod` |
| `AWS_REGION` | AWS region | `me-south-1` |
| `NODE_ENV` | Runtime environment | `development` \| `production` |
| `API_PORT` | Port the API listens on | `4000` |
| `WEB_PORT` | Port the web app listens on | `3000` |
| `NEXT_PUBLIC_API_URL` | API base URL accessible from the browser | `https://api.zivara.com` |

### Secrets Management

**Local development:** Variables live in `.env` which is git-ignored. Never commit `.env` with real values.

**Production:** All secrets are injected as environment variables via AWS ECS Task Definition environment variables, sourced from AWS Secrets Manager. No secrets are baked into Docker images or stored in the repository.

The rule is simple: if a value changes between environments (dev/staging/prod) or is sensitive, it is an environment variable. No exceptions.

---

## Docker Images

### API Dockerfile (`apps/api/Dockerfile`)

Multi-stage build:

```
Stage 1 — builder
  FROM node:20-alpine
  Install pnpm
  Copy package files and install all dependencies
  Copy source
  Run tsc to compile TypeScript → dist/

Stage 2 — runner
  FROM node:20-alpine
  Set NODE_ENV=production
  Copy dist/ from builder
  Copy node_modules/ from builder (production only)
  EXPOSE 4000
  CMD ["node", "dist/main"]
```

The production image contains only compiled JavaScript and production dependencies. TypeScript compiler, test utilities, and dev dependencies are excluded.

### Web Dockerfile (`apps/web/Dockerfile`)

Multi-stage build:

```
Stage 1 — builder
  FROM node:20-alpine
  Install pnpm
  Copy package files and install all dependencies
  Copy source
  Run next build (output: standalone)

Stage 2 — runner
  FROM node:20-alpine
  Set NODE_ENV=production
  Copy .next/standalone from builder
  Copy .next/static from builder
  Copy public/ from builder
  EXPOSE 3000
  CMD ["node", "server.js"]
```

Next.js standalone output includes a minimal Node.js server and only the required files, producing a small production image.

---

## AWS Deployment

### Infrastructure Overview

```
AWS (Region: me-south-1 — Bahrain, primary; us-east-1 — secondary)
│
├── VPC
│   ├── Public Subnets (2 AZs)
│   │   └── Application Load Balancer (ALB)
│   │       ├── Listener: HTTPS 443 → Target Group: web-tg
│   │       └── Listener: HTTPS 443 /api/* → Target Group: api-tg
│   │
│   └── Private Subnets (2 AZs)
│       ├── ECS Fargate — API Service
│       │   └── Task: zivara-api (512 CPU, 1024 MB memory)
│       ├── ECS Fargate — Web Service
│       │   └── Task: zivara-web (256 CPU, 512 MB memory)
│       └── RDS PostgreSQL 16 (Multi-AZ)
│
├── S3 Bucket: zivara-documents-prod (private)
│   └── Lifecycle: move to Glacier after 365 days
│
├── CloudFront Distribution
│   └── Origin: S3 static assets + ALB
│
├── SES (Transactional email)
│   └── Verified domain: mail.zivara.com
│
├── ECR (Container registry)
│   ├── zivara/api
│   └── zivara/web
│
└── Secrets Manager
    ├── /zivara/prod/database-url
    ├── /zivara/prod/jwt-access-secret
    ├── /zivara/prod/jwt-refresh-secret
    └── /zivara/prod/smtp-credentials
```

### Deployment Flow

Production deployments follow this sequence:

```
1. Developer merges to main
2. GitHub Actions CI pipeline runs:
   a. Lint and type-check all workspaces
   b. Run all unit tests (≥ 80% coverage required)
   c. Run E2E tests against a test database
   d. Build Docker images for api and web
   e. Push images to ECR with tags: git-sha + latest
3. Deployment stage:
   a. Run database migrations (pre-deployment)
      docker run --env-file ... zivara/api node dist/database/migrate
   b. Update ECS task definition with new image tag
   c. ECS rolling deployment:
      - New tasks start and pass health checks (/health returns 200)
      - Old tasks drain connections and stop
      - Zero downtime maintained throughout
4. Post-deployment:
   a. Smoke test: GET /health, GET /api/v1/jobs (expect 200)
   b. Alert on any 5xx spike in the 5 minutes following deployment
```

### Auto-Scaling

ECS services are configured with Application Auto Scaling:

| Service | Min Tasks | Max Tasks | Scale-Out Trigger | Scale-In Trigger |
|---------|-----------|-----------|-------------------|------------------|
| api | 2 | 10 | CPU > 70% for 2 min | CPU < 30% for 5 min |
| web | 2 | 8 | CPU > 60% for 2 min | CPU < 20% for 5 min |

Minimum 2 tasks per service ensures availability during a single AZ failure or rolling deployment.

### Zero-Downtime Deployments

ECS rolling deployments replace tasks gradually. The ALB health check polls `GET /health` every 10 seconds. A new task is only added to the target group after two consecutive successful health checks (20 seconds minimum). Old tasks are deregistered and given 30 seconds to drain active connections before termination.

### Database Migrations in Production

Migrations run as a one-off ECS task before the new application version starts:

```bash
aws ecs run-task \
  --cluster zivara-prod \
  --task-definition zivara-api-migrate \
  --overrides '{"containerOverrides":[{"name":"api","command":["node","dist/database/migrate"]}]}'
```

If the migration fails, the deployment is halted and the existing application version continues running. Migrations are forward-only. If a breaking migration is required (e.g., DROP COLUMN), it is split into phases: first deploy the code that no longer uses the column, then drop the column in a subsequent migration.

### Monitoring and Logging

- **CloudWatch Logs**: all ECS task stdout/stderr
- **CloudWatch Metrics**: ECS CPU/memory, ALB request count, 5xx rate, target response time
- **CloudWatch Alarms**: alert on 5xx rate > 1%, p95 response time > 500ms, ECS task failures
- **Structured logging**: every API request logged with requestId, userId (if authenticated), method, path, statusCode, and response time in milliseconds

---

## Staging Environment

A staging environment mirrors production but runs on smaller instances (256 CPU, 512 MB for API; 128 CPU, 256 MB for web) and uses a separate RDS instance. Every PR is deployed to staging automatically. Staging uses real email delivery via SES with a separate verified domain (`staging-mail.zivara.com`) to catch email formatting issues before production.

---

## Rollback

If a deployment causes a p95 response time spike or elevated error rate:

1. CloudWatch alarm fires within 2 minutes of the degradation
2. On-call engineer triggers a rollback by updating the ECS task definition to the previous image tag
3. ECS performs a rolling deployment of the previous version — same zero-downtime process in reverse
4. Estimated rollback time: 3–5 minutes from trigger to completion

Database migrations cannot be automatically rolled back. If the current code version requires a schema incompatible with the previous code version, a forward-fix migration is the only path. This is why each migration is reviewed carefully before merge and destructive operations are phased.
