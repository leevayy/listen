package storage


type Book struct {
	BookID     int64     `db:"bookId" json:"bookId"`
	login     string     `db:"login" json:"-"`
	UploadedTs int64 `db:"uploadedTs" json:"uploadedTs"`
	BookUrl   string    `db:"bookUrl" json:"bookUrl"`
	Title   string    `db:"bookUrl" json:"title"`
}

type PostBookRequest struct {
    BookTitle string `json:"bookTitle"`
}