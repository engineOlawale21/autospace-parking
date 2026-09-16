# Milestone delivery status

This is the execution scoreboard for the rebuild. A milestone is complete only
when its exit gate is verified; merged scaffolding does not count as delivery.
Update this file whenever a task changes state.

Status values:

- **Done**: implemented and verified at the appropriate level.
- **Active**: currently being implemented.
- **Blocked**: implementation exists or is ready, but its verification depends
  on an unavailable local or external capability.
- **Planned**: not started.

## Milestone 1 — platform foundation

**State: Active**

### Delivered

- **Done** — Product, architecture, service ownership, frontend/admin, event,
  configuration, and implementation plans.
- **Done** — Docker Compose topology for PostgreSQL/PostGIS, Redis, Kafka,
  MinIO, NestJS API, four Next.js applications, and two Go services.
- **Done** — Container health endpoints and non-root Go runtime images.
- **Done** — Initial Go search-service process with health/readiness and
  graceful shutdown.
- **Done** — Initial Go availability-service process and tested hold-state
  domain model.
- **Done** — Versioned protobuf contracts for common, availability, booking,
  and payment calls.
- **Done** — TypeORM configuration, explicit migration commands, first
  platform migration, and transactional outbox entity/service.
- **Done** — GitHub Actions CI checks and GHCR image delivery with BuildKit
  cache, SBOM, provenance, and attestations.
- **Done** — Husky and automatic local Git hooks removed; CI is the merge gate.
- **Done** — Redesigned marketplace entry/search flow and initial admin listing
  command centre.

### Active work

- **Done** — Complete and verify the frozen Yarn lockfile for the TypeORM
  dependencies.
- **Done** — TypeScript formatting, lint, unit tests, and production builds
  pass locally and in GitHub Actions.
- **Done** — Generated Go contract bindings and exposed availability through
  the NestJS gateway with a deadline and correlation metadata.
- **Active** — PostgreSQL-backed quote and hold commands, Redis coordination,
  and transactional outbox writes are implemented. Restart and integration
  verification is running in the Milestone 1 CI smoke gate.
- **Partial** — Added a scheduled transactional outbox relay, KafkaJS
  publisher, opt-in consumer group, and PostgreSQL consumed-event ledger for
  idempotency. Concrete event handlers, retry/dead-letter topics, health, and
  lag monitoring remain.

### Blockers

- **Blocked** — Local Docker Engine access is unavailable; the isolated
  GitHub Actions integration job is the current verification environment.

### Exit gate

Milestone 1 closes only when all of the following are true:

- a clean frozen dependency installation succeeds;
- Node and Go formatting, lint, type, unit, race, and build checks pass;
- protobuf lint and generated-client drift checks pass;
- TypeORM migrations pass against an empty PostGIS database;
- the NestJS gateway successfully invokes the Go availability service over
  gRPC with deadlines and correlation metadata;
- an availability hold survives process restart in PostgreSQL, uses Redis only
  for disposable coordination, and emits an outbox event;
- Kafka publishes that event and a consumer processes it idempotently;
- all release images build and pass health-based Compose smoke tests.

The current implementation does not yet satisfy this exit gate. The Go
availability gRPC endpoint, persistence, Redis coordinator, and Kafka
publisher have focused coverage, but the NestJS gateway client, consumer
path, and container integration checks are not implemented or verified.

## Milestone 2 — identity, organisations, and permissions

**State: Planned**

Begins only after the Milestone 1 exit gate passes. Scope includes identity,
sessions, organisations, memberships, roles, permissions, service credentials,
admin impersonation controls, and audit events.

## Milestones 3–8

**State: Planned**

Detailed scope and exit gates remain in the
[implementation roadmap](IMPLEMENTATION_ROADMAP.md). They cover inventory,
availability/search, booking, payments/payouts, operations/support, growth, and
production hardening.
