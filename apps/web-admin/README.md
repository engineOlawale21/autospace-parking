# Admin web

Next.js internal operations console for marketplace administration. The
current implementation supports initial administrator and garage-verification
flows; the roadmap adds users, organisations, listings, bookings, finance,
support, risk, CMS, Kafka operations, and audit tooling.

Local URL: `http://localhost:3004`

```bash
docker compose --env-file .env.docker up --build web-admin
```

Admin UI visibility is not authorization. Every privileged operation must also
be permission-checked and audited by the API.
