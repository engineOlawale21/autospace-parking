# syntax=docker/dockerfile:1.7

FROM golang:1.23-alpine AS build
WORKDIR /src/apps/services/go/availability
COPY libs/contracts /src/libs/contracts
COPY apps/services/go/availability/go.mod apps/services/go/availability/go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod go mod download
COPY apps/services/go/availability .
RUN --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/availability-service ./cmd/server

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/availability-service /availability-service
EXPOSE 8081 9091
USER nonroot:nonroot
ENTRYPOINT ["/availability-service"]

