package main

import (
	"log/slog"
	"os"

	"github.com/anandaadityap/cohortquiz/services/api-go/internal/httpapi"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	addr := ":" + envOr("PORT", "8080")
	server := httpapi.NewServer(httpapi.Config{
		OpenAIKey:   os.Getenv("OPENAI_API_KEY"),
		OpenAIModel: envOr("OPENAI_MODEL", "gpt-4o-mini"),
	})

	slog.Info("api listening", "addr", addr, "llm", server.GeneratorName())
	if err := server.ListenAndServe(addr); err != nil {
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
