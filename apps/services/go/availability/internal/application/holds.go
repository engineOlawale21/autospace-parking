package application

import (
	"context"
	"errors"
	"time"

	"github.com/autospace/availability-service/internal/domain"
	"github.com/autospace/availability-service/internal/persistence"
)

type HoldRepository interface {
	CreateWithEvent(context.Context, domain.Hold, string) error
	FindByID(context.Context, string) (domain.Hold, error)
	FindByIdempotencyKey(context.Context, string, string) (domain.Hold, error)
	Update(context.Context, domain.Hold) error
}

type HoldCoordinator interface {
	Acquire(context.Context, string, time.Time) error
	Release(context.Context, string) error
}

type HoldService struct {
	repository  HoldRepository
	coordinator HoldCoordinator
	now         func() time.Time
}

func NewHoldService(repository HoldRepository, coordinator HoldCoordinator) *HoldService {
	return &HoldService{repository: repository, coordinator: coordinator, now: time.Now}
}

func (service *HoldService) Acquire(ctx context.Context, hold domain.Hold) (domain.Hold, error) {
	if hold.IdempotencyKey == "" {
		return domain.Hold{}, errors.New("idempotency key is required")
	}
	existing, err := service.repository.FindByIdempotencyKey(ctx, hold.CustomerID, hold.IdempotencyKey)
	if err == nil {
		return existing, nil
	}
	if !errors.Is(err, persistence.ErrHoldNotFound) {
		return domain.Hold{}, err
	}
	if !service.now().Before(hold.ExpiresAt) {
		return domain.Hold{}, domain.ErrHoldExpired
	}
	hold.Status = domain.HoldStatusActive
	if err := service.repository.CreateWithEvent(ctx, hold, "availability.hold.acquired.v1"); err != nil {
		return domain.Hold{}, err
	}

	// PostgreSQL is authoritative. Redis is rebuilt from active rows after a
	// restart, so a coordination outage must not erase a committed hold.
	_ = service.coordinator.Acquire(ctx, hold.ID, hold.ExpiresAt)
	return hold, nil
}

func (service *HoldService) Confirm(ctx context.Context, holdID, bookingID string) (domain.Hold, error) {
	hold, err := service.repository.FindByID(ctx, holdID)
	if err != nil {
		return domain.Hold{}, err
	}
	if err := hold.Confirm(service.now(), bookingID); err != nil {
		return domain.Hold{}, err
	}
	if err := service.repository.Update(ctx, hold); err != nil {
		return domain.Hold{}, err
	}
	_ = service.coordinator.Release(ctx, hold.ID)
	return hold, nil
}

func (service *HoldService) Release(ctx context.Context, holdID, reason string) (domain.Hold, error) {
	hold, err := service.repository.FindByID(ctx, holdID)
	if err != nil {
		return domain.Hold{}, err
	}
	if err := hold.Release(service.now(), reason); err != nil {
		return domain.Hold{}, err
	}
	if err := service.repository.Update(ctx, hold); err != nil {
		return domain.Hold{}, err
	}
	_ = service.coordinator.Release(ctx, hold.ID)
	return hold, nil
}
