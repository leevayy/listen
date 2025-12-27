package storage

import (
	"database/sql"
	"fmt"
	"voicebook/internal/utils"
)

type Storage struct {
	db *sql.DB
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

func (s *Storage) GetUserBooks(login string) ([]Book, error) {
	rows, err := s.db.Query(`
		SELECT bookId, login, uploadedTs, bookUrl, title, author
		FROM books
		WHERE login = $1
	`, login)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var books []Book
	for rows.Next() {
		var b Book
		if err := rows.Scan(
			&b.BookID,
			&b.Login,
			&b.UploadedTs,
			&b.BookUrl,
			&b.Title,
			&b.Author,
		); err != nil {
			return nil, err
		}
		books = append(books, b)
	}
	return books, nil
}


func (s *Storage) GetBook(bookID int64, login string) (Book, error) {
	var b Book

	err := s.db.QueryRow(
		`SELECT bookId, login, uploadedTs, bookUrl, title, author
		 FROM books
		 WHERE bookId = $1 AND login = $2`,
		bookID, login,
	).Scan(
		&b.BookID,
		&b.Login,
		&b.UploadedTs,
		&b.BookUrl,
		&b.Title,
		&b.Author,
	)

	return b, err
}


func (s *Storage) AddBook(login, bookURL, title, author, fullText string) (Book, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return Book{}, err
	}
	defer tx.Rollback()

	var b Book
	err = tx.QueryRow(
		`INSERT INTO books (login, bookUrl, title, author, uploadedTs)
		 VALUES ($1, $2, $3, $4, extract(epoch from now())::BIGINT)
		 RETURNING bookId, uploadedTs`,
		login, bookURL, title, author,
	).Scan(&b.BookID, &b.UploadedTs)
	if err != nil {
		return Book{}, err
	}

	b.Login = login
	b.BookUrl = bookURL
	b.Title = title
	b.Author = author

	pages := utils.SplitTextToPages(fullText)

	for i, text := range pages {
		// +1 чтобы первая страница была 1
		_, err = tx.Exec(
			`INSERT INTO book_pages (book_id, page_index, text)
			 VALUES ($1, $2, $3)`,
			b.BookID, i+1, text,
		)
		if err != nil {
			return Book{}, err
		}
	}

	if err = tx.Commit(); err != nil {
		return Book{}, err
	}

	return b, nil
}




func (s *Storage) DeleteBook(bookID int64, login string) error {
	_, err := s.db.Exec("DELETE FROM books WHERE bookId=$1 AND login=$2", bookID, login)
	return err
}
