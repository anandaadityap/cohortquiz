package grade

import "fmt"

type Request struct {
	Items []Item `json:"items"`
}

type Item struct {
	QuestionID    string `json:"questionId"`
	SelectedIndex *int   `json:"selectedIndex"`
	CorrectIndex  int    `json:"correctIndex"`
}

type ItemResult struct {
	QuestionID    string `json:"questionId"`
	SelectedIndex *int   `json:"selectedIndex"`
	CorrectIndex  int    `json:"correctIndex"`
	Correct       bool   `json:"correct"`
}

type Result struct {
	Correct    int          `json:"correct"`
	Total      int          `json:"total"`
	Score      int          `json:"score"`
	Percentage int          `json:"percentage"`
	Items      []ItemResult `json:"items"`
}

func Attempt(req Request) (Result, error) {
	if len(req.Items) == 0 {
		return Result{}, fmt.Errorf("items must not be empty")
	}

	out := Result{
		Total: len(req.Items),
		Items: make([]ItemResult, 0, len(req.Items)),
	}

	for _, item := range req.Items {
		if item.QuestionID == "" {
			return Result{}, fmt.Errorf("questionId is required")
		}
		if item.CorrectIndex < 0 {
			return Result{}, fmt.Errorf("correctIndex must be >= 0")
		}
		ok := item.SelectedIndex != nil && *item.SelectedIndex == item.CorrectIndex
		if ok {
			out.Correct++
		}
		out.Items = append(out.Items, ItemResult{
			QuestionID:    item.QuestionID,
			SelectedIndex: item.SelectedIndex,
			CorrectIndex:  item.CorrectIndex,
			Correct:       ok,
		})
	}

	out.Score = out.Correct
	if out.Total > 0 {
		out.Percentage = (out.Correct * 100) / out.Total
	}
	return out, nil
}
