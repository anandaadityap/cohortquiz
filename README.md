# CohortQuiz

Tutoring / bimbel workspace: paste learning materials, let AI draft multiple-choice items grounded in that text, **approve them**, share a timed CBT tryout link, and read cohort scores.

This is a demo product — not a full LMS, not a CPNS consumer app, and not a billing product.

## Happy path (local)

You need Node 20+, Go 1.22+, and PostgreSQL 16. Docker Compose is the one-command path if you have Docker.

### Option A — Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000).

- Tutor: `tutor@cohortquiz.demo` / `demo1234`
- Sample tryout: [http://localhost:3000/tryout/demo-tryout](http://localhost:3000/tryout/demo-tryout)

The web container runs Prisma migrations and seed on boot. The Go API serves `GET /healthz`, `POST /v1/generate-quiz`, and `POST /v1/grade-attempt`. Leave `OPENAI_API_KEY` empty to use the mock generator.

### Option B — three processes

```bash
# 1. Postgres (example)
# createdb cohortquiz && createuser cohortquiz ...
export DATABASE_URL=postgresql://cohortquiz:cohortquiz@localhost:5432/cohortquiz?schema=public

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

1. Sign in as the seeded tutor.
2. Open **Photosynthesis for SMA IPA**.
3. Review drafts — approve before publishing (a sample tryout is already published from five approved items; one extra question stays in `DRAFT` on purpose).
4. Click **Draft with Go generator** to add more unpublished items (Next.js → HTTP → Go).
5. Open the student link, sit the timed CBT, submit. Grading is `POST /v1/grade-attempt` on the Go service.
6. Back in the tutor workspace, open the tryout to see cohort scores.

## Architecture

```
browser  →  Next.js (Auth.js, Prisma, UI)
                │  HTTP
                ▼
            Go API  →  OpenAI (optional) or mock generator
                │
Postgres ◄── Prisma (owned by the web app)
```

- LLM calls happen only in `services/api-go`. The browser never sees the API key.
- If `OPENAI_API_KEY` is unset, Go returns deterministic, material-grounded mock items.
- Tryouts copy **approved** questions only. Drafts cannot be published.

## Layout

| Path | Role |
| --- | --- |
| `apps/web` | Next.js App Router, Tailwind, Auth.js credentials, Prisma |
| `services/api-go` | REST: health, generate, grade |
| `docs/CASE_STUDY.md` | Product narrative and Upwork-oriented bullets |

## Environment

See `.env.example`. The Next.js app reads `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, and `API_GO_URL`. The Go process reads `PORT`, `OPENAI_API_KEY`, and `OPENAI_MODEL`.

## Out of scope

Stripe, CPNS marketplace flows, student social features, and a full LMS (attendance, homework, live class).
