# Autospace API

Transitional NestJS gateway and legacy API for the Autospace marketplace. It
currently exposes REST and GraphQL surfaces while capabilities are extracted
into independently deployable services behind a public gateway.

## Transitional responsibilities

- Authentication and role/permission enforcement
- Users, customers, providers, managers, valets, and admins
- Parking inventory, bookings, reviews, and operational timelines
- Stripe payment integration
- Transactional outbox for Kafka events

Do not add new business capabilities to this legacy boundary. New capabilities
belong in the owning microservice described in the
[service catalog](../../docs/SERVICE_CATALOG.md), with gRPC service invocation
and Kafka events where appropriate.

## Run

From the repository root:

```bash
docker compose --env-file .env.docker up --build api
```

Swagger is served at `http://localhost:3000`; GraphQL compatibility is at
`http://localhost:3000/graphql`; health is at `http://localhost:3000/health`.

## Migrations

```bash
docker compose --env-file .env.docker --profile tools run --rm migrate
```

TypeORM synchronization and automatic migration-on-startup are disabled. The
repository still contains legacy Prisma code during controlled migration; do
not add new Prisma models or generated modules.

See [Architecture](../../docs/ARCHITECTURE.md) and
[Development](../../docs/DEVELOPMENT.md).
