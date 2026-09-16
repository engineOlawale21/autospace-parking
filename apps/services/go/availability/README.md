# Availability service

Go microservice that owns schedules, capacity, tariffs, authoritative quotes,
and expiring parking holds. Booking service invokes it through the versioned
`autospace.availability.v1` gRPC contract.

Current implementation includes container lifecycle, health endpoints,
authoritative PostgreSQL quote/hold persistence, disposable Redis coordination,
transactional hold outbox events, and the availability, quote, acquire,
confirm, and release gRPC methods. The NestJS gateway exposes the first direct
availability invocation with a deadline and correlation metadata.

```bash
go test ./...
go run ./cmd/server
```

