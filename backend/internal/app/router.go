package app

import (
	"log/slog"
	"net/http"
	"time"

	"voicebook/internal/handler"

	"github.com/go-chi/chi/v5"
)


func NewRouter(h *handler.Handler, logger *slog.Logger) http.Handler {
	r := chi.NewRouter()
	// Logging middleware — можно оставлять здесь (до Route)
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

	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			path := r.URL.Path
			if path[len(path)-1] != '/' {
				r.URL.Path = path + "/"
			}
			next.ServeHTTP(w, r)
		})
	})

	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			if origin == "http://127.0.0.1:5173" || origin == "http://localhost:5173" {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Session-Id")
			}

			// Обработка preflight запроса (OPTIONS)
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusOK)
				return
			}

			next.ServeHTTP(w, r)
		})
	})

	r.Route("/api", func(r chi.Router) {
		// public endp
		r.Post("/register/", h.Register)
		r.Post("/login/", h.Login)
		

		// private endp
		r.Group(func(r chi.Router) {
			r.Use(h.AuthMiddleware)
			r.Get("/collection/", h.GetCollection)
			r.Get("/myself/", h.Myself)
			r.Post("/logout/", h.Logout)
			r.Post("/book/", h.PostBook)

			r.Route("/book/{bookId}", func(r chi.Router) {
				r.Get("/", h.GetBook)
				r.Delete("/", h.DeleteBook)
			})
		})
	})

	return r
}
