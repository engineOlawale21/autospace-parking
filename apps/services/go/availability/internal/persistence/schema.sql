CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS availability_quotes (
    id TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL,
    parking_space_id TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    total_minor_units BIGINT NOT NULL,
    currency CHAR(3) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS availability_holds (
    id TEXT PRIMARY KEY,
    quote_id TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    parking_space_id TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL,
    booking_id TEXT,
    release_reason TEXT,
    idempotency_key TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT availability_holds_status_check CHECK (
        status IN ('ACTIVE', 'CONFIRMED', 'RELEASED', 'EXPIRED')
    )
);

ALTER TABLE availability_holds
    ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
UPDATE availability_holds
    SET idempotency_key = id
    WHERE idempotency_key IS NULL;
ALTER TABLE availability_holds
    ALTER COLUMN idempotency_key SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_availability_holds_idempotency
    ON availability_holds (customer_id, idempotency_key);

CREATE INDEX IF NOT EXISTS idx_availability_holds_space_window
    ON availability_holds (parking_space_id, expires_at);

CREATE INDEX IF NOT EXISTS idx_availability_holds_status
    ON availability_holds (status);

CREATE TABLE IF NOT EXISTS platform_outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(200) NOT NULL,
    event_version INTEGER NOT NULL DEFAULT 1,
    payload JSONB NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_platform_outbox_unpublished
    ON platform_outbox_events (occurred_at, id)
    WHERE published_at IS NULL;
