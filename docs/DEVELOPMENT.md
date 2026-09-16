# Development and operations

## Bootstrap

1. Install Git and Docker with Compose v2.
2. Copy `.env.docker.example` to `.env.docker`.
3. Replace local placeholder secrets when the environment is shared.
4. Validate configuration: `docker compose --env-file .env.docker config --quiet`.
5. Start services: `docker compose --env-file .env.docker up --build`.
6. Run migrations explicitly with the `migrate` tools profile.

The first build is large because it pulls Node, Go, PostGIS, Kafka, Redis, and
MinIO images. Later builds use BuildKit and dependency caches.

## Ports

| Port | Service |
|---:|---|
| 3000 | NestJS API and Swagger |
| 3001 | Driver/public web |
| 3002 | Provider/manager web |
| 3003 | Valet web |
| 3004 | Admin web |
| 5432 | PostgreSQL/PostGIS |
| 6379 | Redis |
| 8080 | Go search API |
| 8081 | Go availability service health endpoint |
| 9000 | MinIO S3 API |
| 9001 | MinIO console |
| 9092 | Kafka host listener |

Override host ports in `.env.docker` when they conflict. Inter-container calls
use service names and container ports, not `localhost`.

## Compose workflows

```bash
# Complete platform
docker compose --env-file .env.docker up --build

# Infrastructure only
docker compose --env-file .env.docker \
  -f compose.yaml -f compose.infrastructure.yaml up -d

# One service and its dependencies
docker compose --env-file .env.docker up --build api

# Migration status / run / rollback
docker compose --env-file .env.docker --profile tools run --rm migrate yarn workspace @autospace/api migration:show
docker compose --env-file .env.docker --profile tools run --rm migrate
docker compose --env-file .env.docker --profile tools run --rm migrate yarn workspace @autospace/api migration:revert

# Inspect
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs -f api
```

Do not use `docker compose down -v` in shared environments. It irreversibly
deletes the Compose-managed state volumes.

## Host development

Docker is preferred. If host tooling is needed, use Node 20, Corepack/Yarn
1.22, and Go 1.23 or newer.

```bash
corepack enable
corepack yarn install
corepack yarn workspace @autospace/api dev
corepack yarn workspace @autospace/web dev

cd apps/search-service
go test ./...
go run ./cmd/server
```

## Database migrations

- Never enable TypeORM `synchronize`.
- Make migrations forward-compatible with the currently deployed application.
- Separate destructive cleanup from the release that stops using old data.
- Backfill large tables in resumable batches, not one long lock-heavy migration.
- Test forward and rollback paths against an empty database and a production-like baseline.
- API replicas do not run migrations; deployment runs the one-shot migration job.

Current commands live in `apps/api/package.json`. The first TypeORM migration
creates PostGIS/pgcrypto extensions and the transactional outbox table.

## Testing expectations

Before opening a change:

```bash
corepack yarn format:check
corepack yarn tsc
corepack yarn lint
corepack yarn build

cd apps/search-service
go test ./...
```

Changes to booking, availability, money, permissions, or event handling also
need integration and concurrency tests. Migration changes need a real
PostgreSQL/PostGIS test, not an in-memory substitute.

## Health endpoints

- NestJS API: `GET /health`
- Next.js apps: `GET /api/health`
- Go search liveness: `GET /health/live`
- Go search readiness: `GET /health/ready`
- Go availability liveness/readiness: `GET /health/live`, `GET /health/ready`

Readiness will later include owned dependency checks; liveness must not fail
merely because a downstream service is temporarily unavailable.

## Service contracts

Protobuf sources live in `libs/contracts/proto`. Lint and generate Go/NestJS
clients through Docker so contributors do not need local protobuf tooling:

```bash
docker compose --profile tools run --rm contracts-lint
docker compose --profile tools run --rm contracts-generate
```

Generated clients must be regenerated whenever a source contract changes.
Breaking changes require a new package/topic major version and migration plan.

## Troubleshooting

### Docker API unavailable

Start Docker Desktop/Engine and wait until `docker info` succeeds.

### Port already allocated

Change the corresponding host port in `.env.docker`; do not change the
container port or inter-service URL.

### Yarn install times out

Retry with a longer timeout:

```bash
corepack yarn install --network-timeout 600000 --network-concurrency 1
```

Do not commit an incompletely updated `yarn.lock`.

### API cannot connect to PostgreSQL

Inside Compose, `DATABASE_URL` must use `postgres:5432`, not `localhost`.
Confirm the database health check and credentials match `.env.docker`.

### Kafka consumers do not receive events

Confirm `kafka-init` completed, the topic exists, consumer group lag is visible,
and the outbox row has been published. Do not manually mark outbox rows as
published to hide a relay failure.
