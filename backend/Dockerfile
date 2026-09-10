# syntax=docker/dockerfile:1

# ---- build ----------------------------------------------------------------
FROM golang:1.26-alpine AS build
WORKDIR /src

RUN apk add --no-cache git ca-certificates

COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod go mod download

COPY . .
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/server ./cmd/server

# ---- runtime --------------------------------------------------------------
FROM alpine:3.21

RUN apk add --no-cache ca-certificates tzdata \
 && adduser -D -H -u 10001 -g merenda merenda \
 && mkdir -p /data/uploads \
 && chown -R merenda:merenda /data

COPY --from=build /out/server /usr/local/bin/server

ENV APP_ENV=production \
    HTTP_ADDR=:8080 \
    UPLOAD_DIR=/data/uploads \
    TRUST_PROXY=true

USER merenda
WORKDIR /data
VOLUME ["/data/uploads"]
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null || exit 1

ENTRYPOINT ["/usr/local/bin/server"]
