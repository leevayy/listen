package handler

import (
	"encoding/json"
	"io"
	"math/rand"
	"net/http"

	"voicebook/internal/storage"
)

type Handler struct {
	st *storage.Storage
}

func New(st *storage.Storage) *Handler {
	return &Handler{st: st}
}

type credentials struct {
	Login    string `json:"login"`
	Password string `json:"password"`
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var cred credentials
	body, _ := io.ReadAll(r.Body)
	json.Unmarshal(body, &cred)

	if err := h.st.CreateUser(cred.Login, cred.Password); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	sessionID := randString(16)
	h.st.SaveSession(cred.Login, sessionID)

	json.NewEncoder(w).Encode(map[string]string{"sessionId": sessionID})
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var cred credentials
	body, _ := io.ReadAll(r.Body)
	json.Unmarshal(body, &cred)

	ok, err := h.st.GetUser(cred.Login, cred.Password)
	if err != nil || !ok {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}

	sessionID := randString(16)
	h.st.SaveSession(cred.Login, sessionID)

	json.NewEncoder(w).Encode(map[string]string{"sessionId": sessionID})
}

func (h *Handler) Myself(w http.ResponseWriter, r *http.Request) {
	sessionID := r.Header.Get("X-Session-Id")
	login, err := h.st.GetLoginBySession(sessionID)
	if err != nil || login == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	json.NewEncoder(w).Encode(map[string]string{"login": login})
}

func randString(n int) string {
	letters := []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
	b := make([]rune, n)
	for i := range b {
		b[i] = letters[rand.Intn(len(letters))]
	}
	return string(b)
}
