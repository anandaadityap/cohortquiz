package generate

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type OpenAI struct {
	APIKey string
	Model  string
}

func (o OpenAI) Name() string { return "openai" }

func (o OpenAI) Generate(ctx context.Context, in Input) ([]Question, error) {
	model := o.Model
	if model == "" {
		model = "gpt-4o-mini"
	}

	system := `You write multiple-choice questions for a tutoring workspace.
Rules:
- Use ONLY facts present in the provided material. Do not invent facts.
- Each item has exactly 4 options and exactly one correct answer.
- Distractors must be plausible but contradicted or unsupported by the material.
- Explanations must quote or closely paraphrase the supporting sentence.
- Return JSON: {"questions":[{"stem":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"..."}]}`

	user := fmt.Sprintf("Title: %s\nCount: %d\nMaterial:\n%s", in.Title, in.Count, in.Content)
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
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+o.APIKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 45 * time.Second}
	res, err := client.Do(req)
	if err != nil {
		return MockQuestions(in), nil
	}
	defer res.Body.Close()
	raw, _ := io.ReadAll(res.Body)
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return MockQuestions(in), nil
	}

	var parsed struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil || len(parsed.Choices) == 0 {
		return MockQuestions(in), nil
	}

	var envelope struct {
		Questions []Question `json:"questions"`
	}
	content := strings.TrimSpace(parsed.Choices[0].Message.Content)
	if err := json.Unmarshal([]byte(content), &envelope); err != nil {
		return MockQuestions(in), nil
	}

	clean := make([]Question, 0, len(envelope.Questions))
	for _, q := range envelope.Questions {
		if err := validateQuestion(q); err != nil {
			continue
		}
		clean = append(clean, q)
		if len(clean) >= in.Count {
			break
		}
	}
	if len(clean) == 0 {
		return MockQuestions(in), nil
	}
	return clean, nil
}

func validateQuestion(q Question) error {
	if strings.TrimSpace(q.Stem) == "" {
		return fmt.Errorf("empty stem")
	}
	if len(q.Options) != 4 {
		return fmt.Errorf("need 4 options")
	}
	for _, opt := range q.Options {
		if strings.TrimSpace(opt) == "" {
			return fmt.Errorf("empty option")
		}
	}
	if q.CorrectIndex < 0 || q.CorrectIndex > 3 {
		return fmt.Errorf("correctIndex out of range")
	}
	if strings.TrimSpace(q.Explanation) == "" {
		return fmt.Errorf("empty explanation")
	}
	return nil
}
