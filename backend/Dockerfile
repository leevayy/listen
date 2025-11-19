# Build stage
FROM golang:1.24 AS builder
WORKDIR /app

# Cache modules first
COPY backend/go.mod backend/go.sum ./
RUN go mod download

# Copy the rest and build
COPY backend/ .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o server ./cmd/server

# Final minimal image
FROM gcr.io/distroless/static-debian12
WORKDIR /
COPY --from=builder /app/server /server
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/server"]
