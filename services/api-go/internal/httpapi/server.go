package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"strings"
	"time"

	"github.com/anandaadityap/cohortquiz/services/api-go/internal/generate"
	"github.com/anandaadityap/cohortquiz/services/api-go/internal/grade"
	"github.com/anandaadityap/cohortquiz/services/api-go/internal/store"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/requestid"
)

type Config struct {
	OpenAIKey     string
	OpenAIModel   string
	InternalKey   string
	CORSOrigin    string
	Keys          store.KeyStore
	Generator     generate.Generator
}

type Server struct {
	App       *fiber.App
	generator generate.Generator
	keys      store.KeyStore
	internal  string
}

func NewServer(cfg Config) *Server {
	gen := cfg.Generator
	if gen == nil {
		gen = generate.New(cfg.OpenAIKey, cfg.OpenAIModel)
	}

	app := fiber.New(fiber.Config{
		AppName:      "cohortquiz-api",
		ReadTimeout:  60 * time.Second,
		WriteTimeout: 120 * time.Second,
		IdleTimeout:  60 * time.Second,
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			var fe *fiber.Error
			if errors.As(err, &fe) {
				code = fe.Code
			}
			return c.Status(code).JSON(fiber.Map{"error": err.Error()})
		},
	})

	origin := cfg.CORSOrigin
	if origin == "" {
		origin = "http://localhost:3000"
	}

	app.Use(requestid.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: origin,
		AllowHeaders: "Origin, Content-Type, Accept, X-Internal-Key",
		AllowMethods: "GET,POST,OPTIONS",
	}))

	s := &Server{
		App:       app,
		generator: gen,
		keys:      cfg.Keys,
		internal:  strings.TrimSpace(cfg.InternalKey),
	}

	app.Get("/healthz", s.healthz)
	app.Get("/api/v1/healthz", s.healthz)

	api := app.Group("/api/v1", s.requireInternalKey)
	api.Post("/generate-quiz", limiter.New(limiter.Config{
		Max:        10,
		Expiration: time.Minute,
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{"error": "rate limit exceeded"})
		},
	}), s.generateQuiz)
	api.Post("/grade-attempt", s.gradeAttempt)

	return s
}

func (s *Server) GeneratorName() string {
	return s.generator.Name()
}

func (s *Server) Listen(addr string) error {
	return s.App.Listen(addr)
}

func (s *Server) healthz(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status":  "ok",
		"service": "cohortquiz-api",
		"time":    time.Now().UTC().Format(time.RFC3339),
	})
}

func (s *Server) requireInternalKey(c *fiber.Ctx) error {
	if s.internal == "" {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal key is not configured"})
	}
	got := c.Get("X-Internal-Key")
	if got == "" || got != s.internal {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}
	return c.Next()
}

type generateRequest struct {
	MaterialTitle  string `json:"material_title"`
	MaterialText   string `json:"material_text"`
	ItemCount      int    `json:"item_count"`
	OptionsPerItem int    `json:"options_per_item"`
	Difficulty     string `json:"difficulty"`
	Locale         string `json:"locale"`
}

func (s *Server) generateQuiz(c *fiber.Ctx) error {
	var req generateRequest
	if err := json.Unmarshal(c.Body(), &req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid JSON body"})
	}
	if len(strings.TrimSpace(req.MaterialText)) < 40 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "material_text must be at least 40 characters"})
	}
	if req.OptionsPerItem == 0 {
		req.OptionsPerItem = 4
	}
	if req.OptionsPerItem != 4 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "options_per_item must be 4"})
	}
	if req.Difficulty == "" {
		req.Difficulty = "mixed"
	}
	if req.Locale == "" {
		req.Locale = "en"
	}

	count := generate.ClampCount(req.ItemCount)
	result, err := s.generator.Generate(c.UserContext(), generate.Input{
		Title:          req.MaterialTitle,
		Content:        req.MaterialText,
		Count:          count,
		OptionsPerItem: req.OptionsPerItem,
		Difficulty:     req.Difficulty,
		Locale:         req.Locale,
	})
	if err != nil {
		slog.Error("generate failed", "err", err, "request_id", c.GetRespHeader("X-Request-ID"))
		if errors.Is(err, generate.ErrTimeout) {
			return c.Status(fiber.StatusGatewayTimeout).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{"error": "quiz generation failed"})
	}
	return c.JSON(result)
}

type gradeRequest struct {
	QuizID           string          `json:"quiz_id"`
	Answers          []grade.Answer  `json:"answers"`
	StartedAt        time.Time       `json:"started_at"`
	SubmittedAt      time.Time       `json:"submitted_at"`
	TimeLimitSeconds int             `json:"time_limit_seconds"`
}

func (s *Server) gradeAttempt(c *fiber.Ctx) error {
	if s.keys == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "key store is not configured"})
	}
	var req gradeRequest
	if err := json.Unmarshal(c.Body(), &req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid JSON body"})
	}
	ctx := c.UserContext()
	if ctx == nil {
		ctx = context.Background()
	}
	keys, err := s.keys.CorrectIndexes(ctx, req.QuizID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	result, err := grade.Attempt(grade.Request{
		QuizID:           req.QuizID,
		Answers:          req.Answers,
		StartedAt:        req.StartedAt,
		SubmittedAt:      req.SubmittedAt,
		TimeLimitSeconds: req.TimeLimitSeconds,
	}, keys)
	if errors.Is(err, grade.ErrTimedOut) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":         err.Error(),
			"timed_out":     true,
			"score_correct": result.ScoreCorrect,
			"score_total":   result.ScoreTotal,
			"percent":       result.Percent,
			"per_item":      result.PerItem,
		})
	}
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(result)
}
