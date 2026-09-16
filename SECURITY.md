# Security policy

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Report it privately
to the repository owner or the organisation's designated security contact. If
no contact is configured, contact the repository administrator directly and
include reproduction steps, affected component, impact, and suggested fix.

## Sensitive areas

Changes involving authentication, permissions, protected parking access
instructions, payments, refunds, payouts, ledger entries, admin impersonation,
webhooks, file uploads, or personal data require explicit security review.

## Baseline requirements

- Never commit secrets or real customer data.
- Verify Stripe and other webhook signatures before processing.
- Require idempotency for booking and financial commands.
- Use least-privilege service credentials and admin permissions.
- Encrypt transport and managed storage in non-local environments.
- Keep protected access instructions unavailable until a booking is eligible.
- Audit every privileged admin action with actor, reason, target, and timestamp.
- Redact tokens, credentials, payment data, and sensitive personal data from logs.
- Scan dependencies and container images and address critical findings before release.
