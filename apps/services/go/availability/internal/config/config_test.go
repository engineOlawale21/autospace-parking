package config

import "testing"

func TestFromEnvDefaults(t *testing.T) {
	t.Setenv("PORT", "")
	t.Setenv("DATABASE_URL", "")
	t.Setenv("SHUTDOWN_TIMEOUT", "")

	cfg, err := FromEnv()
	if err != nil {
		t.Fatalf("load config: %v", err)
	}
	if cfg.Port != "8081" || cfg.ShutdownTimeout.String() != "10s" {
		t.Fatalf("unexpected defaults: %+v", cfg)
	}
}
