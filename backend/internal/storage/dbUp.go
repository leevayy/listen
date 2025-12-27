package storage

import "database/sql"

func New(db *sql.DB) *Storage {
	return &Storage{db: db}
}

func (s *Storage) InitDB() error {
	createUsers := `
	CREATE TABLE IF NOT EXISTS users (
		id BIGSERIAL PRIMARY KEY,
		login TEXT UNIQUE NOT NULL,
		password TEXT NOT NULL
	);`
	createSessions := `
	CREATE TABLE IF NOT EXISTS sessions (
		id BIGSERIAL PRIMARY KEY,
		login TEXT NOT NULL,
		session_id TEXT NOT NULL
	);`
	createBooks := `
	CREATE TABLE IF NOT EXISTS books (
		bookId BIGSERIAL PRIMARY KEY,
		login TEXT NOT NULL,
		bookUrl TEXT,
		uploadedTs BIGINT NOT NULL DEFAULT (extract(epoch from now())::BIGINT),
		title TEXT NOT NULL,
		author TEXT 
	);`
	createBookPages := `
	CREATE TABLE IF NOT EXISTS book_pages (
		id BIGSERIAL PRIMARY KEY,
		book_id BIGINT NOT NULL,
		page_index INT NOT NULL,
		text TEXT NOT NULL,
		audio_url TEXT
	);`
	createUserProgress := `
	CREATE TABLE IF NOT EXISTS user_progress (
		login TEXT NOT NULL,
		book_id BIGINT NOT NULL,
		page_id BIGINT NOT NULL,
		PRIMARY KEY (login, book_id)
	);`

	if _, err := s.db.Exec(createUsers); err != nil {
		return err
	}

	if _, err := s.db.Exec(createSessions); err != nil {
		return err
	}

	if _, err := s.db.Exec(createBooks); err != nil {
		return err
	}

	if _, err := s.db.Exec(createBookPages); err != nil {
		return err
	}

	if _, err := s.db.Exec(createUserProgress); err != nil {
		return err
	}

	return nil
}