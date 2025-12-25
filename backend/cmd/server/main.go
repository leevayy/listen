package main

import (
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"voicebook/internal/app"
)

func main() {
	logger := slog.Default()
	a, err := app.New(logger)
	if err != nil {
		log.Fatalf("failed to init app: %v", err)
	}

	host := getenv("HOST", "0.0.0.0")
	port := getenv("PORT", "8080")
	addr := fmt.Sprintf("%s:%s", host, port)
	log.Printf("Server started on %s", addr)
	if err := http.ListenAndServe(addr, a.Router); err != nil {
		log.Fatalf("server stopped: %v", err)
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
