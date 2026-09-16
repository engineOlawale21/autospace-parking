package config

import (
	"errors"
	"os"
	"time"
)

type Config struct {
	Port            string
	GrpcPort        string
	DatabaseURL     string
	RedisURL        string
	Environment     string
	ShutdownTimeout time.Duration
}

func FromEnv() (Config, error) {
	shutdownTimeout, err := time.ParseDuration(envOrDefault("SHUTDOWN_TIMEOUT", "10s"))
	if err != nil || shutdownTimeout <= 0 {
		return Config{}, errors.New("SHUTDOWN_TIMEOUT must be a positive duration")
	}

	return Config{
		Port:            envOrDefault("PORT", "8081"),
		GrpcPort:        envOrDefault("GRPC_PORT", "9091"),
		DatabaseURL:     os.Getenv("DATABASE_URL"),
		RedisURL:        envOrDefault("REDIS_URL", "redis://localhost:6379"),
		Environment:     envOrDefault("APP_ENV", "development"),
		ShutdownTimeout: shutdownTimeout,
	}, nil
}

func envOrDefault(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok && value != "" {
		return value
	}
	return fallback
}
