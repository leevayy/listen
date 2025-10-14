package app

import (
	"database/sql"
	"fmt"
	"log/slog"
	"net/http"

	_ "github.com/lib/pq"

	"voicebook/internal/handler"
	"voicebook/internal/storage"
)

type App struct {
	Router http.Handler
	DB     *sql.DB
}

func New(logger *slog.Logger) (*App, error) {
	const (
		host     = "localhost"
		port     = 5432
		user     = "postgres"
		password = "123"
		dbname   = "voicebook"
	)

	// 1. Подключаемся к системной базе
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

	// 2. Создаём базу, если нет
	_, err = dbRoot.Exec("CREATE DATABASE " + dbname)
	if err != nil && !containsAlreadyExists(err) {
		return nil, err
	}

	// 3. Подключаемся к базе voicebook
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

	h := handler.New(st)

	app := &App{
		Router: NewRouter(h, logger),
		DB:     db,
	}

	return app, nil
}

// helper для ошибки "database already exists"
func containsAlreadyExists(err error) bool {
	return err != nil && (err.Error() == "pq: database \"voicebook\" already exists" ||
		err.Error() == "pq: база данных \"voicebook\" уже существует")
}
