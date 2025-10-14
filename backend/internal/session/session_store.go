package session

import (
	"sync"

	"github.com/google/uuid"
)

type SessionStore struct {
	mu       sync.RWMutex
	sessions map[string]string // sessionID → login
}

func NewSessionStore() *SessionStore {
	return &SessionStore{
		sessions: make(map[string]string),
	}
}

func (s *SessionStore) CreateSession(login string) string {
	s.mu.Lock()
	defer s.mu.Unlock()

	id := uuid.NewString()
	s.sessions[id] = login
	return id
}

func (s *SessionStore) GetLogin(sessionID string) (string, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	login, ok := s.sessions[sessionID]
	return login, ok
}
