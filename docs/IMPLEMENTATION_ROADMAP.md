# Autospace implementation roadmap

This roadmap translates the product plan into a build order. Estimates are planning ranges for a small cross-functional team and should be recalibrated after the foundation audit.

## Architecture baseline

| Area | Decision |
|---|---|
| Customer, provider, admin, valet web | Next.js in the existing Nx monorepo |
| Public backend | NestJS API gateway/BFF |
| Domain backend | Polyglot Go and NestJS microservices |
| Internal invocation | gRPC/protobuf with deadlines, identity, tracing, and resilience policies |
| NestJS persistence | Service-owned TypeORM repositories and reviewed SQL migrations |
| Go persistence | `pgx`, `sqlc`, and versioned SQL migrations |
| Database | PostgreSQL with PostGIS |
| High-throughput search | Go using `pgx` and `sqlc` |
| Cache and short-lived holds | Redis |
| Asynchronous integration | Kafka fed by a transactional outbox relay |
| Payments and provider payouts | Stripe PaymentIntents, SetupIntents, Connect, and webhooks |
| Files | S3-compatible object storage plus CDN |
| API contracts | OpenAPI for new APIs; generated TypeScript and Go clients |
| Observability | OpenTelemetry, structured logs, metrics, error tracking |
| Packaging | Docker images for every application, worker, migration, and test runner |
| Local orchestration | Layered Docker Compose profiles |
| Production runtime | Container orchestrator using the same promoted images |

Prisma is not part of the target architecture. The existing API is a transitional legacy service to be decomposed; its Prisma-generated code is migrated into service-owned TypeORM persistence, not extended.

## Delivery map

```text
Foundation, service platform and Prisma exit
        |
        +--> Identity, organisations and RBAC
        |           |
        |           +--> Admin access controls
        |
        +--> Listing and inventory model
                    |
                    +--> Availability and tariffs
                              |
                              +--> Search and listing details
                              |          |
                              |          +--> Go search projection
                              |
                              +--> Quote, hold and checkout
                                         |
                                         +--> Booking management
                                         +--> Refunds and support
                                         +--> Provider earnings/payouts
                                                    |
                                                    +--> Monthly/airport/event products

CMS and SEO begin after the listing model and run alongside core booking work.
Admin modules ship with each corresponding domain, not as a final separate project.
```

## Milestone 0 — decisions and current-system audit

**Duration:** 1 week

### Backend

- Inventory every Prisma query, generated DTO/entity, GraphQL resolver, REST controller, seed, and migration.
- Record the existing database schema and data constraints.
- Decide whether the existing GraphQL API receives a compatibility period or is retired with each migrated module.
- Create ADRs for TypeORM conventions, module boundaries, REST errors, authentication, Kafka topics/events, Redis keys/expiry, map provider, and Stripe Connect.
- Define service boundaries, protobuf ownership, gateway routing, workload identity, service discovery, deadlines, retry/circuit-breaker policies, and invocation contract testing.
- Define separate schemas such as `identity`, `marketplace`, `booking`, `finance`, `content`, `operations`, and `search` if the team accepts schema-level ownership.

### Product and design

- Approve the driver, host, operator, valet, support, finance-admin, and super-admin journeys.
- Create an original Autospace design direction and component inventory.
- Define launch geography, currencies, taxes, cancellation policy, commissions, payout schedule, and support policy.

### Exit gate

- Approved architecture decisions, domain glossary, journey map, migration inventory, backlog, and acceptance criteria.

## Milestone 1 — platform foundation and Prisma exit

**Duration:** 2-3 weeks

### Persistence migration order

1. Install and configure TypeORM with one connection pool and explicit naming conventions.
2. Add a migration CLI and environment-safe configuration.
3. Baseline the existing production schema without recreating tables.
4. Create hand-written TypeORM entities and repository interfaces for one low-risk module.
5. Run Prisma and TypeORM side by side only during module-by-module migration; never dual-write the same aggregate.
6. Migrate modules in dependency order: users/auth, organisations/roles, listings/addresses, spaces, bookings/timelines, reviews, verification, valet operations, payments.
7. Replace Prisma seeds with idempotent TypeScript seed commands using repositories or SQL.
8. Remove generated Prisma DTO/entity dependencies, Prisma client, scripts, migrations, and packages after parity tests pass.

