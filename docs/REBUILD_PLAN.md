# Autospace marketplace rebuild plan

## 1. Product goal

Rebuild Autospace as a complete parking marketplace inspired by the user journeys and feature depth of YourParkingSpace, while retaining an original Autospace brand, copy, imagery, and component system. The product must serve five audiences:

1. Drivers booking hourly, daily, airport, event, or monthly parking.
2. Individual hosts listing driveways, garages, permits, and private spaces.
3. Commercial operators managing multi-site car parks, tariffs, capacity, and staff.
4. Valets and on-site staff handling operational tasks where valet service is enabled.
5. Internal administrators operating the marketplace, content, money movement, risk, and support.

The existing Nx monorepo, Next.js applications, NestJS API, PostgreSQL database, GraphQL client, Stripe integration, maps, garages, slots, bookings, reviews, verification, manager, valet, and admin roles form the starting point. The current Prisma persistence layer will be retired. This is an expansion and selective refactor, not a greenfield rewrite.

## 2. Reference-site capability inventory

### Driver experience

- Search by destination or location ID with address autocomplete.
- Hourly/daily, monthly, and airport search modes.
- Arrival/departure date and time selection.
- Map/list results, pagination, sorting, and filters.
- Listing cards with image, rating, distance/walk time, availability, cancellation terms, guarantee, and price.
- Space detail page with gallery, map, amenities, restrictions, access instructions, reviews, host/operator information, and price breakdown.
- Guest-to-account checkout, vehicle selection, promo code, payment, booking confirmation, receipt, and directions.
- Booking management: upcoming/past bookings, cancellation/refund, extend or amend where eligible, repeat booking, access instructions, support, and review.
- Monthly subscriptions/season tickets with renewal, notice period, and payment management.
- Airport parking products with terminal, shuttle/meet-and-greet, transfer frequency/time, and flight details.
- Account profile, saved vehicles, saved payment methods, notification preferences, and favourites.
- Guarantees, trust/review signals, help centre, and contact/support flow.

### Host and commercial operator experience

- Guided listing onboarding with address/map pin, space type, capacity, vehicle limits, amenities, access type, photos, and instructions.
- Hourly, daily, and monthly pricing with recommended-price guidance.
- Recurring availability, date exceptions, blackout periods, minimum/maximum duration, and booking notice.
- Instant-book rules and cancellation policies.
- Booking calendar and booking/customer detail.
- Listing preview, publish/pause, verification state, performance suggestions, and reviews.
- Earnings dashboard, fees, ledger, statements, payout method, payout status, and downloadable tax/finance exports.
- Multi-site commercial portfolio, bulk capacity/tariff management, occupancy, revenue and demand analytics, cashless/on-demand parking, EV charging metadata, and staff roles.

### Content, discovery, and growth

- Original marketing homepage and explanatory pages.
- SEO landing pages for towns/cities, airports, stations, stadiums/events, hospitals, universities, ports, beaches, hotels, shopping centres, streets, and other points of interest.
- Location pages containing search inventory, editorial content, parking statistics, price ranges, nearby attractions/transport/events, reviews, and structured data.
- CMS-managed navigation, FAQs, testimonials, legal pages, articles/news, promotions, app-download banners, and sustainability content.
- Referral, promotional-code, lifecycle email, and notification foundations.
- Fleet/business accounts and commercial lead capture.

## 3. Proposed architecture

### Repository shape

Keep the Nx monorepo and evolve it toward:

```text
apps/
  web/                 Next.js public marketplace and driver account
  web-provider/        Next.js host/operator portal (evolves web-manager)
  web-admin/           Next.js internal operations console
  web-valet/           Next.js valet/on-site operations
  api/                 Transitional legacy API during decomposition
  gateway/             NestJS public API gateway/BFF
  services/
    nest/
      identity/        Identity, organisations and RBAC
      marketplace/     Listings and inventory
      payment/         Payments, ledger and payouts
      content/         CMS, SEO and discovery content
      support/         Support, moderation and risk
    go/
      search/          Geospatial search and ranking
      availability/    Availability, tariffs, quotes and holds
      booking/         Booking lifecycle and workflow orchestration
  search-service/      Go geospatial search/read-model service
  pricing-service/     Go quote and yield engine (extract after rules stabilise)
libs/
  ui/                  Autospace design system
  contracts/           OpenAPI/AsyncAPI schemas and generated clients
  domain/              Shared TypeScript domain types for Next/Nest only
  observability/       Logging, tracing, metrics conventions
infra/
  docker/              Shared Docker configuration and local tooling
  compose/             Base, development, test, and observability stacks
  deploy/              Production container manifests and environment overlays
```

