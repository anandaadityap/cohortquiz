package generate

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

var (
	ErrLLM     = errors.New("quiz generation failed")
	ErrTimeout = errors.New("quiz generation timed out")
)

type OpenAI struct {
	APIKey string
	Model  string
}

func (o OpenAI) Name() string { return "openai" }

func (o OpenAI) Generate(ctx context.Context, in Input) (Result, error) {
	var last error
	for attempt := 0; attempt < 2; attempt++ {
		res, err := o.generateOnce(ctx, in)
		if err == nil {
			return res, nil
		}
		last = err
		if errors.Is(err, ErrTimeout) {
			return Result{}, err
		}
	}
	if last == nil {
		last = ErrLLM
	}
	return Result{}, last
}

func (o OpenAI) generateOnce(ctx context.Context, in Input) (Result, error) {
	model := o.Model
	if model == "" {
		model = "gpt-4o-mini"
	}

	system := `You write multiple-choice questions for a tutoring workspace.
Rules:
- Use ONLY facts present in the provided material. Do not invent facts.
- If the material is insufficient, return fewer items rather than guessing.
- Each item has exactly 4 unique options and exactly one correct answer.
- Distractors must be plausible but contradicted or unsupported by the material.
- Explanations must quote or closely paraphrase the supporting sentence.
- source_excerpt must be a short quote copied from the material.
- difficulty is one of: easy, medium, hard, mixed.
- bloom_tag is one of: remember, understand, apply, analyze.
- Return JSON: {"questions":[{"stem":"...","options":["...","...","...","..."],"correct_index":0,"explanation":"...","source_excerpt":"...","difficulty":"medium","bloom_tag":"understand"}]}`

	user := fmt.Sprintf(
		"Title: %s\nCount: %d\nOptions per item: %d\nDifficulty: %s\nLocale: %s\nMaterial:\n%s",
		in.Title, in.Count, in.OptionsPerItem, in.Difficulty, in.Locale, in.Content,
	)
	payload := map[string]any{
		"model": model,
		"response_format": map[string]string{
			"type": "json_object",
		},
		"temperature": 0.3,
		"messages": []map[string]string{
			{"role": "system", "content": system},
			{"role": "user", "content": user},
		},
	}
	body, _ := json.Marshal(payload)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.openai.com/v1/chat/completions", bytes.NewReader(body))
	if err != nil {
		return Result{}, err
	}
	req.Header.Set("Authorization", "Bearer "+o.APIKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 45 * time.Second}
	res, err := client.Do(req)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) || strings.Contains(err.Error(), "Timeout") {
			return Result{}, ErrTimeout
		}
		return Result{}, fmt.Errorf("%w: %v", ErrLLM, err)
	}
	defer res.Body.Close()
	raw, _ := io.ReadAll(res.Body)
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return Result{}, fmt.Errorf("%w: status %d", ErrLLM, res.StatusCode)
	}

	var parsed struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil || len(parsed.Choices) == 0 {
		return Result{}, fmt.Errorf("%w: invalid completion envelope", ErrLLM)
	}

	var envelope struct {
		Questions []Question `json:"questions"`
		Items     []Question `json:"items"`
	}
	content := strings.TrimSpace(parsed.Choices[0].Message.Content)
	if err := json.Unmarshal([]byte(content), &envelope); err != nil {
		return Result{}, fmt.Errorf("%w: invalid JSON payload", ErrLLM)
	}
	items := envelope.Questions
	if len(items) == 0 {
		items = envelope.Items
	}
	clean := FilterValid(items, in.Count)
	if len(clean) == 0 {
		return Result{}, fmt.Errorf("%w: no schema-valid items", ErrLLM)
	}
	return Result{
		Items:         clean,
		Model:         model,
		PromptVersion: "v1",
	}, nil
}
