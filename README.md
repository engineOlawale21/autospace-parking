# Autospace

Autospace is a multi-sided parking marketplace for finding, reserving, and
operating parking inventory. Drivers can search and book parking; individual
hosts and commercial operators can publish and manage spaces; valets can
perform assigned operational tasks; and internal teams can administer users,
inventory, bookings, payments, payouts, content, support, and risk.

The project is being expanded from an existing parking/valet prototype into a
production marketplace. See [Current status](#current-status) before assuming
a planned capability is already implemented.

## Product surfaces

| Application | Audience | Local URL |
|---|---|---|
| `apps/web` | Drivers and public marketplace visitors | http://localhost:3001 |
| `apps/web-manager` | Hosts and commercial parking operators | http://localhost:3002 |
| `apps/web-valet` | Valets and on-site operating staff | http://localhost:3003 |
| `apps/web-admin` | Autospace operations and administrators | http://localhost:3004 |
| `apps/api` | Transitional NestJS gateway/legacy API | http://localhost:3000 |
| `apps/search-service` | Go geospatial search service | http://localhost:8080 |
| `apps/services/go/availability` | Go availability, quote, and hold service | http://localhost:8081 |

## Architecture at a glance

```text
Driver / Provider / Admin / Valet Next.js applications
                         |
                         v
                    API gateway
                         |
            synchronous service invocation
                         |
 Identity (Nest) | Marketplace (Nest) | Availability (Go) | Booking (Go) | Payments (Nest)
      |          |              |             |         |
      +----------+---- service-owned data ----+---------+
                         |
              transactional outboxes
                         |
                       Kafka ----------> Go search projection/API

Listing media ----------------------------------------> S3-compatible storage
Payments and provider payouts ------------------------> Stripe
```

- Independently deployable Go and NestJS services own their business rules and data.
- Synchronous service-to-service invocation handles immediate workflows.
- Each service owns its PostgreSQL schema/database and TypeORM migrations.
- Kafka carries committed domain events through a transactional outbox.
- Redis contains disposable short-lived state such as holds and caches.
- Go owns the high-throughput search read model, not booking confirmation.
- Every deployable process and local dependency is containerized.

Read [Architecture](docs/ARCHITECTURE.md) for service boundaries and data-flow
rules, and [Rebuild plan](docs/REBUILD_PLAN.md) for the complete product scope.

## Quick start

### Requirements

- Git
- Docker Desktop or Docker Engine with Compose v2
- Enough disk space for the Node, Go, PostGIS, Kafka, Redis, and MinIO images

Node, Go, PostgreSQL, Kafka, and Redis do not need to be installed locally.

### Start the platform

```bash
git clone https://github.com/karthickthankyou/autospace-workshop.git
cd autospace-workshop
cp .env.docker.example .env.docker
docker compose --env-file .env.docker up --build
```

On PowerShell, replace the copy command with:

```powershell
Copy-Item .env.docker.example .env.docker
```

Change the placeholder secrets in `.env.docker` before sharing an environment.
Then inspect health and logs:

```bash
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs -f
```

### Run database migrations

Migrations are explicit one-shot jobs; API replicas never migrate on startup.

```bash
docker compose --env-file .env.docker --profile tools run --rm migrate
```

### Start infrastructure only

Use this when running an application from the host:

```bash
docker compose --env-file .env.docker \
  -f compose.yaml -f compose.infrastructure.yaml up -d
```

### Stop the platform

```bash
docker compose --env-file .env.docker down
```

This retains named volumes. Never add `-v` unless deleting local database,
Kafka, Redis, and object-storage data is intentional.

## Common commands

| Command | Purpose |
|---|---|
| `corepack yarn install` | Install workspace dependencies when working outside Docker |
| `corepack yarn docker:up` | Build and start the complete stack |
| `corepack yarn docker:infra` | Start only infrastructure dependencies |
| `corepack yarn docker:ps` | Show container health |
| `corepack yarn docker:logs` | Follow service logs |
| `corepack yarn tsc` | Type-check all TypeScript workspaces |
| `corepack yarn lint` | Lint all workspaces |
| `corepack yarn build` | Build all workspaces |
| `go test ./...` in `apps/search-service` | Test the Go service |

More workflows and troubleshooting are in
[Development guide](docs/DEVELOPMENT.md).

## Repository layout

```text
apps/
  api/                 Transitional gateway/legacy API during decomposition
  gateway/             Target public API gateway/BFF
  services/
    nest/              Gateway, identity, marketplace, payment, content, support
    go/                Search, availability/pricing, booking orchestration
  search-service/      First Go service scaffold; moves under services/go
  web/                 Public marketplace and driver account
  web-manager/         Provider/operator portal
  web-valet/           Valet operations
  web-admin/           Internal operations console
libs/
  contracts/           Protobuf contracts and generated Go/TypeScript clients
  3d/                  Existing reusable 3D components
  forms/               Shared forms and validation adapters
  network/             GraphQL client and generated legacy contracts
  ui/                  Shared design system and composed UI
  util/                Shared TypeScript utilities
docs/                  Product, architecture, and engineering documentation
compose.yaml           Complete local platform
Dockerfile             Shared multi-stage Node application image
```

## Current status

Implemented foundation:

- Existing driver, manager, valet, and admin prototype flows
- NestJS REST/GraphQL API with the legacy model
- PostgreSQL, Kafka, Redis, MinIO, and application Compose topology
- Container health endpoints and initial Go search-service skeleton
- Versioned gRPC contracts for availability, booking, and payment services
- Go availability-service lifecycle and hold state machine
- TypeORM configuration and first transitional outbox migration
- Initial redesigned marketplace homepage

In progress:

- Decomposing the legacy API into independently deployable Go and NestJS services
- Moving persistence into service-owned TypeORM repositories
- Kafka outbox relay and search projection
- New listing, availability, quote, booking, finance, and admin domains
- Full marketplace search, checkout, provider, CMS, and finance experiences

The existing Prisma code is temporary migration input. Do not create new
Prisma models, migrations, or generated modules. New persistence work uses
TypeORM and reviewed migrations.

The Go search endpoint currently reports `501 Not Implemented`; health and
container lifecycle are implemented, while the PostGIS projection is the next
service milestone.

## Documentation

- [Documentation index](docs/README.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Service catalog](docs/SERVICE_CATALOG.md)
- [Development and operations](docs/DEVELOPMENT.md)
- [CI/CD and releases](docs/CI_CD.md)
- [Configuration reference](docs/CONFIGURATION.md)
- [Kafka event conventions](docs/EVENTS.md)
- [Implementation roadmap](docs/IMPLEMENTATION_ROADMAP.md)
- [Milestone delivery status](docs/MILESTONE_STATUS.md)
- [Product rebuild plan](docs/REBUILD_PLAN.md)
- [Frontend and admin feature plan](docs/FRONTEND_ADMIN_PLAN.md)
- [Contributing](CONTRIBUTING.md)
- [Security policy](SECURITY.md)

## License

This repository is private and no distribution license has been granted. Add a
`LICENSE` file and update package metadata before publishing or distributing
the project.
