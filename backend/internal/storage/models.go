package storage


type Book struct {
	BookID     int64     `db:"bookId" json:"bookId"`
	Login     string     `db:"login" json:"login"`
	UploadedTs int64 `db:"uploadedTs" json:"uploadedTs"`
	BookUrl   string    `db:"bookUrl" json:"bookUrl"`
	Title   string    `db:"title" json:"title"`
	Author   string    `db:"author" json:"author"`
}

type PostBookRequest struct {
    BookTitle string `json:"title"`
}

type BookPage struct {
	ID        int64
	BookID    int64
	PageIndex int
	Text      string
	AudioURL  *string
}

type UserProgress struct {
	Login  string
	BookID int64
	PageID int64
}
