package grpcapi

import (
	"context"

	availabilityv1 "github.com/autospace/contracts/gen/go/autospace/availability/v1"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type Service struct {
	availabilityv1.UnimplementedAvailabilityServiceServer
}

func (service Service) GetAvailability(_ context.Context, request *availabilityv1.GetAvailabilityRequest) (*availabilityv1.GetAvailabilityResponse, error) {
	if request == nil || len(request.GetParkingSpaceIds()) == 0 {
		return nil, status.Error(codes.InvalidArgument, "parking_space_ids is required")
	}

	items := make([]*availabilityv1.AvailabilityItem, 0, len(request.GetParkingSpaceIds()))
	for _, parkingSpaceID := range request.GetParkingSpaceIds() {
		if parkingSpaceID == "" {
			return nil, status.Error(codes.InvalidArgument, "parking_space_ids cannot contain empty values")
		}
		items = append(items, &availabilityv1.AvailabilityItem{
			ParkingSpaceId:    parkingSpaceID,
			AvailableCapacity: 1,
			Available:         true,
		})
	}

	return &availabilityv1.GetAvailabilityResponse{Items: items}, nil
}
