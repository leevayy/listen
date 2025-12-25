package app

import (
	"database/sql"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"strconv"

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
	if os.Getenv("DATABASE_URL") == "" {
		cfg := postgresConfigFromEnv()
		connRoot := fmt.Sprintf(
			"host=%s port=%d user=%s password=%s dbname=postgres sslmode=%s",
			cfg.host, cfg.port, cfg.user, cfg.password, cfg.sslmode,
		)
		dbRoot, err := sql.Open("postgres", connRoot)
		if err != nil {
			return nil, err
		}
		defer dbRoot.Close()

		if err := dbRoot.Ping(); err != nil {
			return nil, err
		}

		_, err = dbRoot.Exec("CREATE DATABASE " + cfg.dbname)
		if err != nil && !containsAlreadyExists(err) {
			return nil, err
		}
	}

	conn := postgresConnString()
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

func postgresConnString() string {
	if v := os.Getenv("DATABASE_URL"); v != "" {
		return v
	}

	cfg := postgresConfigFromEnv()
	return fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.host, cfg.port, cfg.user, cfg.password, cfg.dbname, cfg.sslmode,
	)
}

type postgresConfig struct {
	host     string
	port     int
	user     string
	password string
	dbname   string
	sslmode  string
}

func postgresConfigFromEnv() postgresConfig {
	return postgresConfig{
		host:     getenv("POSTGRES_HOST", "localhost"),
		port:     getenvInt("POSTGRES_PORT", 5432),
		user:     getenv("POSTGRES_USER", "postgres"),
		password: os.Getenv("POSTGRES_PASSWORD"),
		dbname:   getenv("POSTGRES_DB", "voicebook"),
		sslmode:  getenv("POSTGRES_SSLMODE", "disable"),
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getenvInt(key string, fallback int) int {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return fallback
	}
	return n
}

// helper для ошибки "database already exists"
func containsAlreadyExists(err error) bool {
	return err != nil && (err.Error() == "pq: database \"voicebook\" already exists" || err.Error() == "pq: база данных \"voicebook\" уже существует")
}
