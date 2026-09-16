# Architecture

## Principles

1. PostgreSQL is authoritative for business state.
2. Each microservice owns its transactional commands, invariants, and data.
3. Search is eventually consistent; booking confirmation is strongly consistent.
4. Kafka only carries facts committed through the transactional outbox.
5. Redis state must be disposable or reconstructable.
6. Services communicate through versioned invocation/event contracts, never shared database writes.
7. Admin control and auditability ship with each customer/provider capability.
8. Schema changes are explicit, reviewed migrations—never runtime synchronization.

## Runtime components

### Polyglot Go and NestJS microservices

The gateway is the public entry point. It authenticates requests, applies edge
controls, propagates trace context, and invokes the owning service. It contains
no marketplace business rules and owns no domain tables.

The target deliberately uses both NestJS and Go as first-class service
runtimes. NestJS owns the gateway, identity, marketplace, payments, content,
support/risk, and notifications. Go owns search, availability/pricing, and the
booking workflow orchestrator. Each service owns its application/domain layer,
contracts, persistence mappings/migrations, database, outbox, tests, health
checks, and deployment lifecycle.

NestJS services use TypeORM. Go transactional services use `pgx`, `sqlc`, and
versioned SQL migrations. Neither runtime imports another service's domain
implementation.

Public APIs are REST/OpenAPI-first. Internal synchronous invocation uses gRPC
and protobuf by default. Existing GraphQL remains a temporary compatibility
surface and must not dictate the new domain model.

### Service-to-service invocation

- Internal DNS/service discovery resolves the owning service.
- Calls propagate deadlines, cancellation, correlation IDs, and trace context.
- Workload identity authenticates callers; sensitive operations authorize again in the owning service.
- Retries apply only to idempotent operations and use bounded backoff with jitter.
- Circuit breakers and bulkheads prevent cascading resource exhaustion.
- Booking and money commands carry idempotency keys.
- Long synchronous call chains are prohibited; booking service orchestrates multi-service workflows and compensations.

### Go services

The search service consumes listing, availability-summary, tariff, and review
events from Kafka. It maintains its own denormalized PostGIS read model and
serves radius, bounding-box, filtering, faceting, ranking, and clustering
queries. It uses `pgx` and `sqlc`.

Search prices are indicative. Booking service invokes availability service for
the authoritative quote and hold before coordinating payment and confirmation.

The availability service owns schedules, capacity, pricing rules, quotes, and
holds. The booking service owns reservation workflow state and orchestrates
availability and payment through gRPC. These latency- and concurrency-sensitive
services are implemented in Go from their first extracted version.

### PostgreSQL and PostGIS

Each service owns a database or isolated schema and its migrations. Go
service owns only its search projection. Cross-service database reads and
writes are prohibited; data crosses boundaries through invocation APIs or
events. One PostgreSQL cluster is acceptable initially, but credentials and
schema ownership remain isolated per service.

All money is stored as integer minor units with an ISO currency. All timestamps
are UTC; listings also store an IANA timezone for interpreting local rules.

### Kafka

Each service writes domain state and an outbox row in one local transaction.
Its relay publishes to Kafka. Consumers use durable consumer groups
and idempotent handlers. See [Kafka event conventions](EVENTS.md).

Kafka is not part of synchronous checkout or booking confirmation. A user must
receive an authoritative response even if Kafka is temporarily unavailable.

### Redis

Redis stores expiring booking-hold coordination, caches, rate-limit counters,
idempotency acceleration, and short-lived security/session data. PostgreSQL
constraints remain the final overselling defence.

Every key needs a namespace, serialization version, owner, and TTL. Failure
behaviour must be declared per use case; payment and booking safety checks fail
closed.

### Object storage

Listing media and generated exports use an S3-compatible API. MinIO provides
the local/test implementation. Production may use managed object storage.
Clients upload using short-lived signed requests and never receive permanent
storage credentials.

## Booking consistency flow

```text
Search candidates (Go)
        |
        v
Authoritative quote (availability service invocation)
        |
        v
Expiring hold (Redis coordination + PostgreSQL constraint/ledger)
        |
        v
Payment authorization (payment service invocation)
        |
        v
Booking confirmation + local outbox (booking service transaction)
        |
        +--> confirmation response
        +--> Kafka events --> search/admin/notification projections
```

Unit inventory uses non-overlap constraints. Capacity inventory uses an
append-only capacity ledger. Application checks improve errors but database
constraints protect correctness under concurrency.

## Persistence migration

The repository still contains Prisma-generated models and services from the
prototype. Migration is module-by-module:

1. Baseline the existing table without recreating it.
2. Add a hand-written TypeORM entity and repository adapter.
3. Add repository integration and API parity tests.
4. Move the whole aggregate to the new repository—never dual-write it.
5. Remove that module's Prisma imports and generated DTO coupling.
6. Remove Prisma entirely after the last aggregate migrates.

NestJS tables use TypeORM migrations; Go services use versioned SQL migrations
with `pgx`/`sqlc`. Automatic migrations on service startup and TypeORM
`synchronize` are disabled in every environment.

## Container deployment

Every application, worker, migration, and test runner is an image. Local
dependencies run through Compose. Production may replace stateful containers
with managed PostgreSQL, Kafka, Redis, and object storage, but application
contracts stay portable.

Images run as non-root users, receive configuration at runtime, expose health
checks, log to stdout/stderr, and shut down gracefully. One immutable image is
promoted between environments rather than rebuilt per environment.
