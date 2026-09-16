# Valet web

Next.js operational interface for valets and on-site staff. It presents
assigned pickup/return trips and booking status actions for products where
valet service is enabled.

Local URL: `http://localhost:3003`

```bash
docker compose --env-file .env.docker up --build web-valet
```

Location and booking access must be limited to active assignments. Status
transitions are server-authorized and added to the booking audit timeline.