### Platform work

- Upgrade NestJS, TypeScript, Next.js, Nx, and testing dependencies on controlled branches.
- Add validation, error envelopes, request IDs, idempotency middleware, structured logging, health/readiness endpoints, and OpenAPI generation.
- Add a gateway skeleton and shared gRPC conventions for protobuf generation, correlation propagation, deadlines, service credentials, resilience, and contract tests.
- Create a NestJS template with HTTP/gRPC, TypeORM, Kafka/outbox, Redis, telemetry, health, Docker, and graceful shutdown.
- Create a Go template with gRPC, `pgx`/`sqlc`, Kafka/outbox, Redis, telemetry, health, Docker, and graceful shutdown.
- Establish unit, repository integration, API integration, and end-to-end test layers.
- Add CI gates for formatting, linting, type checks, migrations, tests, builds, and API contract drift.
- Add production multi-stage Dockerfiles for every Next.js app, NestJS API/worker, and Go service; run all final images as non-root users.
- Add one-shot Docker images/commands for transactional migrations, search read-model migrations, seeds, contract generation, integration tests, and end-to-end tests.
- Configure local PostgreSQL/PostGIS, Kafka, Redis, object storage, reverse proxy, mail catcher, Stripe CLI, and observability through layered Docker Compose files and profiles.
- Add container health checks, dependency readiness, graceful shutdown, persistent development volumes, isolated test volumes, and internal-only networks.
- Add CI image builds, BuildKit caching, SBOM generation, vulnerability scanning, signing, registry publishing, and smoke tests against the built images.

### Admin delivered here

- New admin shell, navigation, permission guards, feature flags, system health, and audit viewer foundation.

### Exit gate

- The first extracted service runs without Prisma behind the gateway; the development/test stack starts through Docker Compose; migrations work from empty and baseline databases; invocation and event contract tests pass.

## Milestone 2 — identity, organisations, and permissions

**Duration:** 2 weeks

### Domain/API

- Users, sessions, credentials/social identity, email/phone verification, password reset, optional MFA, and session revocation.
- Driver and host profiles without mutually exclusive one-to-one role assumptions.
- Organisations, memberships, invitations, and permissions for commercial operators.
- Vehicles and notification preferences.

### Web

- Sign-up/login/recovery, account profile, vehicles, security, and notification settings.
- Provider organisation switcher and staff invitation flow.

### Admin

- User and organisation search, detail, verification, suspension, session revocation, role assignment, and audit history.

### Exit gate

- A single user can safely act as driver, host, and organisation member; every privileged operation is permission checked and audited.

## Milestone 3 — listings, inventory, and provider onboarding

**Duration:** 3-4 weeks

### Domain/API

- Replace `Garage` with `Listing` and `Slot` with unit- or capacity-based `ParkingSpace` concepts through compatibility migrations.
- Address, geocoding, PostGIS point, timezone, images, amenities, access method/instructions, restrictions, capacity, and publication states.
- Draft, submitted, changes-requested, approved, published, paused, and delisted workflow.
- Secure media upload and processing pipeline.

### Provider web

- Guided listing wizard, autosave draft, map-pin correction, image upload, preview, submission, status, publish/pause.
- Commercial bulk import template for sites and spaces.

### Admin

- Moderation queue, listing comparison, map correction, media review, verification checklist, approve/request changes/pause/delist, bulk actions, and change history.

### Exit gate

- A provider can create and submit a listing; an admin can moderate it; only approved inventory becomes public.

## Milestone 4 — availability, tariffs, quote, and safe reservation

**Duration:** 3-4 weeks

### Domain/API

- Recurring availability rules, exceptions, blackout periods, lead time, minimum/maximum stay, capacity, and timezones.
- Integer-minor-unit money, currencies, tariffs, platform fees, taxes, promotions, and immutable quote snapshots.
- Redis-backed expiring holds backed by authoritative PostgreSQL constraints/transactions.
- Unit inventory uses non-overlap constraints; capacity inventory uses an append-only capacity ledger.
- Quote -> hold -> payment authorisation -> confirmation state machine with idempotency.

