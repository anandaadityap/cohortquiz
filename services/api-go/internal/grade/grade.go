package grade

import (
	"errors"
	"fmt"
	"time"
)

const GraceSeconds = 30

var ErrTimedOut = errors.New("time limit exceeded")

type Request struct {
	QuizID           string    `json:"quiz_id"`
	Answers          []Answer  `json:"answers"`
	StartedAt        time.Time `json:"started_at"`
	SubmittedAt      time.Time `json:"submitted_at"`
	TimeLimitSeconds int       `json:"time_limit_seconds"`
}

type Answer struct {
	QuestionID    string `json:"question_id"`
	SelectedIndex *int   `json:"selected_index"`
}

type ItemResult struct {
	QuestionID    string `json:"question_id"`
	Correct       bool   `json:"correct"`
	CorrectIndex  int    `json:"correct_index"`
	SelectedIndex *int   `json:"selected_index"`
}

type Result struct {
	ScoreCorrect int          `json:"score_correct"`
	ScoreTotal   int          `json:"score_total"`
	Percent      float64      `json:"percent"`
	TimedOut     bool         `json:"timed_out"`
	PerItem      []ItemResult `json:"per_item"`
}

func Attempt(req Request, keys map[string]int) (Result, error) {
	if req.QuizID == "" {
		return Result{}, fmt.Errorf("quiz_id is required")
	}
	if len(keys) == 0 {
		return Result{}, fmt.Errorf("quiz has no questions")
	}
	if req.TimeLimitSeconds <= 0 {
		return Result{}, fmt.Errorf("time_limit_seconds must be > 0")
	}
	if req.StartedAt.IsZero() || req.SubmittedAt.IsZero() {
		return Result{}, fmt.Errorf("started_at and submitted_at are required")
	}

	selected := map[string]*int{}
	for _, a := range req.Answers {
		if a.QuestionID == "" {
			return Result{}, fmt.Errorf("question_id is required")
		}
		selected[a.QuestionID] = a.SelectedIndex
	}

	elapsed := req.SubmittedAt.Sub(req.StartedAt)
	limit := time.Duration(req.TimeLimitSeconds) * time.Second
	grace := time.Duration(GraceSeconds) * time.Second
	timedOut := elapsed > limit
	if elapsed > limit+grace {
		out := score(keys, selected)
		out.TimedOut = true
		return out, ErrTimedOut
	}

	out := score(keys, selected)
	out.TimedOut = timedOut
	return out, nil
}

func score(keys map[string]int, selected map[string]*int) Result {
	out := Result{
		ScoreTotal: len(keys),
		PerItem:    make([]ItemResult, 0, len(keys)),
	}
	for questionID, correctIndex := range keys {
		choice := selected[questionID]
		ok := choice != nil && *choice == correctIndex
		if ok {
			out.ScoreCorrect++
		}
		out.PerItem = append(out.PerItem, ItemResult{
			QuestionID:    questionID,
			Correct:       ok,
			CorrectIndex:  correctIndex,
			SelectedIndex: choice,
		})
	}
	if out.ScoreTotal > 0 {
		out.Percent = float64(out.ScoreCorrect) * 100.0 / float64(out.ScoreTotal)
	}
	return out
}
