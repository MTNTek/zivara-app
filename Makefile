# ─── Zivara — Developer Commands ─────────────────────────────────────────────
# Run from project root. Requires: Docker, Node 20+, npm 10+

.PHONY: up down reset migrate seed verify build test lint api web

# Start PostgreSQL (local dev — run API and web directly for faster iteration)
up:
	docker compose up postgres -d

# Stop all containers
down:
	docker compose down

# Full reset — delete database volume and restart
reset:
	docker compose down -v
	docker compose up postgres -d

# Apply all pending migrations
migrate:
	cd apps/api && npm run db:migrate

# Seed database with development data
seed:
	cd apps/api && npm run db:seed

# Verify database connection and table counts
verify:
	cd apps/api && npm run db:verify

# Build all packages
build:
	npm run build

# Run all tests
test:
	cd apps/api && npm test -- --no-coverage

# Run linting
lint:
	npm run lint

# Start API in dev mode (hot reload)
api:
	cd apps/api && npm run start:dev

# Start web in dev mode (hot reload)
web:
	cd apps/web && npm run dev

# Start full stack with Docker (slower — use 'make up + make api + make web' for iteration)
stack:
	docker compose up --build
