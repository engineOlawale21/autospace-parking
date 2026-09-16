# Availability service

Go microservice that owns schedules, capacity, tariffs, authoritative quotes,
and expiring parking holds. Booking service invokes it through the versioned
`autospace.availability.v1` gRPC contract.

Current implementation includes container lifecycle, health endpoints, the hold
state machine, PostgreSQL hold persistence, Redis coordination primitives, and
the `GetAvailability` gRPC endpoint. Hold mutation RPCs, pricing, and the
NestJS gateway client are the next increments.

```bash
go test ./...
go run ./cmd/server
```

