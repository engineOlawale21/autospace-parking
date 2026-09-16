#!/usr/bin/env bash
set -euo pipefail

project="autospace-m1-${GITHUB_RUN_ID:-local}"
compose=(docker compose -p "$project" --env-file .env.docker.example)

cleanup() {
  "${compose[@]}" logs --no-color api availability-service kafka 2>/dev/null || true
  "${compose[@]}" down --volumes --remove-orphans 2>/dev/null || true
}
trap cleanup EXIT

"${compose[@]}" up -d postgres redis kafka kafka-init minio
"${compose[@]}" run --rm migrate
"${compose[@]}" up -d availability-service api

for _ in $(seq 1 60); do
  if curl --fail --silent http://127.0.0.1:3000/health >/dev/null && \
     curl --fail --silent http://127.0.0.1:8081/health/ready >/dev/null; then
    break
  fi
  sleep 2
done
curl --fail --silent http://127.0.0.1:3000/health >/dev/null
curl --fail --silent http://127.0.0.1:8081/health/ready >/dev/null

gateway_response=$(curl --fail --silent \
  -H 'x-correlation-id: milestone-1-smoke' \
  'http://127.0.0.1:3000/availability?parkingSpaceIds=space-smoke')
echo "$gateway_response" | jq -e '.items[0].parkingSpaceId == "space-smoke"' >/dev/null

network="${project}_backend"
grpc=(docker run --rm --network "$network" \
  --volume "$PWD/libs/contracts/proto:/protos:ro" \
  fullstorydev/grpcurl:v1.9.2 -plaintext -import-path /protos \
  -proto autospace/availability/v1/availability.proto)

now_ms=$(($(date +%s) * 1000))
end_ms=$((now_ms + 3600000))
quote=$(
  "${grpc[@]}" -d "{\"listingId\":\"listing-smoke\",\"parkingSpaceId\":\"space-smoke\",\"customerId\":\"customer-smoke\",\"timeRange\":{\"startsAtUnixMs\":\"$now_ms\",\"endsAtUnixMs\":\"$end_ms\",\"timezone\":\"UTC\"}}" \
    autospace.availability.v1.AvailabilityService/GetQuote
)
quote_id=$(echo "$quote" | jq -r '.quoteId')

hold=$("${grpc[@]}" -d "{\"quoteId\":\"$quote_id\",\"customerId\":\"customer-smoke\",\"idempotencyKey\":\"smoke-request-1\"}" \
  autospace.availability.v1.AvailabilityService/AcquireHold)
hold_id=$(echo "$hold" | jq -r '.holdId')
test -n "$hold_id"

"${compose[@]}" restart availability-service
"${compose[@]}" exec -T postgres psql -U autospace -d autospace -Atc \
  "SELECT status FROM availability_holds WHERE id = '$hold_id'" | grep -qx ACTIVE

"${compose[@]}" exec -T redis redis-cli DEL "development:availability:hold:$hold_id" >/dev/null
"${compose[@]}" exec -T postgres psql -U autospace -d autospace -Atc \
  "SELECT status FROM availability_holds WHERE id = '$hold_id'" | grep -qx ACTIVE

for _ in $(seq 1 30); do
  consumed=$("${compose[@]}" exec -T postgres psql -U autospace -d autospace -Atc \
    "SELECT count(*) FROM platform_consumed_events WHERE event_type = 'availability.hold.acquired.v1'")
  if [ "$consumed" -eq 1 ]; then
    exit 0
  fi
  sleep 2
done

echo "hold event was not published and consumed idempotently" >&2
exit 1
