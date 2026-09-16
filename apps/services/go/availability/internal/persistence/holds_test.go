package persistence

import (
	"context"
	"database/sql"
	"testing"
)

func TestNewHoldRepositoryRequiresDatabase(t *testing.T) {
	repository := NewHoldRepository(&sql.DB{})
	if repository == nil || repository.db == nil {
		t.Fatal("expected repository to retain database handle")
	}
	_ = context.Background()
}