### Provider web

- Calendar, recurring schedule, exceptions, tariffs, recommended pricing placeholder, and booking rules.

### Admin

- Availability inspector, tariff editor, quote explanation, hold viewer, override workflow, promotion controls, and reasoned/audited adjustments.

### Exit gate

- Concurrency tests prove no overselling; every displayed price can be explained from a versioned quote.

## Milestone 5 — public discovery and listing experience

**Duration:** 3 weeks

### Customer web

- Original Autospace homepage with hourly/daily, monthly, and airport tabs.
- Destination autocomplete, date/time selection, recent searches, and current location.
- Responsive map/list results, clustering, filters, sorting, pagination/infinite loading, empty/error/loading states.
- Listing detail with gallery, map, walk distance, amenities, restrictions, cancellation policy, access summary, reviews, and full price breakdown.
- Accessibility, Core Web Vitals, analytics events, and responsive behaviour.

### Initial backend

- Implement authoritative search inside NestJS/PostGIS first so the marketplace is shippable before service extraction.
- Separate search query contracts from persistence implementation.

### Admin

- Search diagnostics, ranking fields, featured/suppressed listings, searchable location aliases, and public-preview links.

### Exit gate

- A driver can find an actually available listing and receive the same authoritative quote at detail and checkout.

## Milestone 6 — checkout, bookings, payments, and customer self-service

**Duration:** 3-4 weeks

### Customer web/API

- Checkout with account/guest continuation policy, vehicle, contact data, promo code, saved payment method, consent, and price summary.
- Stripe PaymentIntents/SetupIntents, SCA, webhook verification, retries, and reconciliation.
- Confirmation, receipt, directions, protected access instructions, upcoming/history views, repeat booking, cancellation/refund, and review.
- Notification templates for all booking states.

### Admin

- Booking search/detail/timeline, payment state, resend confirmation, amend/cancel/rebook, full/partial refund, goodwill credit, access-instruction audit, and support notes.
- Failed webhook queue and replay with idempotency protection.

### Exit gate

- Paid booking, failed payment, cancellation, partial/full refund, and webhook replay pass end-to-end and reconciliation tests.

## Milestone 7 — provider earnings, ledger, and payouts

**Duration:** 3 weeks

### Finance/API

- Double-entry ledger for charges, platform fees, refunds, provider earnings, reserves, adjustments, and payouts.
- Stripe Connect onboarding, account status, payout method, scheduled payouts, holds, failures, and retries.
- Statements, invoices, downloadable reports, and reconciliation jobs.

### Provider web

- Earnings dashboard, transaction ledger, payout settings/status, statements, and performance summary.

### Admin

- Finance dashboard, balances, ledger explorer, refunds, disputes, chargebacks, payout approval/hold/retry, reconciliation breaks, and CSV export.
- Dual approval for high-risk/high-value finance actions.

### Exit gate

- Every money movement balances; provider earnings reconcile to bookings, refunds, Stripe, and payouts.

## Milestone 8 — Go search service and event backbone

**Duration:** 3-4 weeks

### Event foundation

- Add transactional outbox tables and a Kafka relay in NestJS.
- Define Kafka topics by bounded context, partition keys by aggregate ID, retention, compaction, access controls, and environment naming.
- Version event envelopes and schemas; implement consumer groups, replay, retry topics, dead-letter topics, monitoring, and consumer idempotency.

### Go service

- Create Go service with `pgx`, `sqlc`, OpenTelemetry, health endpoints, configuration, and graceful shutdown.
- Consume listing, availability-summary, tariff, review-summary, and booking projection events.
- Store a denormalised PostGIS read model.
- Implement radius/bounding-box search, filters, facets, ranking, distance, approximate price, and clustering.
- Add rebuild-from-events/index-reconciliation commands, shadow traffic, parity tests, load tests, circuit breaker, and NestJS fallback.

### Admin

- Projection lag, failed events, replay/rebuild controls, relevance diagnostics, and service health dashboards.

### Exit gate

- Go search meets latency/relevance SLOs under load, survives replay, and can fall back without blocking bookings.

## Milestone 9 — CMS, SEO, locations, and growth

**Duration:** 3 weeks; may overlap Milestones 6-8

