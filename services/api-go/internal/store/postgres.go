package store

import (
	"context"
	"fmt"
	"net/url"

	"github.com/jackc/pgx/v5/pgxpool"
)

type KeyStore interface {
	CorrectIndexes(ctx context.Context, quizID string) (map[string]int, error)
}

type Postgres struct {
	pool *pgxpool.Pool
}

func NormalizeDatabaseURL(raw string) string {
	u, err := url.Parse(raw)
	if err != nil {
		return raw
	}
	q := u.Query()
	q.Del("schema")
	if q.Get("sslmode") == "" {
		q.Set("sslmode", "disable")
	}
	u.RawQuery = q.Encode()
	return u.String()
}

func NewPostgres(ctx context.Context, databaseURL string) (*Postgres, error) {
	pool, err := pgxpool.New(ctx, NormalizeDatabaseURL(databaseURL))
	if err != nil {
		return nil, err
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, err
	}
	return &Postgres{pool: pool}, nil
}

func (p *Postgres) Close() {
	if p != nil && p.pool != nil {
		p.pool.Close()
	}
}

func (p *Postgres) CorrectIndexes(ctx context.Context, quizID string) (map[string]int, error) {
	rows, err := p.pool.Query(ctx, `SELECT id, correct_index FROM questions WHERE quiz_id = $1 ORDER BY position`, quizID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := map[string]int{}
	for rows.Next() {
		var id string
		var idx int
		if err := rows.Scan(&id, &idx); err != nil {
			return nil, err
		}
		out[id] = idx
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if len(out) == 0 {
		return nil, fmt.Errorf("quiz not found or has no questions")
	}
	return out, nil
}

type Memory struct {
	Keys map[string]map[string]int
}

func (m Memory) CorrectIndexes(_ context.Context, quizID string) (map[string]int, error) {
	keys, ok := m.Keys[quizID]
	if !ok || len(keys) == 0 {
		return nil, fmt.Errorf("quiz not found or has no questions")
	}
	return keys, nil
}
