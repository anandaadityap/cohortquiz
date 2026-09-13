package store

import "testing"

func TestNormalizeDatabaseURLStripsPrismaSchema(t *testing.T) {
	got := NormalizeDatabaseURL("postgresql://cohortquiz:cohortquiz@localhost:5432/cohortquiz?schema=public")
	if got != "postgresql://cohortquiz:cohortquiz@localhost:5432/cohortquiz?sslmode=disable" {
		t.Fatalf("got %s", got)
	}
}
