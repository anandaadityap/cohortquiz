package grade

import (
	"testing"
	"time"
)

func ptr(v int) *int { return &v }

func TestAttemptScoresUnansweredAsWrong(t *testing.T) {
	start := time.Date(2026, 9, 12, 10, 0, 0, 0, time.UTC)
	res, err := Attempt(Request{
		QuizID: "quiz-1",
		Answers: []Answer{
			{QuestionID: "q1", SelectedIndex: ptr(2)},
			{QuestionID: "q2", SelectedIndex: ptr(0)},
			{QuestionID: "q3", SelectedIndex: nil},
		},
		StartedAt:        start,
		SubmittedAt:      start.Add(2 * time.Minute),
		TimeLimitSeconds: 1800,
	}, map[string]int{"q1": 2, "q2": 1, "q3": 3})
	if err != nil {
		t.Fatal(err)
	}
	if res.ScoreCorrect != 1 || res.ScoreTotal != 3 || res.Percent < 33 || res.Percent > 34 {
		t.Fatalf("unexpected result: %+v", res)
	}
	if res.TimedOut {
		t.Fatal("should not be timed out")
	}
}

func TestAttemptRejectsAfterGrace(t *testing.T) {
	start := time.Date(2026, 9, 12, 10, 0, 0, 0, time.UTC)
	_, err := Attempt(Request{
		QuizID:           "quiz-1",
		Answers:          []Answer{{QuestionID: "q1", SelectedIndex: ptr(0)}},
		StartedAt:        start,
		SubmittedAt:      start.Add(61 * time.Second),
		TimeLimitSeconds: 30,
	}, map[string]int{"q1": 0})
	if err != ErrTimedOut {
		t.Fatalf("expected ErrTimedOut, got %v", err)
	}
}

func TestAttemptAcceptsWithinGraceAsTimedOut(t *testing.T) {
	start := time.Date(2026, 9, 12, 10, 0, 0, 0, time.UTC)
	res, err := Attempt(Request{
		QuizID:           "quiz-1",
		Answers:          []Answer{{QuestionID: "q1", SelectedIndex: ptr(0)}},
		StartedAt:        start,
		SubmittedAt:      start.Add(40 * time.Second),
		TimeLimitSeconds: 30,
	}, map[string]int{"q1": 0})
	if err != nil {
		t.Fatal(err)
	}
	if !res.TimedOut {
		t.Fatal("expected timed_out within grace")
	}
	if res.ScoreCorrect != 1 {
		t.Fatalf("expected score 1, got %d", res.ScoreCorrect)
	}
}
