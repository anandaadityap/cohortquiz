package generate

import (
	"context"
	"crypto/sha256"
	"fmt"
	"regexp"
	"strings"
	"unicode"
)

type Question struct {
	Stem          string   `json:"stem"`
	Options       []string `json:"options"`
	CorrectIndex  int      `json:"correct_index"`
	Explanation   string   `json:"explanation"`
	SourceExcerpt string   `json:"source_excerpt"`
	Difficulty    string   `json:"difficulty,omitempty"`
	BloomTag      string   `json:"bloom_tag,omitempty"`
}

type Input struct {
	Title           string
	Content         string
	Count           int
	OptionsPerItem  int
	Difficulty      string
	Locale          string
}

type Result struct {
	Items         []Question `json:"items"`
	Model         string     `json:"model"`
	PromptVersion string     `json:"prompt_version"`
}

type Generator interface {
	Name() string
	Generate(ctx context.Context, in Input) (Result, error)
}

func New(openAIKey, model string) Generator {
	if strings.TrimSpace(openAIKey) == "" {
		return Mock{}
	}
	return OpenAI{APIKey: openAIKey, Model: model}
}

func ClampCount(n int) int {
	if n <= 0 {
		return 10
	}
	if n == 1 {
		return 1
	}
	if n < 5 {
		return 5
	}
	if n > 20 {
		return 20
	}
	return n
}

type Mock struct{}

func (Mock) Name() string { return "mock" }

func (Mock) Generate(_ context.Context, in Input) (Result, error) {
	return Result{
		Items:         MockQuestions(in),
		Model:         "mock",
		PromptVersion: "v1",
	}, nil
}

var sentenceSplit = regexp.MustCompile(`(?m)[.!?]+\s+`)

func MockQuestions(in Input) []Question {
	count := ClampCount(in.Count)
	sentences := usableSentences(in.Content)
	if len(sentences) == 0 {
		sentences = []string{
			fmt.Sprintf("%s is the subject of this learning material.", fallbackTitle(in.Title)),
			"Tutors should approve every generated item before publishing a tryout.",
			"Each multiple-choice item has four options and one correct answer.",
		}
	}

	diff := in.Difficulty
	if diff == "" {
		diff = "mixed"
	}

	out := make([]Question, 0, count)
	for i := 0; i < count; i++ {
		src := sentences[i%len(sentences)]
		correct := clip(src, 110)
		distractors := distractorsFor(sentences, i, correct)
		options := []string{correct, distractors[0], distractors[1], distractors[2]}
		perm := permutation(in.Title+src+fmt.Sprint(i), 4)
		shuffled := make([]string, 4)
		correctIndex := 0
		for dest, srcIdx := range perm {
			shuffled[dest] = options[srcIdx]
			if srcIdx == 0 {
				correctIndex = dest
			}
		}
		stem := fmt.Sprintf("According to the material%s, which statement is accurate?", titleClause(in.Title))
		if i%2 == 1 {
			stem = fmt.Sprintf("Based only on the pasted notes%s, select the correct claim.", titleClause(in.Title))
		}
		out = append(out, Question{
			Stem:          stem,
			Options:       shuffled,
			CorrectIndex:  correctIndex,
			Explanation:   "Grounded in this passage from the material: “" + clip(src, 180) + "”",
			SourceExcerpt: clip(src, 220),
			Difficulty:    diff,
			BloomTag:      bloomFor(i),
		})
	}
	return out
}

func bloomFor(i int) string {
	tags := []string{"remember", "understand", "apply", "analyze"}
	return tags[i%len(tags)]
}

func fallbackTitle(title string) string {
	title = strings.TrimSpace(title)
	if title == "" {
		return "The assigned topic"
	}
	return title
}

func titleClause(title string) string {
	title = strings.TrimSpace(title)
	if title == "" {
		return ""
	}
	return " on “" + clip(title, 80) + "”"
}

func usableSentences(content string) []string {
	cleaned := strings.ReplaceAll(content, "\n", " ")
	raw := sentenceSplit.Split(cleaned, -1)
	var out []string
	seen := map[string]bool{}
	for _, s := range raw {
		s = strings.TrimSpace(s)
		s = strings.TrimLeftFunc(s, func(r rune) bool { return !unicode.IsLetter(r) && !unicode.IsNumber(r) })
		if len(s) < 28 || len(s) > 240 {
			continue
		}
		key := strings.ToLower(s)
		if seen[key] {
			continue
		}
		seen[key] = true
		out = append(out, s)
	}
	return out
}

func distractorsFor(sentences []string, i int, correct string) [3]string {
	pool := []string{
		"The material states that this process never occurs in living systems.",
		"According to the notes, measurement and evidence are irrelevant to the topic.",
		"The passage claims the opposite of every definition it introduces.",
		"The text says tutors should skip review and publish every draft question.",
		"The material concludes that students should ignore timed conditions.",
	}
	var picked []string
	for j, s := range sentences {
		if j == i%len(sentences) {
			continue
		}
		cand := clip(s, 110)
		if cand != correct {
			picked = append(picked, cand)
		}
	}
	picked = append(picked, pool...)
	var d [3]string
	for k := 0; k < 3; k++ {
		d[k] = picked[(i+k+1)%len(picked)]
	}
	return d
}

func clip(s string, n int) string {
	s = strings.TrimSpace(s)
	if len(s) <= n {
		return s
	}
	cut := s[:n]
	if i := strings.LastIndex(cut, " "); i > 40 {
		cut = cut[:i]
	}
	return strings.TrimRight(cut, ",;: ") + "…"
}

func permutation(seed string, n int) []int {
	sum := sha256.Sum256([]byte(seed))
	items := make([]int, n)
	for i := 0; i < n; i++ {
		items[i] = i
	}
	for i := n - 1; i > 0; i-- {
		j := int(sum[i]) % (i + 1)
		items[i], items[j] = items[j], items[i]
	}
	return items
}