Do not share runtime source code between Go and TypeScript. Share versioned contracts and events.

### Service responsibilities

**Polyglot Go and NestJS microservices**

- Gateway: public REST/OpenAPI, authentication context, routing, aggregation, throttling, and response shaping.
- Identity service: authentication, sessions, MFA, RBAC, drivers, hosts, organisations, staff, vehicles, and permissions.
- Marketplace service: listings, spaces, amenities, media metadata, access rules, reviews, and publication/moderation state.
- Availability service (Go): schedules, exceptions, capacity ledger, tariffs, authoritative quotes, and expiring holds.
- Booking service (Go): bookings, amendments, cancellations, subscriptions, and cross-service workflow orchestration.
- Payment service: Stripe, Connect, fees, ledger, refunds, payouts, invoices, disputes, and webhooks.
- Content service: SEO records, POIs, events, CMS, navigation, FAQs, articles, promotions, and referrals.
- Support service: cases, moderation workflows, risk flags, admin notes, and operational audit views.
- Notification workers: email, SMS, push, templates, preferences, and delivery status.

Implement these as independently deployable Go and NestJS services. Public contracts are REST/OpenAPI at the NestJS gateway. Synchronous service-to-service invocation uses language-neutral gRPC/protobuf with deadlines, workload identity, tracing, circuit breakers, and idempotency. Kafka carries committed facts and fan-out reactions through a per-service transactional outbox. GraphQL remains only as a compatibility surface during migration.

NestJS services use TypeORM with explicit mappings and repositories. Go services use `pgx`, `sqlc`, and versioned SQL migrations. Every service owns an isolated database/schema and migration job. Never use schema synchronisation or migrate implicitly on startup. Business rules remain outside ORM entities and transport controllers.

**Go services**

- Consume listing, tariff, review-summary, and availability projection events.
- Maintain a denormalised searchable read model.
- Radius/bounding-box and destination/POI search.
- Filters, facets, ranking, distance, approximate price, and map clustering.
- PostgreSQL + PostGIS initially; add OpenSearch only when measured load or ranking needs justify it.
- Return candidate listings; booking service invokes availability service for final availability, quotes, and holds.

Use `pgx` for PostgreSQL connectivity and `sqlc` for typed query generation in Go. Each service owns its migration job; the Go read-model schema has its own versioned SQL migration directory and deployment job.

**Go availability and pricing service**

- Quote hourly/daily/monthly products.
- Fees, taxes, promotions, minimum stays, event pricing, occupancy rules, and recommended host pricing.
- Version every pricing rule and persist the quote snapshot on the booking.
- Availability and pricing are implemented in Go behind one cohesive gRPC boundary; recommended/yield pricing can split later only when measurements justify it.

### Platform infrastructure

- Everything runs as a container: all Next.js apps, NestJS API, Go services, Kafka relays/consumers, background workers, migration and seed jobs, PostgreSQL/PostGIS, Kafka, Redis, object storage, reverse proxy, and the local observability stack.
- PostgreSQL as source of truth; PostGIS for geospatial data.
- Service-owned TypeORM repositories and migrations; `pgx` and `sqlc` for Go-owned read models.
- Redis for short-lived booking holds, distributed caching, rate limiting, session/token revocation data, idempotency acceleration, and distributed locks where unavoidable. PostgreSQL remains authoritative; Redis data must be safely reconstructable or disposable.
- S3-compatible object storage plus CDN for listing images and content assets.
- Kafka for durable domain events and cross-service integration. NestJS publishes committed events through a transactional outbox relay; Go and other consumers use versioned consumer groups, idempotent handlers, retry topics, dead-letter topics, and replayable projections.
- Stripe Payments and Connect for customer payments and provider payouts.
- Map provider abstraction for autocomplete, geocoding, routes, and static maps.
- Transactional email/SMS/push behind a notification provider abstraction.
- OpenTelemetry traces, structured logs, metrics, error tracking, dashboards, and alerting.

