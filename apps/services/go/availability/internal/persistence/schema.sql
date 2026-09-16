CREATE TABLE IF NOT EXISTS availability_holds (
    id TEXT PRIMARY KEY,
    quote_id TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    parking_space_id TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL,
    booking_id TEXT,
    release_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT availability_holds_status_check CHECK (
        status IN ('ACTIVE', 'CONFIRMED', 'RELEASED', 'EXPIRED')
    )
);

CREATE INDEX IF NOT EXISTS idx_availability_holds_space_window
    ON availability_holds (parking_space_id, expires_at);

CREATE INDEX IF NOT EXISTS idx_availability_holds_status
    ON availability_holds (status);
