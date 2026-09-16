package domain

import (
	"errors"
	"time"
)

type HoldStatus string

const (
	HoldStatusActive    HoldStatus = "ACTIVE"
	HoldStatusConfirmed HoldStatus = "CONFIRMED"
	HoldStatusReleased  HoldStatus = "RELEASED"
	HoldStatusExpired   HoldStatus = "EXPIRED"
)

var (
	ErrHoldExpired           = errors.New("hold has expired")
	ErrHoldNotActive         = errors.New("hold is not active")
	ErrBookingIDRequired     = errors.New("booking ID is required")
	ErrReleaseReasonRequired = errors.New("release reason is required")
)

type Hold struct {
	ID             string
	QuoteID        string
	CustomerID     string
	ParkingSpaceID string
	ExpiresAt      time.Time
	Status         HoldStatus
	BookingID      string
	ReleaseReason  string
}

func (hold *Hold) EffectiveStatus(now time.Time) HoldStatus {
	if hold.Status == HoldStatusActive && !now.Before(hold.ExpiresAt) {
		return HoldStatusExpired
	}
	return hold.Status
}

func (hold *Hold) Confirm(now time.Time, bookingID string) error {
	if bookingID == "" {
		return ErrBookingIDRequired
	}
	if hold.EffectiveStatus(now) == HoldStatusExpired {
		hold.Status = HoldStatusExpired
		return ErrHoldExpired
	}
	if hold.Status != HoldStatusActive {
		return ErrHoldNotActive
	}

	hold.Status = HoldStatusConfirmed
	hold.BookingID = bookingID
	return nil
}

func (hold *Hold) Release(now time.Time, reason string) error {
	if reason == "" {
		return ErrReleaseReasonRequired
	}
	if hold.EffectiveStatus(now) == HoldStatusExpired {
		hold.Status = HoldStatusExpired
		return ErrHoldExpired
	}
	if hold.Status != HoldStatusActive {
		return ErrHoldNotActive
	}

	hold.Status = HoldStatusReleased
	hold.ReleaseReason = reason
	return nil
}
