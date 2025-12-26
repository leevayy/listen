package storage

import (
	"database/sql"
	"errors"
)

func (s *Storage) GetLoginBySession(sessionID string) (string, error) {
	var login string
	err := s.db.QueryRow("SELECT login FROM sessions WHERE session_id=$1", sessionID).Scan(&login)
	if errors.Is(err, sql.ErrNoRows) {
		return "", nil
	}
	return login, err
}

func (s *Storage) SaveSession(login, sessionID string) error {
	_, err := s.db.Exec("INSERT INTO sessions (login, session_id) VALUES ($1, $2)", login, sessionID)
	return err
}

func (s *Storage) DeleteSession(sessionID string) error {
	_, err := s.db.Exec("DELETE FROM sessions WHERE session_id = $1", sessionID)
	return err
}
