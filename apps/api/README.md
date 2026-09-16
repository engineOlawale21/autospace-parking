# Autospace API

NestJS API gateway/BFF for the Autospace marketplace. It exposes public HTTP
routes and invokes independently deployable domain services through versioned
gRPC contracts.

## Responsibilities

- Authentication and role/permission enforcement
- HTTP authentication and request validation
- Request composition across internal services
- Correlation metadata and consistent public errors
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

Health is served at `http://localhost:3000/health`.

## Migrations

```bash
docker compose --env-file .env.docker --profile tools run --rm migrate
```

TypeORM synchronization and automatic migration-on-startup are disabled.
Prisma is not part of this service.

See [Architecture](../../docs/ARCHITECTURE.md) and
[Development](../../docs/DEVELOPMENT.md).
