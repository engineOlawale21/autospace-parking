package coordination

import (
	"testing"

	"github.com/redis/go-redis/v9"
)

func TestNewHoldCoordinatorUsesEnvironmentNamespace(t *testing.T) {
	coordinator := NewHoldCoordinator(redis.NewClient(&redis.Options{}), "test")
	if coordinator.key("hold-1") != "test:availability:hold:hold-1" {
		t.Fatalf("unexpected hold key: %s", coordinator.key("hold-1"))
	}
}