### Containerisation standard

- Each deployable application has its own production multi-stage Dockerfile and a minimal non-root runtime image.
- Nx builds use a pruned build context and BuildKit cache mounts so unrelated applications do not invalidate every image.
- Next.js applications use standalone output. NestJS ships only compiled runtime files and production dependencies. Go services use a statically compiled binary in a distroless runtime where compatible.
- Images are immutable, tagged with semantic version and Git SHA, labelled with source/revision metadata, scanned, signed, and promoted between environments rather than rebuilt.
- Containers expose explicit liveness, readiness, and startup health endpoints; Compose and production deployment manifests depend on health rather than startup order alone.
- Configuration is injected through environment variables or mounted secrets. Secrets, generated credentials, uploads, databases, and broker data are never baked into images.
- Database and read-model migrations execute as one-shot containers before compatible application rollout. They do not run implicitly when an API replica starts.
- Processes log to stdout/stderr and handle termination signals with graceful HTTP shutdown, Kafka consumer draining, and connection cleanup.
- Runtime filesystems are read-only except for explicit temporary mounts. Persistent state uses named local volumes in development and managed persistent storage in deployed environments.
- Resource requests/limits, restart policy, security context, network policy, and horizontal-scaling rules are defined for every production workload.

### Docker Compose topology

Use layered Compose files so the same images support different workflows:

- `compose.yaml`: networks, volumes, PostgreSQL/PostGIS, Kafka, Redis, object storage, and core applications.
- `compose.dev.yaml`: bind mounts, source watching, debug ports, mail catcher, Stripe CLI, seed data, and developer-friendly overrides.
- `compose.test.yaml`: isolated ephemeral dependencies, deterministic test configuration, migration job, integration/e2e runners, and no shared developer volumes.
- `compose.observability.yaml`: OpenTelemetry Collector, Prometheus, Grafana, Loki, Tempo, Kafka/Redis/PostgreSQL exporters, and optional error-tracking services.

The core local stack contains gateway/reverse proxy, `web`, `web-provider`, `web-admin`, `web-valet`, `api`, outbox relay, notification/worker process, Go search service, PostgreSQL/PostGIS, Kafka in KRaft mode, Redis, and S3-compatible storage. Profiles may start only the infrastructure, core product, observability, or test toolchain without changing service definitions.

Dockerising all software does not require self-hosting every production datastore. PostgreSQL, Kafka, Redis, and object storage may be managed services in production, provided local/test equivalents remain containerised and application contracts remain portable.

## 4. Target domain model

Refactor the current `Garage` and `Slot` concepts rather than deleting them immediately:

- `Organisation`, `OrganisationMember`, `Role`, `Permission`
- `DriverProfile`, `HostProfile`, `Vehicle`, `PaymentMethodRef`
- `Listing` (marketed location), `ParkingSpace` (bookable unit/capacity), `Address`, `GeoPoint`
- `Amenity`, `AccessMethod`, `VehicleRestriction`, `MediaAsset`
- `AvailabilityRule`, `AvailabilityException`, `CapacityLedger`, `BookingHold`
- `ParkingProduct` (`HOURLY_DAILY`, `MONTHLY`, `AIRPORT`, `EVENT`, `ON_DEMAND`)
- `Tariff`, `PricingRule`, `Quote`, `Fee`, `Promotion`
- `Booking`, `BookingItem`, `BookingStatusHistory`, `Cancellation`, `Refund`
- `Subscription`, `Renewal`, `NoticeRequest`
- `Payment`, `LedgerEntry`, `PayoutAccount`, `Payout`, `Invoice`
- `Review`, `ReviewResponse`, `Favourite`
- `POI`, `LocationLandingPage`, `Event`, `ContentPage`, `FAQ`, `Article`
- `SupportCase`, `Message`, `ModerationCase`, `RiskFlag`
- `Notification`, `NotificationPreference`, `WebhookDelivery`
- `AuditLog`, `AdminNote`, `FeatureFlag`

