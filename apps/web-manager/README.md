# Provider and manager web

Next.js portal for individual hosts and commercial parking operators. It is
currently named `web-manager`; the target product calls this the provider
portal and may rename the directory after migration stabilizes.

Current capabilities include company/garage creation, booking management, and
valet management. The target includes listing onboarding, availability,
tariffs, portfolio management, earnings, statements, and payouts.

Local URL: `http://localhost:3002`

```bash
docker compose --env-file .env.docker up --build web-manager
```
