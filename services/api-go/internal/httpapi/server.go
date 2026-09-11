package httpapi

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"time"

	"github.com/anandaadityap/cohortquiz/services/api-go/internal/generate"
	"github.com/anandaadityap/cohortquiz/services/api-go/internal/grade"
)

type Config struct {
	OpenAIKey   string
	OpenAIModel string
}

type Server struct {
	mux       *http.ServeMux
	generator generate.Generator
}

func NewServer(cfg Config) *Server {
	s := &Server{
		mux:       http.NewServeMux(),
		generator: generate.New(cfg.OpenAIKey, cfg.OpenAIModel),
	}
	s.mux.HandleFunc("GET /healthz", s.healthz)
	s.mux.HandleFunc("POST /v1/generate-quiz", s.generateQuiz)
	s.mux.HandleFunc("POST /v1/grade-attempt", s.gradeAttempt)
	return s
}

func (s *Server) GeneratorName() string {
	return s.generator.Name()
}

func (s *Server) ListenAndServe(addr string) error {
	httpServer := &http.Server{
		Addr:              addr,
		Handler:           withLogging(s.mux),
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       60 * time.Second,
		WriteTimeout:      120 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
	return httpServer.ListenAndServe()
}

func (s *Server) healthz(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"ok":        true,
		"service":   "cohortquiz-api",
		"generator": s.generator.Name(),
	})
}

type generateRequest struct {
	MaterialTitle   string `json:"materialTitle"`
	MaterialContent string `json:"materialContent"`
	Count           int    `json:"count"`
}

func (s *Server) generateQuiz(w http.ResponseWriter, r *http.Request) {
	var req generateRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if len(req.MaterialContent) < 40 {
		writeError(w, http.StatusBadRequest, "materialContent must be at least 40 characters")
		return
	}
	if req.Count <= 0 {
		req.Count = 5
	}
	if req.Count > 12 {
		req.Count = 12
	}

	questions, err := s.generator.Generate(r.Context(), generate.Input{
		Title:   req.MaterialTitle,
		Content: req.MaterialContent,
		Count:   req.Count,
	})
	if err != nil {
		slog.Error("generate failed", "err", err)
		writeError(w, http.StatusBadGateway, "quiz generation failed")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"generator": s.generator.Name(),
		"questions": questions,
	})
}

func (s *Server) gradeAttempt(w http.ResponseWriter, r *http.Request) {
	var req grade.Request
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if len(req.Items) == 0 {
		writeError(w, http.StatusBadRequest, "items must not be empty")
		return
	}
	result, err := grade.Attempt(req)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func withLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		slog.Info("http",
			"method", r.Method,
			"path", r.URL.Path,
			"duration_ms", time.Since(start).Milliseconds(),
		)
	})
}