Money must use integer minor units plus ISO currency, not floating-point values. Times are stored in UTC with an IANA timezone on each listing. Sensitive access instructions are disclosed only to eligible confirmed bookings.

## 5. Admin console scope

Every new marketplace capability must ship with its corresponding admin control in the same phase.

### Dashboard and live operations

- GMV, net revenue, bookings, conversion, occupancy, cancellations, refunds, failed payments, provider earnings, payout liabilities, and support SLA.
- Live booking/hold feed and operational alerts.
- Date, geography, product, channel, operator, and listing filters.

### Users, organisations, and access

- Search and inspect drivers, hosts, commercial operators, staff, managers, valets, and admins.
- Suspend/reactivate, verify contact details, reset MFA/session access, merge duplicates through a controlled workflow, and view impersonation-safe read-only account previews.
- RBAC editor with protected super-admin permissions.

### Listings and inventory

- Moderation queue, identity/business checks, image and content review, map correction, amenities, restrictions, access instructions, capacity, pricing, availability, publication, pause, and delist actions.
- Bulk edits/imports for commercial portfolios and a complete change history.

### Bookings and subscriptions

- Search, timeline, booking details, availability evidence, amend/rebook, cancel, refund, goodwill credit, reassign capacity, resend confirmation, and reveal-access audit.
- Monthly subscription, renewal, arrears, and notice management.

### Finance

- Payment/refund view, ledger, fees, commissions, taxes, invoices, disputes/chargebacks, provider balances, payout approvals/holds/retries, reconciliation, and CSV exports.
- No direct balance mutation: all adjustments create double-entry ledger records and require a reason; high-value actions use dual approval.

### Customer support and trust

- Support inbox/case assignment, booking-linked conversation history, templates, internal notes, SLA, and escalation.
- Reviews/moderation, fraud/risk flags, blocked entities, evidence, and decision audit trail.

### CMS, SEO, and growth

- Landing pages, POIs, events, articles, FAQs, testimonials, navigation, footer, legal documents, redirects, metadata, canonical URLs, schema markup, and sitemap controls.
- Promo/referral campaigns, eligibility, caps, usage, featured inventory, and app/site announcements.

### Platform controls

- Feature flags, configuration with validation, webhook status/replay, notification delivery, background jobs, integration health, audit logs, data export/deletion requests, and incident banners.

## 6. API and consistency rules

- Public endpoints are versioned and documented with OpenAPI.
- Admin endpoints are a separate namespace and require explicit permissions.
- All payment, booking, refund, payout, and webhook commands accept idempotency keys.
- A booking uses: quote -> expiring hold -> payment authorisation -> confirmed booking. Capacity changes and confirmation occur atomically.
- PostgreSQL exclusion/locking constraints prevent overlapping unit bookings; capacity-based locations use an append-only capacity ledger.
- Events include schema version, aggregate ID, event ID, causation ID, correlation ID, and timestamp.
- Consumers are idempotent and support replay. Search is eventually consistent; booking and price confirmation are strongly consistent through NestJS.
- Keep a tamper-evident audit record for every privileged admin action.

## 7. Delivery phases

### Phase 0 — discovery and foundations (1-2 weeks)

- Confirm target countries, currency/tax rules, airport/valet scope, commercial operator needs, and initial payment/payout countries.
- Catalogue current screens, API behaviour, migrations, security gaps, and reusable UI.
- Define original Autospace visual direction and content policy.
- Add architecture decision records, OpenAPI conventions, CI quality gates, environments, secrets policy, telemetry, and test strategy.
- Add the Dockerfile standard, layered Compose stack, image registry/promotion policy, and production container deployment baseline.

Exit: signed product scope, architecture decisions, domain glossary, prioritised backlog, and runnable CI.

### Phase 1 — marketplace core (4-6 weeks)

- Identity/RBAC, driver profile and vehicles.
- Listing model, photos, amenities, access, restrictions, verification, recurring availability, exceptions, and tariffs.
- Driver home/search form, results map/list, filters, detail page, quote, booking hold, Stripe checkout, confirmation, and booking management.
- Admin users, listings/moderation, bookings, payments/refunds, and audit log.

Exit: an end-to-end hourly/daily booking can be created, paid, administered, cancelled, and refunded without manual database work.

### Phase 2 — provider business (3-5 weeks)

