package app

import (
	"net/http"
	"time"
	"log/slog"

	"github.com/go-chi/chi/v5"
	"voicebook/internal/handler"
)

func NewRouter(h *handler.Handler, logger *slog.Logger) http.Handler {
	r := chi.NewRouter()

	// Middleware логирования
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			logger.Info("HTTP request started",
				"method", r.Method,
				"path", r.URL.Path,
				"remote_addr", r.RemoteAddr,
			)

			next.ServeHTTP(w, r)

			logger.Info("HTTP request finished",
				"method", r.Method,
				"path", r.URL.Path,
				"duration_ms", time.Since(start).Milliseconds(),
			)
		})
	})

	r.Route("/api", func(r chi.Router) {
		r.Post("/register", h.Register)
		r.Post("/login", h.Login)
		r.Get("/myself", h.Myself)
	})

	return r
}
