# Go search service

High-throughput geospatial search service for Autospace. It will consume
listing, availability-summary, tariff, and review-summary events from Kafka,
maintain a denormalized PostGIS projection, and serve map/list searches.

Current state: container lifecycle, configuration, structured request logging,
graceful shutdown, and health endpoints are implemented. `GET /v1/search`
returns `501` until the projection and query layer are built.

```bash
go test ./...
go run ./cmd/server
```

Endpoints:

- `GET /health/live`
- `GET /health/ready`
- `GET /v1/search` (not implemented yet)

The service never confirms bookings or final prices. NestJS remains
authoritative for availability, quotes, holds, and booking creation.
