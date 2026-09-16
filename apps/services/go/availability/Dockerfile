# syntax=docker/dockerfile:1.7

FROM golang:1.23-alpine AS build
WORKDIR /src
COPY go.mod ./
RUN --mount=type=cache,target=/go/pkg/mod go mod download
COPY . .
RUN --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/availability-service ./cmd/server

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/availability-service /availability-service
EXPOSE 8081 9091
USER nonroot:nonroot
ENTRYPOINT ["/availability-service"]

