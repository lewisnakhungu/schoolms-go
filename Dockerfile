# Build Stage - SchoolMS Backend
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Install build dependencies (including gcc for SQLite CGO)
RUN apk add --no-cache git gcc musl-dev

# Enable Go toolchain switching for Go 1.24+ dependencies
ENV GOTOOLCHAIN=auto

# Copy Go modules from backend folder
COPY backend/go.mod backend/go.sum ./
RUN go mod download

# Copy backend source code
COPY backend/ .

# Build the binary with CGO enabled for SQLite support
RUN CGO_ENABLED=1 GOOS=linux go build -o schoolms-binary .

# Final Stage
FROM alpine:latest

WORKDIR /root/

# Install runtime dependencies
RUN apk add --no-cache ca-certificates

# Copy binary from builder
COPY --from=builder /app/schoolms-binary .

# Expose API port
EXPOSE 8080

# Run the binary
CMD ["./schoolms-binary"]
