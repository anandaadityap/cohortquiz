# CohortQuiz

Paste this week’s notes. Review the questions. Time the tryout.

A tutoring / bimbel workspace: AI drafts multiple-choice items from *your* material, you review them, then you share a timed CBT link and read cohort scores the same evening.

This is not a full LMS, not a CPNS consumer app, and not a billing product.

[Case study](docs/CASE_STUDY.md)

![Landing — paste notes, review questions, time the tryout](docs/screenshots/landing.png)

![Tutor workspace with live tryouts, student links, and score vs in-progress counts](docs/screenshots/workspace.png)

![Tryout roster: submitted scores and in-progress students on one page](docs/screenshots/tryout.png)

## Try it

| | |
| --- | --- |
| **App** | [http://localhost:3000](http://localhost:3000) after the happy path below |
| **Tutor** | `demo@cohortquiz.dev` / `Demo123!` (documented here only; the login form is empty) |
| **Sample tryout** | [/t/cq-demo-photosynthesis](http://localhost:3000/t/cq-demo-photosynthesis) |

Five-minute loop: sign in → **Workspace** → open the photosynthesis tryout (link stays visible) → or **Create tryout**, paste notes, review, share. Students enter a name at `/t/[token]`. Scores and per-question % land on `/tryouts/[id]`.

Question edits stay open until the first student **starts**. Publishing a tryout marks the quiz approved. Materials and quiz preview stay as a secondary library.

## Happy path (local)

You need Node 20+, Go 1.22+, and PostgreSQL 16. Docker Compose is the one-command path if you have Docker.

### Option A — Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000).

The web container runs Prisma migrations and seed on boot. The Go API (Fiber v2) serves `GET /healthz`, `POST /api/v1/generate-quiz`, and `POST /api/v1/grade-attempt`. Leave `OPENAI_API_KEY` empty to use the mock generator.

### Option B — three processes

```bash
export DATABASE_URL=postgresql://cohortquiz:cohortquiz@localhost:5432/cohortquiz?schema=public
export INTERNAL_API_KEY=dev-internal-key-change-me
export CORS_ORIGIN=http://localhost:3000

# 2. Go API
cd services/api-go
go test ./...
go run ./cmd/api

# 3. Next.js
cd apps/web
cp .env.example .env
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Then:

1. Sign in as the seeded tutor (or register at `/register`).
2. Open **Workspace**. The seeded photosynthesis tryout is live; the student link stays visible.
3. Click **Create tryout**, paste notes, review questions, then share a timed link.
4. Students open `/t/[token]`, enter a name, and sit the timed CBT.
5. Scores and per-question % land on `/tryouts/[id]` (CSV export on that page).

## Architecture

```
browser  →  Next.js (Auth.js, Prisma, UI)
                │  HTTP + X-Internal-Key
                ▼
            Go Fiber API  →  OpenAI (optional) or mock generator
                │
Postgres ◄── Prisma (schema owner)
     ▲
     └── Go reads question answer keys for grading
```

- LLM calls happen only in `services/api-go`. The browser never sees the API key.
- If `OPENAI_API_KEY` is unset, Go returns deterministic, material-grounded mock items.
- If the key **is** set and the model fails, Go retries once and then returns 502/504 — it does not silently swap in mock items.
- Tryouts attach to an **approved** quiz. Sharing a tryout sets `approved`. Draft quizzes cannot be opened by students.
- Question content locks when the **first student starts**, not merely when the quiz is approved.
- The student URL is stored (raw token + hash) so tutors can copy it again. Hash is still used for lookup.
- Framework note: PRD OD4 defaulted to chi; this repo uses **Fiber v2**. HTTP contracts still match PRD §7.3 (`/api/v1`, snake_case JSON).

## Go contracts

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/healthz` and `/api/v1/healthz` | public |
| POST | `/api/v1/generate-quiz` | `X-Internal-Key` + rate limit |
| POST | `/api/v1/grade-attempt` | `X-Internal-Key` |

`GET /healthz` → `{ "status": "ok", "service": "cohortquiz-api", "time": "<RFC3339>" }`

## Layout

| Path | Role |
| --- | --- |
| `apps/web` | Next.js App Router, Tailwind, Auth.js credentials, Prisma |
| `services/api-go` | Fiber REST: health, generate, grade |
| `docs/CASE_STUDY.md` | Product narrative and Upwork-oriented bullets |
| `docs/screenshots/` | Landing, workspace, and tryout roster |

Tutor sitemap: `/dashboard` (workspace), `/tryouts/new`, `/tryouts/[id]`, `/materials`, `/quizzes`. Student: `/t/[token]`.

## Environment

See `.env.example`. Next reads `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `API_GO_URL`, and `INTERNAL_API_KEY`. Go reads `PORT`, `DATABASE_URL`, `INTERNAL_API_KEY`, `CORS_ORIGIN`, `OPENAI_API_KEY`, and `OPENAI_MODEL`.

## Out of scope

Stripe, CPNS marketplace flows, student social features, and a full LMS (attendance, homework, live class).
