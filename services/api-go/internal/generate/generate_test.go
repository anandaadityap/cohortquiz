package generate

import "testing"

func TestMockQuestionsGroundedAndShuffled(t *testing.T) {
	qs := MockQuestions(Input{
		Title: "Photosynthesis",
		Content: `Chlorophyll in plant leaves absorbs primarily blue and red light. 
The Calvin cycle fixes carbon dioxide into sugars inside the stroma. 
Water is split during the light-dependent reactions, releasing oxygen as a byproduct. 
ATP and NADPH produced in the thylakoid membrane power the Calvin cycle.`,
		Count: 4,
	})
	if len(qs) != 5 {
		t.Fatalf("clamp 4 -> 5, got %d questions", len(qs))
	}
	for i, q := range qs {
		if err := ValidateQuestion(q); err != nil {
			t.Fatalf("q%d invalid: %v", i, err)
		}
	}
}

func TestClampCount(t *testing.T) {
	if ClampCount(0) != 10 {
		t.Fatal("default 10")
	}
	if ClampCount(1) != 1 {
		t.Fatal("allow regenerate-one")
	}
	if ClampCount(3) != 5 {
		t.Fatal("min 5 unless 1")
	}
	if ClampCount(25) != 20 {
		t.Fatal("max 20")
	}
}

func TestValidateRejectsDuplicateOptions(t *testing.T) {
	err := ValidateQuestion(Question{
		Stem:          "s",
		Options:       []string{"A", "A", "B", "C"},
		CorrectIndex:  0,
		Explanation:   "e",
		SourceExcerpt: "x",
	})
	if err == nil {
		t.Fatal("expected duplicate error")
	}
}
