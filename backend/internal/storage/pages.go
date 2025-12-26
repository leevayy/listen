package storage

import "database/sql"

type Page struct {
	ID       int64
	BookID   int64
	PageIdx  int
	Text     string
	AudioURL sql.NullString
}

func (s *Storage) GetPage(bookID, pageIndex int64) (Page, error) {
	var p Page
	err := s.db.QueryRow(`
		SELECT id, book_id, page_index, text, audio_url
		FROM book_pages
		WHERE book_id = $1 AND page_index = $2
	`, bookID, pageIndex).Scan(
		&p.ID,
		&p.BookID,
		&p.PageIdx,
		&p.Text,
		&p.AudioURL,
	)
	return p, err
}


func (s *Storage) GetNextPage(bookID, currentIndex int64) (*int64, error) {
	var next int64
	err := s.db.QueryRow(`
		SELECT page_index FROM book_pages
		WHERE book_id = $1 AND page_index > $2
		ORDER BY page_index ASC
		LIMIT 1
	`, bookID, currentIndex).Scan(&next)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &next, err
}

func (s *Storage) GetPrevPage(bookID, currentIndex int64) (*int64, error) {
	var prev int64
	err := s.db.QueryRow(`
		SELECT page_index FROM book_pages
		WHERE book_id = $1 AND page_index < $2
		ORDER BY page_index DESC
		LIMIT 1
	`, bookID, currentIndex).Scan(&prev)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &prev, err
}


func (s *Storage) GetFirstPage(bookID int64) (*int64, error) {
	var id int64
	err := s.db.QueryRow(`
		SELECT id FROM book_pages
		WHERE book_id = $1
		ORDER BY id ASC
		LIMIT 1
	`, bookID).Scan(&id)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &id, err
}


func (s *Storage) GetUserProgress(login string, bookID int64) (int64, error) {
	var pageID int64
	err := s.db.QueryRow(`
		SELECT page_id FROM user_progress
		WHERE login=$1 AND book_id=$2
	`, login, bookID).Scan(&pageID)
	return pageID, err
}

func (s *Storage) SetUserProgress(login string, bookID, pageID int64) error {
	_, err := s.db.Exec(`
		INSERT INTO user_progress (login, book_id, page_id)
		VALUES ($1, $2, $3)
		ON CONFLICT (login, book_id)
		DO UPDATE SET page_id = EXCLUDED.page_id
	`, login, bookID, pageID)
	return err
}

func (s *Storage) GetPageText(bookID int64, pageID int, login string) (string, error) {
	var text string

	err := s.db.QueryRow(`
		SELECT bp.text
		FROM book_pages bp
		JOIN books b ON b.bookId = bp.book_id
		WHERE bp.book_id = $1
		  AND bp.page_index = $2
		  AND b.login = $3
	`, bookID, pageID, login).Scan(&text)

	if err != nil {
		return "", err
	}

	return text, nil
}

func (s *Storage) PageExists(bookID, pageIndex int64) (bool, error) {
	var exists bool
	err := s.db.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM book_pages
			WHERE book_id = $1 AND page_index = $2
		)
	`, bookID, pageIndex).Scan(&exists)
	if err != nil {
		return false, err
	}
	return exists, nil
}
