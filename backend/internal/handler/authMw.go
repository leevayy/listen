package handler

import (
	"context"
	"net/http"
)


func (h *Handler) checkSession(r *http.Request) (string, bool) {
	sessionID := r.Header.Get("X-Session-Id")
	login, err := h.st.GetLoginBySession(sessionID)
	if err != nil || login == "" {
		return "", false
	}
	return login, true
}

func (h *Handler) AuthMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

        login, ok := h.checkSession(r)
        if !ok {
            http.Error(w, "forbidden, unauthorized", http.StatusUnauthorized)
            return
        }

        ctx := context.WithValue(r.Context(), "login", login)

        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
