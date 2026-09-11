# CohortQuiz case study

English write-up for a tutoring / bimbel workspace demo. Useful as a portfolio piece and as Upwork proposal source material.

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

- Tutor signs in (credentials). Seed: `tutor@cohortquiz.demo` / `demo1234`.
- Paste material → Next.js calls Go `POST /v1/generate-quiz` → items stored as **drafts**.
- Approve / reject in the workspace. Publishing a tryout copies approved items only.
- Public timed CBT at `/tryout/:token`. Submit → Next.js calls Go `POST /v1/grade-attempt` → score stored.
- Cohort roster on the tryout page.
- Mock generator when `OPENAI_API_KEY` is missing so the demo always runs.

## Architecture choices

- **Monorepo, two runtimes.** UI and auth in Next.js; generation and grading in Go so those jobs stay easy to scale or swap.
- **Prisma owns Postgres.** The Go service is stateless HTTP. The web app is the source of truth for users, materials, and attempts.
- **Server-side LLM only.** The browser never talks to OpenAI or to the generator with privileged payloads it should not see (correct keys are attached only on the server when grading).
- **Approval is a hard gate**, not a UI hint. Draft questions cannot be attached to a tryout.

## Non-goals (on purpose)

- Stripe / subscriptions
- CPNS B2C catalog and marketing site
- Full LMS: attendance, assignments, live video, parent portals

## Demo script (five minutes)

1. Open `/login`, use the seeded tutor.
2. Open the photosynthesis material. Note one leftover **draft**.
3. Generate more drafts (works without an OpenAI key).
4. Approve an item, then publish a tryout — or use the seeded `demo-tryout`.
5. In a private window, sit the tryout as a student.
6. Return to the tutor tryout page and point at the score table.

## Upwork-oriented bullets

Use or adapt:

- Built a tutoring workspace that turns pasted notes into reviewable MCQs, then a timed CBT tryout with cohort scores — without standing up a full LMS.
- Split the system into Next.js (App Router, Auth.js, Prisma) and a small Go API for `generate-quiz` and `grade-attempt`, with HTTP as the only coupling.
- Kept LLM usage server-side, with a mock generator so local and client demos do not depend on a paid key.
- Enforced a human approval gate: unpublished drafts cannot appear on student tryouts.
- Shipped Docker Compose, Prisma migrations, a deterministic seed account, and a documented happy path.
- Designed the product around bimbel tutors (materials → tryout link → roster), not a generic quiz toy.

## What a follow-on engagement could add

Item banking across terms, PDF upload / OCR, richer analytics, SSO for a school, or exporting tryouts to paper. Those are scoped extras, not pretenses that this demo already is an LMS.
