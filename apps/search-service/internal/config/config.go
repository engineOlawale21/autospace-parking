package config

import (
	"fmt"
	"log/slog"
	"os"
	"strconv"
	"time"
)

type Config struct {
	Port            string
	LogLevel        slog.Level
	ShutdownTimeout time.Duration
}

func FromEnv() (Config, error) {
	port := envOrDefault("PORT", "8080")
	if parsedPort, err := strconv.Atoi(port); err != nil || parsedPort < 1 || parsedPort > 65535 {
		return Config{}, fmt.Errorf("PORT must be between 1 and 65535")
	}

	logLevel := new(slog.Level)
	if err := logLevel.UnmarshalText([]byte(envOrDefault("LOG_LEVEL", "info"))); err != nil {
		return Config{}, fmt.Errorf("LOG_LEVEL: %w", err)
	}

	shutdownTimeout, err := time.ParseDuration(envOrDefault("SHUTDOWN_TIMEOUT", "10s"))
	if err != nil || shutdownTimeout <= 0 {
		return Config{}, fmt.Errorf("SHUTDOWN_TIMEOUT must be a positive duration")
	}

	return Config{
		Port:            port,
		LogLevel:        *logLevel,
		ShutdownTimeout: shutdownTimeout,
	}, nil
}

func envOrDefault(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok && value != "" {
		return value
	}

	return fallback
}
