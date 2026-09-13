package generate

import (
	"fmt"
	"strings"
)

func ValidateQuestion(q Question) error {
	if strings.TrimSpace(q.Stem) == "" {
		return fmt.Errorf("empty stem")
	}
	if len(q.Options) != 4 {
		return fmt.Errorf("need 4 options")
	}
	seen := map[string]struct{}{}
	for _, opt := range q.Options {
		opt = strings.TrimSpace(opt)
		if opt == "" {
			return fmt.Errorf("empty option")
		}
		key := strings.ToLower(opt)
		if _, ok := seen[key]; ok {
			return fmt.Errorf("duplicate options")
		}
		seen[key] = struct{}{}
	}
	if q.CorrectIndex < 0 || q.CorrectIndex > 3 {
		return fmt.Errorf("correct_index out of range")
	}
	if strings.TrimSpace(q.Explanation) == "" {
		return fmt.Errorf("empty explanation")
	}
	if strings.TrimSpace(q.SourceExcerpt) == "" {
		return fmt.Errorf("empty source_excerpt")
	}
	return nil
}

func FilterValid(items []Question, limit int) []Question {
	clean := make([]Question, 0, len(items))
	for _, q := range items {
		if err := ValidateQuestion(q); err != nil {
			continue
		}
		clean = append(clean, q)
		if limit > 0 && len(clean) >= limit {
			break
		}
	}
	return clean
}
