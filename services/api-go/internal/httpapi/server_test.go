package httpapi

import (
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/anandaadityap/cohortquiz/services/api-go/internal/generate"
	"github.com/anandaadityap/cohortquiz/services/api-go/internal/store"
)

func TestHealthzContract(t *testing.T) {
	s := NewServer(Config{InternalKey: "secret", Generator: generate.Mock{}})
	req, _ := http.NewRequest(http.MethodGet, "/healthz", nil)
	res, err := s.App.Test(req)
	if err != nil {
		t.Fatal(err)
	}
	if res.StatusCode != 200 {
		t.Fatalf("status %d", res.StatusCode)
	}
	body, _ := io.ReadAll(res.Body)
	if !strings.Contains(string(body), `"status":"ok"`) {
		t.Fatalf("body %s", body)
	}
	if !strings.Contains(string(body), `"service":"cohortquiz-api"`) {
		t.Fatalf("body %s", body)
	}
}

func TestGenerateRequiresInternalKey(t *testing.T) {
	s := NewServer(Config{InternalKey: "secret", Generator: generate.Mock{}})
	req, _ := http.NewRequest(http.MethodPost, "/api/v1/generate-quiz", strings.NewReader(`{}`))
	req.Header.Set("Content-Type", "application/json")
	res, err := s.App.Test(req)
	if err != nil {
		t.Fatal(err)
	}
	if res.StatusCode != 401 {
		t.Fatalf("status %d", res.StatusCode)
	}
}

func TestGenerateValidatesBody(t *testing.T) {
	s := NewServer(Config{InternalKey: "secret", Generator: generate.Mock{}})
	req, _ := http.NewRequest(http.MethodPost, "/api/v1/generate-quiz", strings.NewReader(`{"material_text":"too short"}`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Internal-Key", "secret")
	res, err := s.App.Test(req)
	if err != nil {
		t.Fatal(err)
	}
	if res.StatusCode != 400 {
		t.Fatalf("status %d", res.StatusCode)
	}
}

func TestGradeUsesStoreNotClientKeys(t *testing.T) {
	s := NewServer(Config{
		InternalKey: "secret",
		Generator:   generate.Mock{},
		Keys: store.Memory{Keys: map[string]map[string]int{
			"quiz-1": {"q1": 1},
		}},
	})
	start := time.Now().UTC().Add(-time.Minute).Format(time.RFC3339)
	end := time.Now().UTC().Format(time.RFC3339)
	body := `{"quiz_id":"quiz-1","answers":[{"question_id":"q1","selected_index":1}],"started_at":"` + start + `","submitted_at":"` + end + `","time_limit_seconds":1800}`
	req, _ := http.NewRequest(http.MethodPost, "/api/v1/grade-attempt", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Internal-Key", "secret")
	res, err := s.App.Test(req)
	if err != nil {
		t.Fatal(err)
	}
	if res.StatusCode != 200 {
		raw, _ := io.ReadAll(res.Body)
		t.Fatalf("status %d body %s", res.StatusCode, raw)
	}
	raw, _ := io.ReadAll(res.Body)
	if !strings.Contains(string(raw), `"score_correct":1`) {
		t.Fatalf("body %s", raw)
	}
}
