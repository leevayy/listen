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

func (s *Storage) DeleteSession(sessionID string) error {
	_, err := s.db.Exec("DELETE FROM sessions WHERE session_id = $1", sessionID)
	return err
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
		title TEXT NOT NULL
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

	return nil
}

func (s *Storage) GetUserBooks(login string) ([]Book, error) {
	rows, err := s.db.Query("SELECT bookId, login, uploadedTs, bookUrl FROM books WHERE login=$1", login)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var books []Book
	for rows.Next() {
		var b Book
		if err := rows.Scan(&b.BookID, &b.login, &b.UploadedTs, &b.BookUrl); err != nil {
			return nil, err
		}
		books = append(books, b)
	}
	return books, nil
}

func (s *Storage) GetBook(bookID int64, login string) (Book, error) {
	var b Book
	b.BookID = bookID
	err := s.db.QueryRow(
		"SELECT login, uploadedTs, bookUrl, title FROM books WHERE bookId=$1 AND login=$2",		
		bookID, login).
		Scan(&b.login, &b.UploadedTs, &b.BookUrl, &b.Title)
	return b, err
}

func (s *Storage) AddBook(login, BookUrl, title string) (Book, error) {
	var b Book
	b.login, b.BookUrl, b.Title = login, BookUrl, title
	err := s.db.QueryRow(
		`INSERT INTO books (login, bookUrl, title, uploadedTs) 
		VALUES ($1, $2, $3, extract(epoch from now())::BIGINT)
		RETURNING bookId, uploadedTs`,
		login, BookUrl, title).Scan(&b.BookID, &b.UploadedTs)
	return b, err
}

func (s *Storage) DeleteBook(bookID int64, login string) error {
	_, err := s.db.Exec("DELETE FROM books WHERE bookId=$1 AND login=$2", bookID, login)
	return err
}