### Public web/API

- Location and POI pages for cities, airports, stations, stadiums, hospitals, universities, ports, beaches, shopping centres, and streets.
- Original editorial content, parking statistics, price bands, nearby places/events, reviews, FAQs, breadcrumbs, canonical URLs, schema markup, sitemap, and redirects.
- Articles, testimonials, legal pages, app banners, sustainability content, promo/referral foundations, and commercial lead capture.

### Admin

- CMS editor and preview, POI/event management, metadata, structured data, navigation/footer, redirect manager, sitemap controls, campaign eligibility/caps, and featured content.

### Exit gate

- Editors can publish and roll back content without deployment; generated pages avoid duplicate/thin content and pass technical SEO checks.

## Milestone 10 — monthly, airport, event, fleet, and valet products

**Duration:** 4-6 weeks

Build each product as an extension of shared listing, quote, booking, ledger, payment, support, risk, and audit foundations.

- Monthly subscriptions/season tickets, renewals, notice periods, arrears, and plan changes.
- Airport terminal, shuttle/meet-and-greet, transfer schedule/time, flight information, and operational instructions.
- Event-linked inventory, event pricing, closure/traffic instructions, and capacity allocation.
- Fleet/business accounts, members, cost centres, consolidated invoicing, policy, and reporting.
- Retain and integrate the current valet workflow only where the product requires it.
- Add matching admin modules for subscription intervention, airport operations, event inventory/pricing, fleet billing, and valet dispatch.

### Exit gate

- Each enabled product passes domain, payment, admin intervention, support, and reconciliation scenarios.

## Cross-cutting work that never becomes a final-phase afterthought

| Workstream | Required continuously |
|---|---|
| Security | Threat modelling, least privilege, secret rotation, dependency/SAST/DAST scans, rate limits, penetration testing |
| Privacy | Consent, retention, redaction, subject export/deletion, access logging, PCI scope minimisation |
| Accessibility | WCAG 2.2 AA automated and manual checks for every customer/admin flow |
| Reliability | SLOs, dashboards, alerts, backups, restore drills, runbooks, canaries, rollback |
| Testing | Unit, integration, contract, concurrency, end-to-end, webhook replay, reconciliation, performance |
| Analytics | Event taxonomy, funnel integrity, operational metrics, warehouse-ready event stream |
| Admin parity | No public/provider feature is complete until support and operations can inspect and control it |
| Containers | Reproducible images, non-root runtime, health checks, graceful shutdown, scanning, signing, and promotion |

## Container inventory

| Container/workload | Purpose | State |
|---|---|---|
| `gateway` | TLS termination locally, routing, compression, and security headers | Stateless |
| `web` | Driver marketplace and account | Stateless |
| `web-provider` | Host and commercial-operator portal | Stateless |
| `web-admin` | Internal administration | Stateless |
| `web-valet` | Valet/on-site workflows | Stateless |
| `api` | NestJS HTTP transactional API | Stateless |
| `gateway` (NestJS) | Public REST API/BFF and service invocation client | Stateless |
| `identity-service` (NestJS) | Identity, sessions, organisations, membership, RBAC | Stateless with owned database |
| `marketplace-service` (NestJS) | Listings, spaces, media metadata, moderation state | Stateless with owned database |
| `availability-service` (Go) | Availability rules, tariffs, quotes, and holds | Stateless with owned database/Redis |
| `booking-service` (Go) | Booking lifecycle and workflow orchestration | Stateless with owned database |
| `payment-service` (NestJS) | Stripe, ledger, refunds, disputes, and payouts | Stateless with owned database |
| `content-service` (NestJS) | CMS, SEO locations, POIs, events, and redirects | Stateless with owned database |
| `support-service` (NestJS) | Cases, moderation, risk, and operational notes | Stateless with owned database |
| `outbox-relay` | Publishes committed outbox records to Kafka | Stateless consumer/worker |
| `worker` | Notifications, media, reconciliation, and scheduled jobs | Stateless consumer/worker |
| `search-service` | Go geospatial search API and projection consumer | Stateless with external read model |
| `migrate` | TypeORM transactional-schema migrations | One-shot job |
| `search-migrate` | Go/sqlc read-model SQL migrations | One-shot job |
| `seed` | Idempotent development/test seed data | One-shot job |
| `postgres` | PostgreSQL with PostGIS for local/test | Persistent volume |
| `kafka` | Kafka KRaft broker for local/test | Persistent volume |
| `redis` | Holds, cache, limits, and ephemeral security state | Persistent only where policy requires |
| `object-storage` | S3-compatible local/test media store | Persistent volume |
| `mail-catcher` | Local email inspection | Development only |
| `stripe-cli` | Local webhook forwarding | Development profile |
| `otel-collector` | Telemetry collection and export | Stateless |
| `prometheus`, `grafana`, `loki`, `tempo` | Local metrics, dashboards, logs, and traces | Observability profile |
| `integration-tests`, `e2e-tests` | Tests against built containers | One-shot jobs |

