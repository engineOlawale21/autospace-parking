# Configuration reference

Copy `.env.docker.example` to `.env.docker` for local Compose. Never commit the
resulting file. Defaults are for isolated local development, not production.

## Database

| Variable | Used by | Meaning |
|---|---|---|
| `POSTGRES_DB` | Compose/PostgreSQL | Local database name |
| `POSTGRES_USER` | Compose/PostgreSQL | Local database role |
| `POSTGRES_PASSWORD` | Compose/PostgreSQL | Local database password |
| `POSTGRES_PORT` | Compose | Host port mapped to PostgreSQL |
| `DATABASE_URL` | API/jobs | Full connection URL; Compose constructs it for containers |
| `DATABASE_LOGGING` | API | Enable TypeORM query logging; normally false |
| `DATABASE_POOL_MAX` | API | Maximum connections per API process |
| `DATABASE_SSL` | API | Enable database TLS outside local Compose |

Production pool sizing must account for every API/worker replica and leave
headroom for migrations, operations, and managed-service limits.

## Kafka and Redis

| Variable | Used by | Meaning |
|---|---|---|
| `KAFKA_PORT` | Compose | Host Kafka listener port |
| `KAFKA_BROKERS` | API/Go/workers | Comma-separated internal broker list |
| `REDIS_PORT` | Compose | Host Redis port |
| `REDIS_URL` | API/Go/workers | Redis connection URL |

Local Compose uses plaintext internal networking. Shared environments require
authenticated, encrypted connections with secrets supplied by the runtime.

## Object storage

| Variable | Used by | Meaning |
|---|---|---|
| `MINIO_ROOT_USER` | MinIO | Local administrative access key |
| `MINIO_ROOT_PASSWORD` | MinIO | Local administrative secret |
| `MINIO_API_PORT` | Compose | Host S3-compatible API port |
| `MINIO_CONSOLE_PORT` | Compose | Host console port |
| `S3_ENDPOINT` | API/workers | S3-compatible endpoint |

Production applications use scoped bucket credentials, never root storage
credentials.

## Authentication and third parties

| Variable | Exposure | Meaning |
|---|---|---|
| `JWT_SECRET` | Server secret | Signs API tokens during the legacy auth phase |
| `NEXTAUTH_SECRET` | Server secret | Protects NextAuth sessions |
| `AUTH_COOKIE_DOMAIN` | Server config | Optional shared production cookie domain; omit for localhost |
| `GOOGLE_CLIENT_ID` | Server config | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Server secret | Google OAuth secret |
| `STRIPE_SECRET_KEY` | Server secret | Stripe API credential |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Browser-safe | Stripe publishable key |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Browser-visible | Restricted public map token |
| `NEXT_PUBLIC_PROVIDER_URL` | Browser-visible | Provider onboarding URL |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Browser-visible | Legacy Cloudinary cloud name |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Browser-visible | Legacy restricted upload preset |

Every `NEXT_PUBLIC_*` value is embedded into a browser bundle. It cannot hold a
secret. Restrict public provider tokens by origin, capability, and quota.

## Configuration rules

- Validate required configuration at process startup.
- Do not substitute development credentials outside local mode.
- Inject secrets through a deployment secret store, not image layers.
- Rotate credentials without rebuilding images.
- Keep examples non-sensitive and synchronized with code.
- Document ownership, expiry, and rotation for every production secret.
