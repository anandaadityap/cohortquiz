package grade

import "testing"

func ptr(v int) *int { return &v }

func TestAttemptScoresUnansweredAsWrong(t *testing.T) {
	res, err := Attempt(Request{Items: []Item{
		{QuestionID: "q1", SelectedIndex: ptr(2), CorrectIndex: 2},
		{QuestionID: "q2", SelectedIndex: ptr(0), CorrectIndex: 1},
		{QuestionID: "q3", SelectedIndex: nil, CorrectIndex: 3},
	}})
	if err != nil {
		t.Fatal(err)
	}
	if res.Correct != 1 || res.Total != 3 || res.Percentage != 33 {
		t.Fatalf("unexpected result: %+v", res)
	}
	if res.Items[2].Correct {
		t.Fatal("unanswered item should be incorrect")
	}
}

func TestAttemptRejectsEmpty(t *testing.T) {
	if _, err := Attempt(Request{}); err == nil {
		t.Fatal("expected error")
	}
}
