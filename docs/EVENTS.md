# Kafka event conventions

## Event envelope

Every event uses this logical envelope:

```json
{
  "eventId": "uuid",
  "eventType": "marketplace.listing.published",
  "eventVersion": 1,
  "aggregateType": "listing",
  "aggregateId": "listing-id",
  "occurredAt": "2026-09-16T00:00:00.000Z",
  "correlationId": "request-or-workflow-id",
  "causationId": "command-or-parent-event-id",
  "traceId": "otel-trace-id",
  "data": {}
}
```

Event names are past-tense business facts. Events are not remote commands and
must not contain secrets, payment credentials, password material, or protected
parking access instructions.

## Topics

Topics are grouped by bounded context and major schema version:

- `marketplace.listing-events.v1`
- `booking.booking-events.v1`
- `finance.payment-events.v1`
- `platform.dead-letter.v1`

Partition messages by aggregate ID to preserve ordering for one aggregate.
Ordering across different aggregates is not guaranteed.

## Producer rules

- Write state and the outbox record in one PostgreSQL transaction.
- Only the outbox relay publishes authoritative domain events.
- Use the outbox row ID as the stable Kafka event ID.
- A successful database commit must not depend on Kafka availability.
- Evolve schemas backward-compatibly within a topic version.

## Consumer rules

- Assume at-least-once delivery and make handlers idempotent.
- Commit offsets only after the local transaction or side effect succeeds.
- Store processed event IDs where duplicate side effects would be harmful.
- Retry transient failures with bounded backoff and retry topics.
- Route poison messages to the dead-letter topic with failure metadata.
- Provide controlled replay and projection-rebuild procedures.
- Emit lag, processing duration, retry, and dead-letter metrics.

## Schema changes

Adding optional fields is normally backward-compatible. Renaming/removing
fields or changing meaning requires a new event version and possibly a new
topic major version. Consumers must be deployable before a producer starts
requiring their new behaviour.
