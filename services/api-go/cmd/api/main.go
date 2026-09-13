package main

import (
	"context"
	"log/slog"
	"os"
	"time"

	"github.com/anandaadityap/cohortquiz/services/api-go/internal/httpapi"
	"github.com/anandaadityap/cohortquiz/services/api-go/internal/store"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		slog.Error("DATABASE_URL is required")
		os.Exit(1)
	}
	internalKey := os.Getenv("INTERNAL_API_KEY")
	if internalKey == "" {
		slog.Error("INTERNAL_API_KEY is required")
		os.Exit(1)
	}

	pg, err := store.NewPostgres(ctx, databaseURL)
	if err != nil {
		slog.Error("postgres", "err", err)
		os.Exit(1)
	}
	defer pg.Close()

	addr := ":" + envOr("PORT", "8080")
	server := httpapi.NewServer(httpapi.Config{
		OpenAIKey:   os.Getenv("OPENAI_API_KEY"),
		OpenAIModel: envOr("OPENAI_MODEL", "gpt-4o-mini"),
		InternalKey: internalKey,
		CORSOrigin:  envOr("CORS_ORIGIN", "http://localhost:3000"),
		Keys:        pg,
	})

	slog.Info("api listening", "addr", addr, "llm", server.GeneratorName())
	if err := server.Listen(addr); err != nil {
		slog.Error("server exited", "err", err)
		os.Exit(1)
	}
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
