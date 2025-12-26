package handler

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
)

func (h *Handler) GetCurrentPage(w http.ResponseWriter, r *http.Request) {
	login := r.Context().Value("login").(string)
	bookID, _ := strconv.ParseInt(chi.URLParam(r, "bookId"), 10, 64)

	// получаем прогресс (последнюю завершённую страницу)
	lastFinished, err := h.st.GetUserProgress(login, bookID)
	if err != nil && err != sql.ErrNoRows {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	var current int64
	if lastFinished == 0 {
		// ещё не читал → первая страница
		firstPage, err := h.st.GetNextPage(bookID, 0)
		if err != nil || firstPage == nil {
			http.Error(w, "book has no pages", http.StatusNotFound)
			return
		}
		current = *firstPage
		// сразу сохраняем прогресс
		if err := h.st.SetUserProgress(login, bookID, current-1); err != nil {
			http.Error(w, "cannot set initial progress", http.StatusInternalServerError)
			return
		}
	} else {
		// текущая страница = следующая после последней завершённой
		nextPage, _ := h.st.GetNextPage(bookID, lastFinished)
		if nextPage == nil {
			// последняя страница уже прочитана
			current = lastFinished
		} else {
			current = *nextPage
		}
	}

	prev, _ := h.st.GetPrevPage(bookID, current)
	next, _ := h.st.GetNextPage(bookID, current)

	json.NewEncoder(w).Encode(map[string]any{
		"pageId":         current,
		"previousPageId": prev,
		"nextPageId":     next,
	})
}





func (h *Handler) FinishedPage(w http.ResponseWriter, r *http.Request) {
	var req struct {
		BookID int64 `json:"bookId"`
		PageID int64 `json:"pageId"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	login := r.Context().Value("login").(string)

	// проверяем существование страницы
	exists, err := h.st.PageExists(req.BookID, req.PageID)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	if !exists {
		http.Error(w, "page does not exist", http.StatusBadRequest)
		return
	}

	if err := h.st.SetUserProgress(login, req.BookID, req.PageID); err != nil {
		http.Error(w, "cannot save progress", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}


func (h *Handler) GetPageText(w http.ResponseWriter, r *http.Request) {

	bookIDStr := chi.URLParam(r, "bookId")
	pageIDStr := chi.URLParam(r, "pageId")

	bookID, err := strconv.ParseInt(bookIDStr, 10, 64)
	if err != nil {
		http.Error(w, "invalid bookId", http.StatusBadRequest)
		return
	}

	pageID, err := strconv.Atoi(pageIDStr)
	if err != nil {
		http.Error(w, "invalid pageId", http.StatusBadRequest)
		return
	}

	page, err := h.st.GetPage(bookID, int64(pageID))
	if err != nil {
		http.Error(w, "page not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"text": page.Text,
	})
}

func (h *Handler) GetPageAudio(w http.ResponseWriter, r *http.Request) {
	bookIDStr := chi.URLParam(r, "bookId")
	pageIDStr := chi.URLParam(r, "pageId")

	bookID, err := strconv.ParseInt(bookIDStr, 10, 64)
	if err != nil {
		http.Error(w, "invalid bookId", http.StatusBadRequest)
		return
	}

	pageID, err := strconv.Atoi(pageIDStr)
	if err != nil {
		http.Error(w, "invalid pageId", http.StatusBadRequest)
		return
	}

	page, err := h.st.GetPage(bookID, int64(pageID))
	if err != nil {
		http.Error(w, "page not found", http.StatusNotFound)
		return
	}

	// Формируем JSON для TTS
	body, _ := json.Marshal(map[string]string{
		"text": page.Text,
	})

	// Отправка запроса к TTS
	req, err := http.NewRequest(
		http.MethodPost,
		"http://158.160.73.166:8000/api/v1/tts",
		bytes.NewBuffer(body),
	)
	if err != nil {
		http.Error(w, "failed to create tts request", http.StatusInternalServerError)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 20 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, "tts service unavailable", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		http.Error(w, "tts generation failed", http.StatusInternalServerError)
		return
	}

	// Декодируем ответ TTS
	var ttsResp struct {
		Source  string `json:"source"`
		FileURL string `json:"file_url"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&ttsResp); err != nil {
		http.Error(w, "invalid tts response", http.StatusInternalServerError)
		return
	}

	// Скачиваем аудио с S3
	audioBytes, err := h.cl.DownloadFile(r.Context(), ttsResp.FileURL)
	if err != nil {
		http.Error(w, "failed to download audio", http.StatusInternalServerError)
		return
	}

	// Отдаём клиенту WAV
	w.Header().Set("Content-Type", "audio/wav")
	w.Write(audioBytes)
}

