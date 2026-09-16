package persistence

import (
	"context"
	"database/sql"
	_ "embed"
	"encoding/json"
	"errors"
	"time"

	"github.com/autospace/availability-service/internal/domain"
)

var ErrHoldNotFound = errors.New("hold not found")
var ErrQuoteNotFound = errors.New("quote not found")

//go:embed schema.sql
var schema string

type Quote struct {
	ID              string
	ListingID       string
	ParkingSpaceID  string
	CustomerID      string
	StartsAt        time.Time
	EndsAt          time.Time
	ExpiresAt       time.Time
	TotalMinorUnits int64
	Currency        string
}

type HoldRepository struct {
	db *sql.DB
}

func NewHoldRepository(db *sql.DB) *HoldRepository {
	return &HoldRepository{db: db}
}

func ApplySchema(ctx context.Context, db *sql.DB) error {
	_, err := db.ExecContext(ctx, schema)
	return err
}

func (repository *HoldRepository) CreateQuote(ctx context.Context, quote Quote) error {
	_, err := repository.db.ExecContext(ctx, `
		INSERT INTO availability_quotes
			(id, listing_id, parking_space_id, customer_id, starts_at, ends_at, expires_at, total_minor_units, currency)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`, quote.ID, quote.ListingID, quote.ParkingSpaceID, quote.CustomerID, quote.StartsAt,
		quote.EndsAt, quote.ExpiresAt, quote.TotalMinorUnits, quote.Currency)
	return err
}

func (repository *HoldRepository) FindQuote(ctx context.Context, id string) (Quote, error) {
	var quote Quote
	err := repository.db.QueryRowContext(ctx, `
		SELECT id, listing_id, parking_space_id, customer_id, starts_at, ends_at,
			expires_at, total_minor_units, currency
		FROM availability_quotes WHERE id = $1
	`, id).Scan(&quote.ID, &quote.ListingID, &quote.ParkingSpaceID, &quote.CustomerID,
		&quote.StartsAt, &quote.EndsAt, &quote.ExpiresAt, &quote.TotalMinorUnits, &quote.Currency)
	if errors.Is(err, sql.ErrNoRows) {
		return Quote{}, ErrQuoteNotFound
	}
	return quote, err
}

func (repository *HoldRepository) Create(ctx context.Context, hold domain.Hold) error {
	return repository.CreateWithEvent(ctx, hold, "availability.hold.acquired.v1")
}

func (repository *HoldRepository) CreateWithEvent(ctx context.Context, hold domain.Hold, eventType string) error {
	tx, err := repository.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.ExecContext(ctx, `
		INSERT INTO availability_holds
			(id, quote_id, customer_id, parking_space_id, expires_at, status, booking_id, release_reason, idempotency_key)
		VALUES ($1, $2, $3, $4, $5, $6, NULLIF($7, ''), NULLIF($8, ''), $9)
	`, hold.ID, hold.QuoteID, hold.CustomerID, hold.ParkingSpaceID, hold.ExpiresAt,
		hold.Status, hold.BookingID, hold.ReleaseReason, hold.IdempotencyKey)
	if err != nil {
		return err
	}

	payload, err := json.Marshal(map[string]any{
		"holdId": hold.ID, "quoteId": hold.QuoteID, "customerId": hold.CustomerID,
		"parkingSpaceId": hold.ParkingSpaceID, "expiresAt": hold.ExpiresAt.UTC().Format(time.RFC3339Nano),
	})
	if err != nil {
		return err
	}
	metadata, _ := json.Marshal(map[string]string{"topic": "availability.hold-events.v1"})
	_, err = tx.ExecContext(ctx, `
		INSERT INTO platform_outbox_events
			(aggregate_type, aggregate_id, event_type, payload, metadata)
		VALUES ('availability_hold', $1, $2, $3, $4)
	`, hold.ID, eventType, payload, metadata)
	if err != nil {
		return err
	}
	return tx.Commit()
}

func (repository *HoldRepository) FindByID(ctx context.Context, id string) (domain.Hold, error) {
	var hold domain.Hold
	var status string
	var bookingID, releaseReason sql.NullString

	err := repository.db.QueryRowContext(ctx, `
		SELECT id, quote_id, customer_id, parking_space_id, expires_at, status, booking_id, release_reason, idempotency_key
		FROM availability_holds
		WHERE id = $1
	`, id).Scan(
		&hold.ID,
		&hold.QuoteID,
		&hold.CustomerID,
		&hold.ParkingSpaceID,
		&hold.ExpiresAt,
		&status,
		&bookingID,
		&releaseReason,
		&hold.IdempotencyKey,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return domain.Hold{}, ErrHoldNotFound
	}
	if err != nil {
		return domain.Hold{}, err
	}

	hold.Status = domain.HoldStatus(status)
	hold.BookingID = bookingID.String
	hold.ReleaseReason = releaseReason.String
	return hold, nil
}

func (repository *HoldRepository) FindByIdempotencyKey(ctx context.Context, customerID, key string) (domain.Hold, error) {
	var id string
	err := repository.db.QueryRowContext(ctx, `
		SELECT id FROM availability_holds WHERE customer_id = $1 AND idempotency_key = $2
	`, customerID, key).Scan(&id)
	if errors.Is(err, sql.ErrNoRows) {
		return domain.Hold{}, ErrHoldNotFound
	}
	if err != nil {
		return domain.Hold{}, err
	}
	return repository.FindByID(ctx, id)
}

func (repository *HoldRepository) Update(ctx context.Context, hold domain.Hold) error {
	result, err := repository.db.ExecContext(ctx, `
		UPDATE availability_holds
		SET status = $2,
			booking_id = NULLIF($3, ''),
			release_reason = NULLIF($4, ''),
			updated_at = NOW()
		WHERE id = $1
	`, hold.ID, hold.Status, hold.BookingID, hold.ReleaseReason)
	if err != nil {
		return err
	}

	count, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if count == 0 {
		return ErrHoldNotFound
	}
	return nil
}

func (repository *HoldRepository) Expire(ctx context.Context, now time.Time) (int64, error) {
	result, err := repository.db.ExecContext(ctx, `
		UPDATE availability_holds
		SET status = 'EXPIRED', updated_at = NOW()
		WHERE status = 'ACTIVE' AND expires_at <= $1
	`, now)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}
