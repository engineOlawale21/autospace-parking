package domain

import (
	"errors"
	"testing"
	"time"
)

func activeHold(now time.Time) Hold {
	return Hold{
		ID:        "hold-1",
		QuoteID:   "quote-1",
		ExpiresAt: now.Add(10 * time.Minute),
		Status:    HoldStatusActive,
	}
}

func TestConfirmActiveHold(t *testing.T) {
	now := time.Now().UTC()
	hold := activeHold(now)

	if err := hold.Confirm(now, "booking-1"); err != nil {
		t.Fatalf("confirm hold: %v", err)
	}
	if hold.Status != HoldStatusConfirmed {
		t.Fatalf("expected %s, got %s", HoldStatusConfirmed, hold.Status)
	}
	if hold.BookingID != "booking-1" {
		t.Fatalf("expected booking ID to be retained")
	}
}

func TestCannotConfirmExpiredHold(t *testing.T) {
	now := time.Now().UTC()
	hold := activeHold(now)
	hold.ExpiresAt = now

	err := hold.Confirm(now, "booking-1")
	if !errors.Is(err, ErrHoldExpired) {
		t.Fatalf("expected ErrHoldExpired, got %v", err)
	}
	if hold.Status != HoldStatusExpired {
		t.Fatalf("expected expired state, got %s", hold.Status)
	}
}

func TestCannotReleaseConfirmedHold(t *testing.T) {
	now := time.Now().UTC()
	hold := activeHold(now)
	if err := hold.Confirm(now, "booking-1"); err != nil {
		t.Fatalf("confirm hold: %v", err)
	}

	if err := hold.Release(now, "customer_cancelled"); !errors.Is(err, ErrHoldNotActive) {
		t.Fatalf("expected ErrHoldNotActive, got %v", err)
	}
}
