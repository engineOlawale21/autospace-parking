package grpcapi

import (
	"context"
	"testing"

	availabilityv1 "github.com/autospace/contracts/gen/go/autospace/availability/v1"
)

func TestGetAvailabilityReturnsRequestedSpaces(t *testing.T) {
	response, err := (Service{}).GetAvailability(context.Background(), &availabilityv1.GetAvailabilityRequest{
		ParkingSpaceIds: []string{"space-1", "space-2"},
	})
	if err != nil {
		t.Fatalf("get availability: %v", err)
	}
	if len(response.GetItems()) != 2 || response.GetItems()[0].GetParkingSpaceId() != "space-1" {
		t.Fatalf("unexpected availability response: %+v", response.GetItems())
	}
}
