import Link from "next/link";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">
      <header className="flex items-center justify-between">
        <p className="font-serif text-xl tracking-tight">CohortQuiz</p>
        <Link
          href={session ? "/app" : "/login"}
          className="rounded-full bg-ink px-4 py-2 text-sm text-paper"
        >
          {session ? "Open workspace" : "Tutor sign in"}
        </Link>
      </header>

      <section className="mt-20 grid gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-end">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-moss">Bimbel workspace demo</p>
          <h1 className="mt-4 font-serif text-5xl leading-[1.05] tracking-tight md:text-6xl">
            Paste the notes.
            <br />
            Approve the questions.
            <br />
            Time the tryout.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/75">
            CohortQuiz is a tutoring workspace, not a full LMS. AI drafts multiple-choice items from
            the material you pasted. Nothing reaches students until a tutor approves it. Scores stay
            with the cohort.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login" className="rounded-full bg-clay px-5 py-3 text-sm font-medium text-white">
              Try the tutor demo
            </Link>
            <Link href="/tryout/demo-tryout" className="rounded-full border border-ink/20 px-5 py-3 text-sm">
              Open sample tryout
            </Link>
          </div>
        </div>
        <ol className="paper-card space-y-4 p-6 text-sm leading-relaxed">
          <li>
            <span className="font-medium text-moss">1. Material</span>
            <p className="text-ink/70">Paste a chapter, worksheet, or class notes.</p>
          </li>
          <li>
            <span className="font-medium text-moss">2. Draft MCQs</span>
            <p className="text-ink/70">Next.js calls the Go generator over HTTP. Drafts stay unpublished.</p>
          </li>
          <li>
            <span className="font-medium text-moss">3. Human review</span>
            <p className="text-ink/70">Approve or reject every item before a tryout exists.</p>
          </li>
          <li>
            <span className="font-medium text-moss">4. Timed CBT + scores</span>
            <p className="text-ink/70">Share a link. Go grades the attempt. The tutor sees the cohort.</p>
          </li>
        </ol>
      </section>
    </main>
  );
}
