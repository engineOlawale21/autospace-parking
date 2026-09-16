import { DataSourceOptions } from 'typeorm'
import { ConsumedEvent } from '../outbox/consumed-event.entity'
import { OutboxEvent } from '../outbox/outbox-event.entity'
import { CreatePlatformFoundation1726444800000 } from './migrations/1726444800000-create-platform-foundation'
import { CreateConsumedEvents1726448400000 } from './migrations/1726448400000-create-consumed-events'

export function databaseOptions(): DataSourceOptions {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required')
  }

  return {
    type: 'postgres',
    url: databaseUrl,
    entities: [OutboxEvent, ConsumedEvent],
    migrations: [
      CreatePlatformFoundation1726444800000,
      CreateConsumedEvents1726448400000,
    ],
    migrationsRun: false,
    synchronize: false,
    logging: process.env.DATABASE_LOGGING === 'true',
    applicationName: process.env.DATABASE_APPLICATION_NAME ?? 'autospace-api',
    ssl:
      process.env.DATABASE_SSL === 'true'
        ? {
            rejectUnauthorized:
              process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false',
          }
        : false,
    extra: {
      max: parsePositiveInteger(process.env.DATABASE_POOL_MAX, 20),
      connectionTimeoutMillis: parsePositiveInteger(
        process.env.DATABASE_CONNECTION_TIMEOUT_MS,
        5000,
      ),
      idleTimeoutMillis: parsePositiveInteger(
        process.env.DATABASE_IDLE_TIMEOUT_MS,
        30000,
      ),
    },
  }
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (!value) return fallback

  const parsed = Number.parseInt(value, 10)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Expected a positive integer, received "${value}"`)
  }

  return parsed
}
