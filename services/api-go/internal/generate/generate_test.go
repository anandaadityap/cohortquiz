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
	if len(qs) != 4 {
		t.Fatalf("got %d questions", len(qs))
	}
	for i, q := range qs {
		if len(q.Options) != 4 {
			t.Fatalf("q%d options=%d", i, len(q.Options))
		}
		if q.CorrectIndex < 0 || q.CorrectIndex > 3 {
			t.Fatalf("q%d correctIndex=%d", i, q.CorrectIndex)
		}
		if q.Stem == "" || q.Explanation == "" {
			t.Fatalf("q%d missing text", i)
		}
	}
}
