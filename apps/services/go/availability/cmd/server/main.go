package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/autospace/availability-service/internal/config"
	"github.com/autospace/availability-service/internal/grpcapi"
	availabilityv1 "github.com/autospace/contracts/gen/go/autospace/availability/v1"
	_ "github.com/jackc/pgx/v5/stdlib"
	"google.golang.org/grpc"
)

func main() {
	cfg, err := config.FromEnv()
	if err != nil {
		slog.Error("invalid configuration", "error", err)
		os.Exit(1)
	}

	port := cfg.Port
	if len(os.Args) > 1 && os.Args[1] == "healthcheck" {
		healthcheck(port)
		return
	}

	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	database, err := openDatabase(cfg.DatabaseURL)
	if err != nil {
		logger.Error("database unavailable", "error", err)
		os.Exit(1)
	}
	if database != nil {
		defer database.Close()
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health/live", healthHandler("live"))
	mux.HandleFunc("GET /health/ready", healthHandler("ready"))

	server := &http.Server{
		Addr:              ":" + port,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
	grpcListener, err := net.Listen("tcp", ":"+cfg.GrpcPort)
	if err != nil {
		logger.Error("gRPC listener failed", "error", err)
		os.Exit(1)
	}
	grpcServer := grpc.NewServer()
	availabilityv1.RegisterAvailabilityServiceServer(grpcServer, grpcapi.Service{})

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	serverErrors := make(chan error, 1)
	go func() {
		logger.Info("availability service listening", "address", server.Addr)
		serverErrors <- server.ListenAndServe()
	}()
	go func() {
		logger.Info("availability gRPC service listening", "address", grpcListener.Addr().String())
		if err := grpcServer.Serve(grpcListener); err != nil {
			serverErrors <- err
		}
	}()

	select {
	case <-ctx.Done():
		logger.Info("shutdown requested")
	case err := <-serverErrors:
		if !errors.Is(err, http.ErrServerClosed) {
			logger.Error("server failed", "error", err)
			os.Exit(1)
		}
		return
	}

	shutdownContext, cancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
	defer cancel()
	grpcServer.GracefulStop()
	grpcListener.Close()
	if err := server.Shutdown(shutdownContext); err != nil {
		logger.Error("graceful shutdown failed", "error", err)
		os.Exit(1)
	}
}

func openDatabase(databaseURL string) (*sql.DB, error) {
	if databaseURL == "" {
		return nil, nil
	}

	database, err := sql.Open("pgx", databaseURL)
	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := database.PingContext(ctx); err != nil {
		database.Close()
		return nil, err
	}
	return database, nil
}

func healthHandler(status string) http.HandlerFunc {
	return func(response http.ResponseWriter, _ *http.Request) {
		response.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(response).Encode(map[string]string{
			"status":  status,
			"service": "availability-service",
		}); err != nil {
			slog.Error("encode health response", "error", err)
		}
	}
}

func healthcheck(port string) {
	client := &http.Client{Timeout: 2 * time.Second}
	response, err := client.Get("http://127.0.0.1:" + port + "/health/ready")
	if err != nil {
		os.Exit(1)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		os.Exit(1)
	}
}
