package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"

	"voicebook/internal/storage"

	"github.com/google/uuid"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	st *storage.Storage
}

func New(st *storage.Storage) *Handler {
	return &Handler{st: st}
}

type PostBookRequest struct {
    BookTitle string `json:"bookTitle"`
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

	sessionID := uuid.NewString()
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

	sessionID := uuid.NewString()

	h.st.SaveSession(cred.Login, sessionID)

	json.NewEncoder(w).Encode(map[string]string{"sessionId": sessionID})
}

func (h *Handler) Myself(w http.ResponseWriter, r *http.Request) {
	login := r.Context().Value("login").(string)
	json.NewEncoder(w).Encode(map[string]string{"login": login})

}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	sessionID := r.Header.Get("X-Session-Id")
	if sessionID == "" {
		http.Error(w, "missing session id", http.StatusBadRequest)
		return
	}

	err := h.st.DeleteSession(sessionID)
	if err != nil {
		http.Error(w, "failed to delete session", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// books handlers
func (h *Handler) GetBook(w http.ResponseWriter, r *http.Request) {
	login := r.Context().Value("login").(string)

	bookIDStr := chi.URLParam(r, "bookId")
	bookID, err := strconv.ParseInt(bookIDStr, 10, 64)
	if err != nil {
		http.Error(w, "invalid bookId", http.StatusBadRequest)
		return
	}

	book, err := h.st.GetBook(bookID, login)
	if err != nil {
		http.Error(w, "book not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"book": book})
}

func (h *Handler) PostBook(w http.ResponseWriter, r *http.Request) {
    login := r.Context().Value("login").(string)

    var req PostBookRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "invalid request body", http.StatusBadRequest)
        return
    }

	book, err := h.st.AddBook(login, "", req.BookTitle)
	if err != nil {
		fmt.Printf("AddBook failed", err)
		http.Error(w, "failed to add book", http.StatusInternalServerError)
		return
	}

    json.NewEncoder(w).Encode(map[string]any{"book": book})
}


func (h *Handler) DeleteBook(w http.ResponseWriter, r *http.Request) {
	login := r.Context().Value("login").(string)
	bookIDStr := chi.URLParam(r, "bookId")
	bookID, err := strconv.ParseInt(bookIDStr, 10, 64)
	if err != nil {
		http.Error(w, "invalid bookId", http.StatusBadRequest)
		return
	}

	err = h.st.DeleteBook(bookID, login)
	if err != nil {
		http.Error(w, "failed to delete book", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"message": "ok"})
}

func (h *Handler) GetCollection(w http.ResponseWriter, r *http.Request) {
    login := r.Context().Value("login").(string)

    books, err := h.st.GetUserBooks(login)
    if err != nil {
        http.Error(w, "failed to get collection", http.StatusInternalServerError)
        return
    }

    response := struct {
        Collection struct {
            Books []storage.Book `json:"books"`
        } `json:"collection"`
    }{}

    response.Collection.Books = books

    json.NewEncoder(w).Encode(response)
}
