package application

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/autospace/availability-service/internal/domain"
	"github.com/autospace/availability-service/internal/persistence"
)

type memoryRepository struct {
	holds  map[string]domain.Hold
	events []string
}

func (repository *memoryRepository) CreateWithEvent(_ context.Context, hold domain.Hold, event string) error {
	repository.holds[hold.ID] = hold
	repository.events = append(repository.events, event)
	return nil
}
func (repository *memoryRepository) FindByID(_ context.Context, id string) (domain.Hold, error) {
	hold, ok := repository.holds[id]
	if !ok {
		return domain.Hold{}, persistence.ErrHoldNotFound
	}
	return hold, nil
}
func (repository *memoryRepository) FindByIdempotencyKey(_ context.Context, customerID, key string) (domain.Hold, error) {
	for _, hold := range repository.holds {
		if hold.CustomerID == customerID && hold.IdempotencyKey == key {
			return hold, nil
		}
	}
	return domain.Hold{}, persistence.ErrHoldNotFound
}
func (repository *memoryRepository) Update(_ context.Context, hold domain.Hold) error {
	repository.holds[hold.ID] = hold
	return nil
}

type memoryCoordinator struct{ acquired map[string]time.Time }

func (coordinator *memoryCoordinator) Acquire(_ context.Context, id string, expiry time.Time) error {
	coordinator.acquired[id] = expiry
	return nil
}
func (coordinator *memoryCoordinator) Release(_ context.Context, id string) error {
	delete(coordinator.acquired, id)
	return nil
}

func TestAcquireIsIdempotentAndEmitsOneEvent(t *testing.T) {
	now := time.Date(2026, 9, 16, 12, 0, 0, 0, time.UTC)
	repository := &memoryRepository{holds: map[string]domain.Hold{}}
	coordinator := &memoryCoordinator{acquired: map[string]time.Time{}}
	service := NewHoldService(repository, coordinator)
	service.now = func() time.Time { return now }
	hold := domain.Hold{ID: "hold-1", QuoteID: "quote-1", CustomerID: "customer-1", ParkingSpaceID: "space-1", ExpiresAt: now.Add(5 * time.Minute), IdempotencyKey: "request-1"}

	first, err := service.Acquire(context.Background(), hold)
	if err != nil {
		t.Fatalf("acquire hold: %v", err)
	}
	second := hold
	second.ID = "hold-2"
	second, err = service.Acquire(context.Background(), second)
	if err != nil {
		t.Fatalf("repeat acquire: %v", err)
	}
	if first.ID != second.ID || len(repository.events) != 1 {
		t.Fatalf("expected one persisted hold/event: %+v %+v", first, second)
	}
}

func TestAcquireKeepsPostgresAuthoritativeWhenRedisFails(t *testing.T) {
	now := time.Now()
	repository := &memoryRepository{holds: map[string]domain.Hold{}}
	service := NewHoldService(repository, failingCoordinator{})
	_, err := service.Acquire(context.Background(), domain.Hold{ID: "hold-1", QuoteID: "quote-1", CustomerID: "customer-1", ParkingSpaceID: "space-1", ExpiresAt: now.Add(time.Minute), IdempotencyKey: "request-1"})
	if err != nil || len(repository.holds) != 1 {
		t.Fatalf("committed hold must survive redis failure: %v", err)
	}
}

type failingCoordinator struct{}

func (failingCoordinator) Acquire(context.Context, string, time.Time) error {
	return errors.New("redis unavailable")
}
func (failingCoordinator) Release(context.Context, string) error {
	return errors.New("redis unavailable")
}
