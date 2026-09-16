package httpapi

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"time"
)

type healthResponse struct {
	Status    string    `json:"status"`
	Service   string    `json:"service"`
	Timestamp time.Time `json:"timestamp"`
}

func NewHandler(logger *slog.Logger) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health/live", health("live"))
	mux.HandleFunc("GET /health/ready", health("ready"))
	mux.HandleFunc("GET /v1/search", notImplemented)

	return requestLogger(logger, mux)
}

func health(status string) http.HandlerFunc {
	return func(response http.ResponseWriter, _ *http.Request) {
		writeJSON(response, http.StatusOK, healthResponse{
			Status:    status,
			Service:   "search-service",
			Timestamp: time.Now().UTC(),
		})
	}
}

func notImplemented(response http.ResponseWriter, _ *http.Request) {
	writeJSON(response, http.StatusNotImplemented, map[string]string{
		"code":    "search_not_implemented",
		"message": "The search read model is not available yet.",
	})
}

func writeJSON(response http.ResponseWriter, status int, body any) {
	response.Header().Set("Content-Type", "application/json")
	response.WriteHeader(status)
	if err := json.NewEncoder(response).Encode(body); err != nil {
		slog.Error("encode response", "error", err)
	}
}

func requestLogger(logger *slog.Logger, next http.Handler) http.Handler {
	return http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		startedAt := time.Now()
		next.ServeHTTP(response, request)
		logger.Info(
			"http request",
			"method", request.Method,
			"path", request.URL.Path,
			"duration_ms", time.Since(startedAt).Milliseconds(),
		)
	})
}
