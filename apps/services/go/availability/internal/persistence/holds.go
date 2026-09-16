package persistence

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/autospace/availability-service/internal/domain"
)

var ErrHoldNotFound = errors.New("hold not found")

type HoldRepository struct {
	db *sql.DB
}

func NewHoldRepository(db *sql.DB) *HoldRepository {
	return &HoldRepository{db: db}
}

func (repository *HoldRepository) Create(ctx context.Context, hold domain.Hold) error {
	_, err := repository.db.ExecContext(ctx, `
		INSERT INTO availability_holds
			(id, quote_id, customer_id, parking_space_id, expires_at, status, booking_id, release_reason)
		VALUES ($1, $2, $3, $4, $5, $6, NULLIF($7, ''), NULLIF($8, ''))
	`, hold.ID, hold.QuoteID, hold.CustomerID, hold.ParkingSpaceID, hold.ExpiresAt,
		hold.Status, hold.BookingID, hold.ReleaseReason)
	return err
}

func (repository *HoldRepository) FindByID(ctx context.Context, id string) (domain.Hold, error) {
	var hold domain.Hold
	var status string
	var bookingID, releaseReason sql.NullString

	err := repository.db.QueryRowContext(ctx, `
		SELECT id, quote_id, customer_id, parking_space_id, expires_at, status, booking_id, release_reason
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
