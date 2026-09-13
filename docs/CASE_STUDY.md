# CohortQuiz case study

English write-up for a tutoring / bimbel workspace demo. Useful as a portfolio piece and as Upwork proposal source material. Product screenshots live in [screenshots](./screenshots).

## Problem

Small tutoring centers (bimbingan belajar) already have notes, worksheets, and a WhatsApp group. What they lack is a tight loop:

1. Turn this week's material into exam-style MCQs without inventing facts.
2. Keep a human in the loop so a bad model output never reaches students.
3. Run a timed computer-based tryout from a link.
4. See the cohort's scores the same evening.

They do not need a campus LMS, a CPNS consumer funnel, or a payments platform.

## Audience

Tutors and small bimbel owners who already teach a fixed syllabus (SMA IPA, English, accounting, etc.) and want tryouts that stay faithful to *their* notes.

## What shipped in this repo

- Tutor registers or signs in (credentials). Seed: `demo@cohortquiz.dev` / `Demo123!`.
- Paste or upload material (txt/md/pdf) → Next.js calls Go `POST /api/v1/generate-quiz` → a **draft quiz** is stored.
- Review UI: edit stem/options/key, delete, regenerate one item, Bloom/difficulty tags. Approve freezes the quiz.
- Public timed CBT at `/t/:token` (hashed at rest). Submit → Next.js calls Go `POST /api/v1/grade-attempt` with `quiz_id`. Go loads the answer key from Postgres.
- Analytics: attempts, mean, score buckets, per-item % correct, CSV export.
- Mock generator when `OPENAI_API_KEY` is missing so the demo always runs. Failures with a live key are retried once, then returned as errors.

## Architecture choices

- **Monorepo, two runtimes.** UI and auth in Next.js; generation and grading in Go (Fiber v2) so those jobs stay easy to scale or swap. PRD OD4 listed chi as the default; Fiber is an explicit substitution — the HTTP contract is unchanged.
- **Prisma owns Postgres.** Next.js writes users, materials, quizzes, tryouts, and attempts. Go **reads** `questions.correct_index` by `quiz_id` when grading.
- **Server-side LLM only.** Shared `X-Internal-Key` between Next and Go. CORS allowlists the Next origin.
- **Approval is a hard gate**, not a UI hint. Only `approved` quizzes can be published as tryouts.

## Non-goals (on purpose)

- Stripe / subscriptions
- CPNS B2C catalog and marketing site
- Full LMS: attendance, assignments, live video, parent portals

## Demo script (five minutes)

1. Open `/login`, use the seeded tutor (or `/register`).
2. Open the photosynthesis material. Generate a new draft or open the seeded quiz.
3. On `/quizzes/[id]/preview`, note that approved items are frozen.
4. Publish a tryout — or use `/t/cq-demo-photosynthesis`.
5. In a private window, sit the tryout as **Andi**.
6. Return to `/quizzes/[id]/analytics` and point at the score table / CSV.

## Upwork-oriented bullets

Use or adapt:

- Built a tutoring workspace that turns pasted notes into reviewable MCQs, then a timed CBT tryout with cohort scores — without standing up a full LMS.
- Split the system into Next.js (App Router, Auth.js, Prisma) and a Go Fiber API for `generate-quiz` and `grade-attempt`, with HTTP + an internal service key as the only coupling.
- Graded attempts in Go against Postgres answer keys (not client-supplied indexes), with server-side timer enforcement.
- Kept LLM usage server-side, with a mock generator so local and client demos do not depend on a paid key.
- Enforced a human approval gate: draft quizzes cannot appear on student tryouts.
- Shipped Docker Compose, Prisma migrations, a deterministic seed account, and a documented happy path.

## What a follow-on engagement could add

Item banking across terms, richer analytics, SSO for a school, or exporting tryouts to paper. Those are scoped extras, not pretenses that this demo already is an LMS.