- Host onboarding, listing wizard, calendar, pricing suggestions, booking management, earnings, Stripe Connect, ledger, payouts, statements, and reviews.
- Organisation roles and commercial multi-site basics.
- Admin provider verification, finance/reconciliation, payout holds/retries, disputes, and risk flags.

Exit: a verified provider can self-serve from listing creation through payout.

### Phase 3 — Go search and discovery (3-4 weeks)

- PostGIS schema, outbox/event bus, Go projection consumer, ranked geo search, facets, clustering, cache, load tests, and fallback path.
- SEO location/POI templates, CMS, sitemap, structured data, nearby transport/attractions/events.
- Admin CMS/SEO, POI/event, redirects, and featured inventory.

Exit: search meets agreed relevance and latency SLOs and can rebuild its index from events.

### Phase 4 — advanced products (4-6 weeks)

- Monthly subscriptions/season tickets, airport products and flight/transfer metadata, events, promotions, favourites, referrals, and fleet accounts.
- Optional cashless/on-demand sessions and EV charger metadata after commercial validation.
- Admin controls for every product, subscription, campaign, fleet account, and operational exception.

Exit: advanced products use the same quote, ledger, support, risk, and audit foundations as core bookings.

### Phase 5 — scale and optimisation (ongoing)

- Extract Go pricing only if profiling demonstrates value.
- Yield management, occupancy forecasting, provider recommendations, experimentation, lifecycle messaging, data warehouse/BI, disaster recovery drills, penetration testing, and accessibility/performance optimisation.

## 8. Testing and release gates

- Unit tests for pricing, availability, permissions, booking transitions, cancellation, fees, and ledger rules.
- Property/concurrency tests for overlapping bookings and capacity.
- Contract tests between Next.js, NestJS, Go, Stripe, maps, and event consumers.
- Integration tests with PostgreSQL/PostGIS, Redis, object storage, and Kafka.
- End-to-end journeys for driver, host, operator, valet, support agent, finance admin, and super admin.
- Webhook replay and idempotency tests; reconciliation tests against Stripe fixtures.
- WCAG 2.2 AA checks, responsive/browser coverage, Core Web Vitals budgets, SEO validation, and security scanning.
- Progressive rollout using feature flags, synthetic booking monitoring, canary deployment, rollback runbooks, backups, and restore tests.
- Container smoke tests, image vulnerability/SBOM checks, non-root/read-only-filesystem checks, health-check tests, and graceful-shutdown tests.

Initial SLO targets: search p95 under 300 ms excluding third-party autocomplete, quote p95 under 500 ms, booking command p95 under 1 s excluding payment-provider latency, 99.9% API availability, and zero oversold unit inventory.

## 9. Recommended first implementation backlog

1. Write ADRs for Nest/Go boundaries, REST versus existing GraphQL migration, Kafka topic/event conventions, Redis key/expiry conventions, maps, auth, and Stripe Connect.
2. Upgrade the current dependency baseline, introduce TypeORM, migrate existing tables and repositories away from Prisma, and make tests/builds reliable before domain expansion.
3. Introduce organisation membership and permission-based auth; remove role assumptions tied to one-to-one profile tables.
4. Migrate `Garage`/`Slot` toward `Listing`/`ParkingSpace` behind compatibility adapters.
5. Replace float prices with minor-unit money and introduce tariff/quote snapshots.
6. Implement availability rules, exceptions, holds, and concurrency-safe reservation.
7. Rebuild the public search, detail, checkout, and booking-management journey.
8. Rebuild admin navigation and ship user, listing, booking, finance, and audit modules alongside the core journey.
9. Add provider onboarding, calendar, earnings, ledger, and Stripe Connect payouts.
10. Add the outbox and Go search service after the transactional model is stable.

## 10. Explicit non-goals for the first release

- Copying YourParkingSpace branding, protected text, photos, proprietary data, or pixel-identical presentation.
- Native iOS/Android applications; deliver an excellent responsive/PWA-capable web experience first.
- Unbounded service splitting beyond the defined business capabilities.
- A machine-learning pricing engine before sufficient clean booking and occupancy data exists.
- Unvalidated hardware integrations for barriers, ANPR, chargers, or pay stations.
