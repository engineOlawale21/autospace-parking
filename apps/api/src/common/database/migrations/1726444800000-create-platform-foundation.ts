import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreatePlatformFoundation1726444800000
  implements MigrationInterface
{
  name = 'CreatePlatformFoundation1726444800000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS postgis')
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS pgcrypto')
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "platform_outbox_events" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "aggregate_type" varchar(100) NOT NULL,
        "aggregate_id" varchar(255) NOT NULL,
        "event_type" varchar(200) NOT NULL,
        "event_version" integer NOT NULL DEFAULT 1,
        "payload" jsonb NOT NULL,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "occurred_at" timestamptz NOT NULL DEFAULT now(),
        "published_at" timestamptz,
        "attempts" integer NOT NULL DEFAULT 0,
        "last_error" text,
        CONSTRAINT "PK_platform_outbox_events" PRIMARY KEY ("id")
      )
    `)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_platform_outbox_unpublished"
      ON "platform_outbox_events" ("occurred_at", "id")
      WHERE "published_at" IS NULL
    `)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_platform_outbox_aggregate"
      ON "platform_outbox_events" ("aggregate_type", "aggregate_id", "occurred_at")
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "platform_outbox_events"')
  }
}
