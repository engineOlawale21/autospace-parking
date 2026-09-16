# Shared UI library

Reusable Autospace design-system primitives, forms, composed components, and
page templates used by the Next.js applications.

Keep components accessible, responsive, and independent of a specific app's
routing or authorization where practical. Domain-specific data fetching belongs
in application/page layers or dedicated adapters; visual components receive
typed props.

Tailwind foundations and shared global styles live in this workspace. Changes
must be checked against driver, provider, valet, and admin applications because
all four consume this library.
