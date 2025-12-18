# Build Stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git

# Copy dependencies first for caching
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -o schoolms-binary .

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