## Required container commands

The repository should expose simple wrapper commands around Compose so developers do not need to remember topology details:

- Start/stop the complete development platform.
- Start infrastructure only.
- Run migrations and seeds explicitly.
- Run unit tests locally and integration/e2e tests inside isolated Compose projects.
- Start the observability profile.
- Build the exact production images used in CI.
- Reset only disposable development volumes with an explicit, guarded command.
- Inspect health, logs, Kafka lag, Redis state, and migration status.

No developer should need locally installed PostgreSQL, Kafka, Redis, Go, or a global Node package to run the project; Docker and the repository wrapper are the runtime prerequisites.

## Suggested release slices

### Internal alpha

Milestones 0-4: staff can create, moderate, price, and reserve inventory in a test environment.

### Closed marketplace beta

Milestones 5-7: invited drivers and providers can complete real, limited-volume bookings and payouts with hands-on support.

### Public launch

Milestones 8-9 plus security, accessibility, reconciliation, disaster recovery, and operational-readiness gates.

### Product expansion

Milestone 10 features are enabled independently behind feature flags after commercial and operational validation.

## First two-week sprint

1. Audit Prisma usage and produce a module-by-module removal checklist.
2. Add TypeORM configuration, migration commands, repository conventions, and a database integration-test harness.
3. Baseline the existing schema and prove forward/rollback migration in CI.
4. Migrate one low-risk read/write module end-to-end without changing its API contract.
5. Add request IDs, structured logs, health/readiness checks, and OpenAPI scaffolding.
6. Draft ADRs for API direction, authentication/RBAC, PostGIS/maps, event transport, and Stripe Connect.
7. Wire the new admin shell and permission route guard.
8. Produce wireframes and acceptance criteria for search, listing detail, checkout, provider listing wizard, and admin moderation.
9. Add the base/development/test/observability Compose files and production Dockerfiles for currently existing applications.
10. Prove a clean-machine bootstrap, containerised migration, seed, health check, and end-to-end smoke test in CI.

## Kafka and Redis operating rules

### Kafka

- Kafka transports facts that have already committed in PostgreSQL; API requests do not publish directly before a database commit.
- The transactional outbox relay is the only standard path from NestJS transactions to Kafka.
- Partition by aggregate ID to preserve ordering for a listing, booking, payment, or payout.
- Consumers must be idempotent because Kafka delivery is treated as at-least-once.
- Use versioned event schemas with backward-compatible evolution, correlation IDs, causation IDs, and trace context.
- Use bounded-context topics, dedicated retry topics with controlled backoff, and dead-letter topics with admin visibility and replay controls.
- Kafka is not used for synchronous quote, availability confirmation, checkout, or payment-authorisation responses.

### Redis

- Use Redis for expiring booking holds, query/result caching, rate-limit counters, idempotency acceleration, and short-lived session/security state.
- Every key uses a documented namespace, environment prefix, owner, serialization version, and TTL policy.
- Redis never becomes the only source for bookings, payments, balances, listings, tariffs, or availability rules.
- Hold acquisition may use an atomic Lua script, but final capacity confirmation is protected by a PostgreSQL transaction and constraints.
- Cache invalidation is driven by committed changes and Kafka events; TTL remains a safety net.
- Configure high availability, eviction policy, memory alerts, latency monitoring, and fail-open/fail-closed behaviour per use case.
