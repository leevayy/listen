package storage

import (
	"database/sql"
	"errors"
	"fmt"
)

type Storage struct {
	db *sql.DB
}

func New(db *sql.DB) *Storage {
	return &Storage{db: db}
}

func (s *Storage) CreateUser(login, password string) error {
	_, err := s.db.Exec("INSERT INTO users (login, password) VALUES ($1, $2)", login, password)
	if err != nil {
		return fmt.Errorf("failed to insert user: %w", err)
	}
	return nil
}

func (s *Storage) GetUser(login, password string) (bool, error) {
	var exists bool
	err := s.db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE login=$1 AND password=$2)", login, password).Scan(&exists)
	if err != nil {
		return false, err
	}
	return exists, nil
}

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

func (s *Storage) InitDB() error {
	createUsers := `
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		login TEXT UNIQUE NOT NULL,
		password TEXT NOT NULL
	);`

	createSessions := `
	CREATE TABLE IF NOT EXISTS sessions (
		id SERIAL PRIMARY KEY,
		login TEXT NOT NULL,
		session_id TEXT NOT NULL
	);`

	if _, err := s.db.Exec(createUsers); err != nil {
		return err
	}

	if _, err := s.db.Exec(createSessions); err != nil {
		return err
	}

	return nil
}
