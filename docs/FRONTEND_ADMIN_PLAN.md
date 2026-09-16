# Frontend redesign and admin feature plan

## Purpose

Design an original Autospace marketplace informed by the breadth of mature
parking platforms, without copying third-party branding, copy, imagery,
proprietary data, or pixel-level presentation. This plan connects every public
or provider feature to the admin capability required to operate it.

The reference review covered public homepage/navigation, driver guidance,
provider acquisition, search/location pages, monthly inventory, SEO content,
support, and advertised commercial products. Authenticated checkout, provider,
and internal admin screens were not available for direct inspection; those
flows are planned from public behaviour and marketplace operating needs.

## Product principles

1. Search is the primary action; marketing content supports rather than hides it.
2. Prices, restrictions, cancellation terms, and access expectations are clear before checkout.
3. Hourly/daily, monthly, airport, and event products share a coherent design but expose product-specific fields.
4. Mobile map/list switching is first-class, not a compressed desktop layout.
5. Protected addresses/access instructions appear only at the correct booking stage.
6. Provider onboarding explains effort, expected earnings, safety, and payout timing before registration.
7. Every customer/provider capability includes admin inspection, intervention, and audit.
8. Accessibility, performance, SEO, analytics, and error recovery are acceptance criteria, not later polish.

## Information architecture

### Public and driver application

```text
Home
├── Search
│   ├── Hourly / daily
│   ├── Monthly
│   ├── Airport
│   └── Event
├── Results (map + list)
├── Space details
├── Checkout
├── Confirmation
├── Account
│   ├── Upcoming / active / past bookings
│   ├── Monthly subscriptions
│   ├── Vehicles
│   ├── Payment methods
│   ├── Favourites
│   ├── Reviews
│   └── Profile, security, notifications
├── Locations and points of interest
├── How it works / guarantees / safety
├── Help and contact
└── List a space / commercial solutions
```

### Provider application

```text
Overview
├── Listing onboarding wizard
├── Listings and publication status
├── Availability calendar and exceptions
├── Tariffs and pricing guidance
├── Bookings and customer details
├── Earnings, ledger, payouts, statements
├── Reviews and responses
├── Performance and occupancy
├── Organisation, sites, staff, roles
└── Support and account settings
```

### Admin application

```text
Command centre
├── Users and organisations
├── Listings and moderation
├── Inventory, availability and pricing
├── Bookings and subscriptions
├── Payments, ledger, refunds and payouts
├── Support, incidents, risk and disputes
├── Reviews and content moderation
├── CMS, SEO, POIs and events
├── Promotions, referrals and fleet accounts
├── Notifications and delivery
├── Kafka, webhooks, jobs and integrations
├── Configuration and feature flags
└── Audit and compliance
```

## Customer frontend redesign

### 1. Global shell and navigation

- Original Autospace visual system with consistent typography, spacing, colour, icons, imagery, and motion.
- Desktop mega-navigation for how it works, parking types, popular destinations, providers, commercial solutions, and help.
- Compact mobile navigation with persistent search and booking access.
- Authentication-aware actions: search, bookings, favourites, list a space, organisation switcher, and admin context where applicable.
- Global service banner for incidents or important parking/travel notices.
- Complete footer with location taxonomy, help, company, legal, accessibility, privacy choices, and social/app links.

### 2. Homepage

- Above-the-fold search with hourly/daily, monthly, and airport modes.
- Destination autocomplete supporting addresses, venues, stations, airports, POIs, postcodes, and location IDs.
- Arrival/departure controls that enforce valid ranges and listing-local timezone semantics.
- Trust layer: availability promise, secure checkout, cancellation summary, verified inventory, and authentic review evidence.
- Popular/recent destinations and personalised recent searches when consent permits.
- Three-step booking explanation.
- Provider acquisition block with earnings estimator and listing CTA.
- Commercial operator section for pre-book, cashless/on-demand, analytics, and multi-site management.
- Location/category discovery and editorial content without overwhelming the primary search journey.

### 3. Search results

