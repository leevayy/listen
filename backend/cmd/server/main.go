package main

import (
	"log"
	"net/http"
	"log/slog"
    "fmt"
	"voicebook/internal/app"
)

const (
	host = "127.0.0.1"
	port = "8080"
)

func main() {
	logger := slog.Default()
	a, err := app.New(logger)
	if err != nil {
		log.Fatalf("failed to init app: %v", err)
	}

    addr := fmt.Sprintf("%s:%s", host, port)
	log.Printf("Server started on %s", addr)
	if err := http.ListenAndServe(addr, a.Router); err != nil {
		log.Fatalf("server stopped: %v", err)
	}
}
