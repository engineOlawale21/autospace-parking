# Autospace service contracts

This workspace owns language-neutral contracts shared by Go and NestJS
microservices. Source protobuf files are under `proto`; generated Go and
TypeScript clients are build artifacts under `gen` and must never be edited.

```bash
docker compose --profile tools run --rm contracts-lint
docker compose --profile tools run --rm contracts-generate
```

Contract rules:

- Package by bounded context and major version.
- Add fields; do not reuse or renumber existing field numbers.
- Reserve removed field names and numbers.
- Commands that can create bookings or move money carry idempotency keys.
- All calls receive deadlines and trace/correlation metadata at transport level.
- Stable domain error codes are returned through gRPC status details.
- Never put credentials, payment data, or protected access instructions in broad messages.

Generated clients are the only shared code between runtimes. Services do not
share ORM entities, repositories, or domain implementations.