- Split list/map desktop layout; full-screen list/map toggle on mobile.
- Sticky editable search summary.
- Listing cards with image, name/approximate address, rating/count, walking/driving distance, availability/guarantee, amenities, cancellation, product type, original/final price, and fee-inclusive total.
- Sort by recommended, price, distance, rating, and availability confidence.
- Filters: price, distance, covered, CCTV, EV charging, accessible, gated, staffed, height/vehicle limits, instant book, cancellation, access method, operator/space type, and monthly schedule.
- Map clusters, viewport search, selected-card synchronization, and accessible non-map alternative.
- Save/favourite, compare (later), pagination/infinite loading, graceful empty state, nearby-date suggestions, and recovery from changed availability.
- Explain ranking/sponsored placement and never present an indicative price as a confirmed quote.

### 4. Space detail

- Responsive image gallery with meaningful alt text and moderation status.
- Exact or approximate map policy based on booking state.
- Product/date selector and sticky quote card.
- Amenities, restrictions, vehicle dimensions, operating hours, entry/exit rules, cancellation policy, and accessibility information.
- Sanitised pre-book access summary; protected instructions only after eligible confirmation.
- Verified reviews, provider response, rating dimensions, and review filters.
- Nearby destination/walking information and alternative spaces.
- Clear fee/tax breakdown and quote expiry.

### 5. Checkout and confirmation

- Minimal step flow: account/contact -> vehicle/product details -> payment/review.
- Guest checkout policy with post-purchase account claim if allowed.
- Vehicle selection, flight information for airport products, promo code, invoice details, terms, and cancellation acknowledgement.
- Stripe SCA, saved payment methods, idempotent submission, recovery after redirect/refresh, and explicit failure states.
- Confirmation with receipt, calendar entry, directions, protected access instructions, support entry point, and notification status.

### 6. Driver account

- Upcoming, active, cancelled, and past bookings with product-specific actions.
- Extend/amend/rebook when availability and policy allow.
- Cancellation/refund estimator before confirmation.
- Monthly subscription renewal, notice, arrears, and payment recovery.
- Vehicles, favourites, reviews, receipts/invoices, security/sessions, privacy export/deletion, and notification preferences.
- Active-booking assistance optimized for arrival problems and unavailable-space incidents.

### 7. Location, POI, and SEO pages

- Templates for towns/cities, airports, stations, stadiums, hospitals, universities, ports, hotels, shopping centres, streets, and events.
- Search inventory plus original useful content, real availability-derived statistics, price bands, nearby transport/attractions/events, FAQs, and reviews.
- Canonical URLs, breadcrumbs, structured data, sitemap membership, redirects, pagination rules, and thin/duplicate-content prevention.

## Provider frontend redesign

### Acquisition and onboarding

- Provider landing page, earnings estimator, safety/insurance explanation, pricing/payout explanation, and FAQ.
- Progressive listing wizard: ownership/authority, address/map pin, space/capacity, photos, amenities, restrictions, access, availability, tariffs, policies, preview, identity/business verification, and submission.
- Autosave, resumability, clear validation, and readiness score.

### Provider operations

- Dashboard with today's arrivals, occupancy, action items, revenue, review trend, listing health, and payout status.
- Calendar with recurring rules, exceptions, blackout dates, event overrides, and bulk editing.
- Hourly/daily/monthly tariffs, recommended ranges, promotion participation, and quote preview.
- Booking/customer detail with privacy limits, communication/support escalation, incident reporting, and cancellation workflow.
- Earnings ledger, fees, refunds, reserves, statements, Stripe Connect status, payout schedule/failures, and tax export.
- Commercial portfolio hierarchy, staff roles, bulk import, site/capacity control, and analytics.

## Admin dashboard redesign

### 1. Command centre

- Marketplace KPIs: searches, quote conversion, bookings, GMV, net revenue, occupancy, cancellations, refunds, failed payments, payout liability, support SLA, and fraud/risk alerts.
- Live operational feed for booking, payment, provider, Kafka, webhook, and availability incidents.
- Filters by time, geography, product, platform, operator, and listing.
- Saved views and role-specific dashboards for operations, support, finance, content, risk, and super-admin.

### 2. User and organisation administration

