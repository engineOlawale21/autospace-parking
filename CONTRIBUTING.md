# Contributing to Autospace

## Before changing code

Read the root README and the relevant architecture/roadmap sections. Keep
current implementation and target architecture distinct. For a material
architectural decision, add or update an ADR before spreading the pattern.

## Change boundaries

- New API persistence uses TypeORM, not Prisma.
- Do not dual-write one aggregate through Prisma and TypeORM.
- New APIs are REST/OpenAPI-first unless an approved decision says otherwise.
- Internal synchronous service-to-service contracts use gRPC/protobuf by default.
- Services own their databases; cross-service table access is prohibited.
- Synchronous calls define deadlines, idempotency, retries, circuit breakers, and trace propagation.
- Kafka events are emitted from the transactional outbox, not directly from controllers.
- Redis is never the sole record for bookings, listings, money, or availability rules.
- Public/provider features include the admin operations needed to support them.
- Do not copy third-party branding, text, images, or proprietary datasets.

## Pull-request checklist

- The change has a clear product or operational reason.
- Domain rules live outside controllers and ORM entities.
- Permissions and privileged actions are explicit and audited.
- Money uses minor units and currency; time handling includes listing timezone.
- API/event contract changes are documented and backward-compatible.
- Migrations are explicit, reversible where practical, and rollout-safe.
- Unit/integration/e2e tests match the risk of the change.
- Accessibility and responsive behaviour were checked for UI work.
- Logs contain correlation context and no secrets or sensitive access data.
- Documentation and environment examples are updated.

## Commit hygiene

Keep commits focused. Do not commit `.env.docker`, credentials, generated
runtime data, build output, local volumes, or dependency directories. Preserve
unrelated work already present in the working tree.

There are no automatic Git hooks. Run `yarn validate` and the relevant Go tests
before pushing; GitHub Actions is the authoritative merge gate.
