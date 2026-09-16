# Driver and public web

Next.js application for the public Autospace marketplace and driver account.
Its target journeys are destination search, map/list results, listing details,
quotes, checkout, booking management, vehicles, reviews, and support.

Local URL: `http://localhost:3001`

```bash
docker compose --env-file .env.docker up --build web
```

The application uses shared UI from `libs/ui` and network clients from
`libs/network`. Public environment variables are visible in browser bundles;
never place secrets in a `NEXT_PUBLIC_*` variable.