- Global search by user, email, phone, vehicle, organisation, booking, payment, or listing.
- Unified timeline with roles, memberships, verification, sessions, bookings, payments, cases, notes, risk flags, and audit events.
- Suspend/reactivate, revoke sessions, verify contact information, manage roles, and controlled account merge.
- Organisation ownership, staff invitations, RBAC, sites, contracts, commission plan, and billing settings.
- Read-only support preview rather than unrestricted impersonation; any elevated impersonation requires reason, approval, expiry, and audit.

### 3. Listings and moderation

- Queues for new submissions, changes, media, map anomalies, policy violations, and periodic reverification.
- Side-by-side revision comparison, checklist, map correction, image moderation, access-safety review, approve/request changes/pause/delist.
- Availability/tariff inspector, quote simulation, capacity evidence, publication history, listing quality score, and bulk commercial tools.
- Secure access-instruction reveal with reason and audit.

### 4. Booking and subscription operations

- Searchable booking timeline across booking, availability hold, payment, notifications, and service calls.
- Amend/rebook, capacity reassignment, cancellation, full/partial refund, goodwill credit, confirmation resend, and incident handling.
- Monthly renewal, notice period, arrears, plan changes, and termination.
- Airport flight/transfer operations and event-specific traffic/capacity controls.
- Every intervention shows eligibility, financial impact, downstream effects, confirmation step, reason, and audit record.

### 5. Finance and payouts

- Payment intent and webhook state, immutable double-entry ledger, fees, taxes, refunds, disputes/chargebacks, reserves, provider balances, payouts, invoices, and reconciliation.
- Payout hold/release/retry, adjustment through balanced entries only, evidence attachments, CSV export, and accounting periods.
- Dual approval for high-value refunds, manual credits, payout release, and commission changes.
- Reconciliation exception queue between bookings, ledger, Stripe, and bank/payout reports.

### 6. Support, trust, and safety

- Omnichannel case queue linked to customer, provider, listing, booking, payment, and incident.
- Assignment, priority, SLA, internal notes, templates, attachments, escalation, resolution taxonomy, and satisfaction score.
- Unavailable-space, access failure, damage, unsafe location, fraud, abuse, and chargeback playbooks.
- Review moderation, provider responses, risk rules/flags, blocked identities/vehicles/payment fingerprints, and decision history.

### 7. CMS, SEO, and growth

- Page and article editor with draft, preview, scheduling, approval, version history, rollback, and localization readiness.
- Location/POI/event records, metadata, canonical URL, structured data, redirects, navigation/footer, sitemap status, and search preview.
- Promotions/referrals with eligibility, budget, caps, stacking policy, fraud protection, attribution, and redemption analytics.
- Featured inventory and sponsored placement with disclosure and time-bounded scheduling.

### 8. Platform operations

- Service health, gRPC latency/errors/circuit state, Kafka lag/retry/dead-letter queues, Redis health, database migration status, job queues, webhook delivery, and third-party integration state.
- Safe replay/retry tools with dry run, scope, idempotency checks, permissions, and audit.
- Feature flags, validated configuration, incident banners, notification templates/delivery, and data privacy requests.
- No arbitrary production SQL or unrestricted configuration mutation in the admin UI.

## Feature-to-admin parity matrix

| Product feature | Required admin capability |
|---|---|
| Search/ranking | Query diagnostics, suppressed/featured inventory, ranking explanation, projection lag/rebuild |
| Listing onboarding | Verification/moderation queue, revision comparison, feedback, publication control |
| Availability and holds | Calendar inspector, capacity evidence, hold lookup/release with safeguards |
| Tariffs and quotes | Rule viewer, quote simulation/explanation, version history, controlled override |
| Checkout/payment | Payment/webhook timeline, retry/reconciliation, secure refund controls |
| Booking management | Amend/cancel/rebook/refund, incident flow, notification resend, audit |
| Monthly subscription | Renewal, notice, arrears, termination, payment recovery |
| Airport/event products | Flight/transfer view, event inventory/pricing, disruption controls |
| Reviews | Moderation, provider response oversight, abuse reporting |
| Provider earnings | Ledger, reserves, statements, payout hold/retry, reconciliation |
| SEO/location pages | CMS, POI/event data, metadata, redirects, sitemap and structured-data status |
| Promotions/referrals | Rules, caps, eligibility, fraud review, redemption analytics |
| Support | Case queue, SLA, linked entities, templates, escalation, outcome taxonomy |

