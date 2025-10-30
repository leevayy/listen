package app

import (
	"database/sql"
	"fmt"
	"log/slog"
	"net/http"

	_ "github.com/lib/pq"

	"voicebook/internal/handler"
	"voicebook/internal/storage"
	"voicebook/internal/s3client"
)

type App struct {
	Router http.Handler
	DB     *sql.DB
	Client *s3client.Client
}

func New(logger *slog.Logger) (*App, error) {
	const (
		host     = "localhost"
		port     = 5432
		user     = "postgres"
		password = "123"
		dbname   = "voicebook"
	)

	connRoot := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=postgres sslmode=disable",
		host, port, user, password,
	)
	dbRoot, err := sql.Open("postgres", connRoot)
	if err != nil {
		return nil, err
	}
	defer dbRoot.Close()

	if err := dbRoot.Ping(); err != nil {
		return nil, err
	}

	_, err = dbRoot.Exec("CREATE DATABASE " + dbname)
	if err != nil && !containsAlreadyExists(err) {
		return nil, err
	}

	conn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname,
	)
	db, err := sql.Open("postgres", conn)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	st := storage.New(db)
	if err := st.InitDB(); err != nil {
		return nil, fmt.Errorf("failed to init database: %w", err)
	}

	cl, err := s3client.New()
	if err != nil {
		return nil, err
	}

	h := handler.New(st, cl)

	app := &App{
		Router: NewRouter(h, logger),
		DB:     db,
		Client: cl,
	}
	

	return app, nil
}

// helper для ошибки "database already exists"
func containsAlreadyExists(err error) bool {
	return err != nil && (err.Error() == "pq: database \"voicebook\" already exists" || err.Error() == "pq: база данных \"voicebook\" уже существует")
}
