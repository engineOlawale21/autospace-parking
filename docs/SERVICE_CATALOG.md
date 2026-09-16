# Service catalog

This is the target microservice boundary. The current `apps/api` is a
transitional legacy API and will be reduced as capabilities move behind the
gateway into independently deployable services.

The first protobuf contracts are implemented under `libs/contracts/proto`.
Availability, booking, and payment use these contracts rather than importing
another runtime's TypeScript or Go implementation.

| Service | Runtime | Owns | Synchronous dependencies | Publishes |
|---|---|---|---|---|
| API gateway | NestJS | Public REST/BFF routes, authentication context, throttling, response composition | All user-facing domain services | Edge/security telemetry only |
| Identity | NestJS | Accounts, sessions, MFA, profiles, vehicles, organisations, memberships, permissions | Notification for verification delivery | User, organisation, membership events |
| Marketplace | NestJS | Listings, spaces, amenities, media metadata, access policy, reviews, publication state | Identity when token claims are insufficient | Listing and review events |
| Availability | Go | Schedules, exceptions, tariffs, capacity, quotes, holds | Marketplace facts via local projection; Redis | Tariff, availability-summary, hold events |
| Booking | Go | Booking lifecycle, amendments, cancellations, subscriptions, saga state | Availability, payment, identity | Booking and subscription events |
| Payment | NestJS | Stripe customers/intents/webhooks, ledger, refunds, disputes, Connect, payouts | Identity/provider facts | Payment, refund, dispute, ledger, payout events |
| Content | NestJS | CMS pages, SEO locations, POIs, events, FAQs, navigation, campaigns | Search summaries where needed | Content, POI, event, campaign events |
| Support | NestJS | Cases, operational notes, moderation cases, risk flags | Identity, booking, payment, marketplace | Case, moderation, risk events |
| Notification | NestJS worker | Templates, preferences, delivery attempts | Restricted identity contact API | Notification delivery events |
| Search | Go | Geospatial listing projection and ranking | None on the query hot path | Projection health/rebuild events |

## Invocation rules

Go and NestJS use the same gRPC/protobuf contracts for internal invocation. REST/OpenAPI is
the public gateway contract. An internal HTTP exception must be documented in
an ADR.

Every invocation includes:

- caller workload identity;
- correlation and OpenTelemetry trace context;
- a deadline shorter than the caller's remaining deadline;
- idempotency key for retryable commands;
- stable machine-readable error codes;
- contract version compatible with rolling deployment.

Clients retry only declared idempotent operations. Each client has explicit
timeouts, retry budget, circuit breaker, concurrency limit, and fallback
behaviour. A service may not treat another service's database as an API.

## Workflow ownership

Booking service orchestrates the synchronous reservation workflow:

1. Invoke availability to validate an authoritative quote and acquire a hold.
2. Invoke payment to authorize or capture funds.
3. Persist booking workflow state and local outbox event.
4. Confirm the hold through availability.
5. Compensate payment/hold safely if a later step fails.

This is a saga with persisted workflow state, not a distributed database
transaction. Each command is idempotent and each compensation can be retried.

## Data ownership

Each service has its own database or isolated PostgreSQL schema, role, migration
job, backup/restore scope, and outbox table. Shared infrastructure does not mean
shared table access. Cross-service reporting uses events and analytical
projections rather than production joins.

NestJS services use TypeORM. Go services use `pgx`, `sqlc`, and reviewed SQL
migrations. This persistence difference never leaks into service contracts.

## Extraction order

1. Create gateway and common invocation platform.
2. Extract NestJS identity because all later services require stable claims.
3. Extract NestJS marketplace listings and provider ownership.
4. Build Go availability/pricing and Redis-backed holds.
5. Build Go booking as the workflow orchestrator.
6. Extract payments/ledger behind strict idempotent contracts.
7. Add search projections, notifications, content, and support consumers.
8. Remove the last legacy API routes and Prisma dependencies.