## Recommended differentiators

These add value beyond baseline feature parity:

1. **Transparent quote explanation:** show exactly why a price changed and retain the rule version for support/admin.
2. **Arrival confidence score:** combine provider reliability, recent successful arrivals, instruction quality, access complexity, and availability confidence.
3. **Accessibility-first inventory:** structured accessible-bay, route, surface, lighting, step-free, and assistance details—not a generic amenity checkbox.
4. **Safer arrival mode:** offline-capable directions/instructions, one-tap issue categories, and rapid alternative-space assistance.
5. **Provider listing health:** actionable completeness, pricing, availability, photo, response, cancellation, and review signals.
6. **Demand-aware calendar:** explain expected demand around events while keeping providers in control of prices and availability.
7. **Fleet controls:** driver groups, policy, cost centres, approvals, consolidated invoices, emissions/distance reporting, and fraud limits.
8. **Operational truth timeline:** one correlated view across gRPC calls, Kafka events, webhooks, notifications, holds, payments, and admin actions.

## Prioritization

### P0 — closed marketplace beta

- Responsive design system and global shell.
- Hourly/daily homepage search, results map/list, filters, listing detail, authoritative quote, checkout, confirmation, and driver bookings.
- Provider listing wizard, photos, availability, tariffs, booking calendar, basic earnings.
- Admin users, organisations, listing moderation, bookings, payment/refund, provider verification, audit, and basic support cases.
- Service health, webhook failures, Kafka dead letters, feature flags, and incident banner.

### P1 — public launch readiness

- Monthly parking, subscriptions, notices, payout ledger/Stripe Connect, provider statements.
- Reviews, favourites, cancellation/refund self-service, notification preferences.
- Location/POI pages, CMS, technical SEO, redirects, sitemap, and structured data.
- Finance reconciliation, disputes, payout operations, risk flags, review moderation, and richer support tooling.
- Accessibility audit, performance budgets, analytics taxonomy, disaster recovery, and security testing.

### P2 — product expansion

- Airport and event products, flight/transfer information, event pricing/capacity.
- Fleet/business accounts, consolidated billing, policies, and reporting.
- Cashless/on-demand sessions, EV charging metadata/integration, commercial analytics, and multi-site bulk controls.
- Promotions/referrals, provider pricing recommendations, arrival confidence, demand calendar, and experimentation.

### Later, only after validation

- Native mobile applications.
- ANPR/barrier/charger hardware integrations.
- Automated yield pricing or ML ranking without sufficient clean data and control/audit mechanisms.
- Additional microservices without clear ownership, scale, deployment, or reliability justification.

## Design and delivery sequence

1. Confirm launch geography, currencies, taxes, product types, cancellation rules, provider fees, and payout model.
2. Map current routes/components against this information architecture and identify reusable UI.
3. Establish tokens, typography, grid, forms, navigation, feedback, data-table, map, and responsive patterns.
4. Produce low-fidelity flows for driver search-to-book, provider list-to-payout, support intervention, and finance reconciliation.
5. Prototype and usability-test the highest-risk steps: search/date entry, result comparison, access/restrictions, checkout, and provider availability.
6. Build P0 as vertical slices; each slice includes frontend, owning Go/NestJS services, invocation/event contracts, admin controls, telemetry, and tests.
7. Run closed beta with real inventory and support observation before expanding SEO acquisition or advanced products.

## P0 acceptance metrics

- Search-to-result success and zero-result recovery.
- Result-to-detail and detail-to-checkout conversion.
- Quote mismatch and expired-quote rate.
- Checkout completion and duplicate-charge rate.
- Oversold/unavailable-space incidents.
- Provider onboarding completion and time to approved listing.
- Listing moderation age and support first-response/resolution time.
- Refund, payment failure, payout failure, Kafka dead-letter, and service invocation error rates.
- WCAG 2.2 AA critical issues, Core Web Vitals, and mobile task completion.
