package grpcapi

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"time"

	"github.com/autospace/availability-service/internal/application"
	"github.com/autospace/availability-service/internal/domain"
	"github.com/autospace/availability-service/internal/persistence"
	availabilityv1 "github.com/autospace/contracts/gen/go/autospace/availability/v1"
	commonv1 "github.com/autospace/contracts/gen/go/autospace/common/v1"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type Service struct {
	availabilityv1.UnimplementedAvailabilityServiceServer
	repository *persistence.HoldRepository
	holds      *application.HoldService
	now        func() time.Time
}

func NewService(repository *persistence.HoldRepository, holds *application.HoldService) *Service {
	return &Service{repository: repository, holds: holds, now: time.Now}
}

func (service Service) GetQuote(ctx context.Context, request *availabilityv1.GetQuoteRequest) (*availabilityv1.GetQuoteResponse, error) {
	if service.repository == nil || request == nil || request.GetListingId() == "" || request.GetParkingSpaceId() == "" || request.GetCustomerId() == "" {
		return nil, status.Error(codes.InvalidArgument, "listing_id, parking_space_id, and customer_id are required")
	}
	rangeValue := request.GetTimeRange()
	if rangeValue == nil || rangeValue.GetStartsAtUnixMs() <= 0 || rangeValue.GetEndsAtUnixMs() <= rangeValue.GetStartsAtUnixMs() {
		return nil, status.Error(codes.InvalidArgument, "a valid time_range is required")
	}
	now := service.now()
	quote := persistence.Quote{
		ID: newID("quote"), ListingID: request.GetListingId(), ParkingSpaceID: request.GetParkingSpaceId(),
		CustomerID: request.GetCustomerId(), StartsAt: time.UnixMilli(rangeValue.GetStartsAtUnixMs()),
		EndsAt: time.UnixMilli(rangeValue.GetEndsAtUnixMs()), ExpiresAt: now.Add(5 * time.Minute),
		TotalMinorUnits: 1000, Currency: "GBP",
	}
	if err := service.repository.CreateQuote(ctx, quote); err != nil {
		return nil, status.Error(codes.Internal, "persist quote")
	}
	return &availabilityv1.GetQuoteResponse{
		QuoteId: quote.ID, PricingVersion: "foundation-v1", Available: true,
		Total:           &commonv1.Money{MinorUnits: quote.TotalMinorUnits, Currency: quote.Currency},
		ExpiresAtUnixMs: quote.ExpiresAt.UnixMilli(),
	}, nil
}

func (service Service) AcquireHold(ctx context.Context, request *availabilityv1.AcquireHoldRequest) (*availabilityv1.AcquireHoldResponse, error) {
	if service.holds == nil || request == nil || request.GetQuoteId() == "" || request.GetCustomerId() == "" || request.GetIdempotencyKey() == "" {
		return nil, status.Error(codes.InvalidArgument, "quote_id, customer_id, and idempotency_key are required")
	}
	quote, err := service.repository.FindQuote(ctx, request.GetQuoteId())
	if errors.Is(err, persistence.ErrQuoteNotFound) {
		return nil, status.Error(codes.NotFound, "quote not found")
	}
	if err != nil {
		return nil, status.Error(codes.Internal, "load quote")
	}
	if quote.CustomerID != request.GetCustomerId() {
		return nil, status.Error(codes.PermissionDenied, "quote customer mismatch")
	}
	hold, err := service.holds.Acquire(ctx, domain.Hold{
		ID: newID("hold"), QuoteID: quote.ID, CustomerID: quote.CustomerID,
		ParkingSpaceID: quote.ParkingSpaceID, ExpiresAt: quote.ExpiresAt, IdempotencyKey: request.GetIdempotencyKey(),
	})
	if errors.Is(err, domain.ErrHoldExpired) {
		return nil, status.Error(codes.FailedPrecondition, "quote expired")
	}
	if err != nil {
		return nil, status.Error(codes.Internal, "acquire hold")
	}
	return &availabilityv1.AcquireHoldResponse{HoldId: hold.ID, QuoteId: hold.QuoteID, ExpiresAtUnixMs: hold.ExpiresAt.UnixMilli(), Status: string(hold.Status)}, nil
}

func (service Service) ConfirmHold(ctx context.Context, request *availabilityv1.ConfirmHoldRequest) (*availabilityv1.ConfirmHoldResponse, error) {
	if service.holds == nil || request == nil || request.GetHoldId() == "" || request.GetBookingId() == "" || request.GetIdempotencyKey() == "" {
		return nil, status.Error(codes.InvalidArgument, "hold_id, booking_id, and idempotency_key are required")
	}
	hold, err := service.holds.Confirm(ctx, request.GetHoldId(), request.GetBookingId())
	if err != nil {
		return nil, domainError(err)
	}
	return &availabilityv1.ConfirmHoldResponse{HoldId: hold.ID, Status: string(hold.Status)}, nil
}

func (service Service) ReleaseHold(ctx context.Context, request *availabilityv1.ReleaseHoldRequest) (*availabilityv1.ReleaseHoldResponse, error) {
	if service.holds == nil || request == nil || request.GetHoldId() == "" || request.GetReasonCode() == "" || request.GetIdempotencyKey() == "" {
		return nil, status.Error(codes.InvalidArgument, "hold_id, reason_code, and idempotency_key are required")
	}
	hold, err := service.holds.Release(ctx, request.GetHoldId(), request.GetReasonCode())
	if err != nil {
		return nil, domainError(err)
	}
	return &availabilityv1.ReleaseHoldResponse{HoldId: hold.ID, Status: string(hold.Status)}, nil
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

func newID(prefix string) string {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		panic(err)
	}
	return prefix + "_" + hex.EncodeToString(bytes)
}

func domainError(err error) error {
	switch {
	case errors.Is(err, persistence.ErrHoldNotFound):
		return status.Error(codes.NotFound, "hold not found")
	case errors.Is(err, domain.ErrHoldExpired), errors.Is(err, domain.ErrHoldNotActive):
		return status.Error(codes.FailedPrecondition, err.Error())
	default:
		return status.Error(codes.Internal, "hold operation failed")
	}
}
