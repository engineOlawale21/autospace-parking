package coordination

import (
	"context"
	"errors"
	"time"

	"github.com/redis/go-redis/v9"
)

var ErrHoldAlreadyCoordinated = errors.New("hold is already coordinated")

type HoldCoordinator struct {
	client *redis.Client
	prefix string
}

func NewHoldCoordinator(client *redis.Client, environment string) *HoldCoordinator {
	if environment == "" {
		environment = "development"
	}
	return &HoldCoordinator{client: client, prefix: environment + ":availability:hold:"}
}

func (coordinator *HoldCoordinator) Acquire(ctx context.Context, holdID string, expiresAt time.Time) error {
	ttl := time.Until(expiresAt)
	if ttl <= 0 {
		return errors.New("hold expiry must be in the future")
	}

	created, err := coordinator.client.SetNX(ctx, coordinator.key(holdID), "1", ttl).Result()
	if err != nil {
		return err
	}
	if !created {
		return ErrHoldAlreadyCoordinated
	}
	return nil
}

func (coordinator *HoldCoordinator) Release(ctx context.Context, holdID string) error {
	return coordinator.client.Del(ctx, coordinator.key(holdID)).Err()
}

func (coordinator *HoldCoordinator) key(holdID string) string {
	return coordinator.prefix + holdID
}
