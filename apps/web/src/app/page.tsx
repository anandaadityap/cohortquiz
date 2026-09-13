import Link from "next/link";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">
      <header className="flex items-center justify-between">
        <p className="font-serif text-xl tracking-tight">CohortQuiz</p>
        <Link
          href={session ? "/dashboard" : "/login"}
          className="rounded-full bg-ink px-4 py-2 text-sm text-paper"
        >
          {session ? "Open workspace" : "Sign in"}
        </Link>
      </header>

      <section className="mt-20 grid gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-end">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-moss">Tutoring workspace</p>
          <h1 className="mt-4 font-serif text-5xl leading-[1.05] tracking-tight md:text-6xl">
            Paste the notes.
            <br />
            Review the questions.
            <br />
            Time the tryout.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/75">
            CohortQuiz is a tutoring workspace, not a full LMS. Paste this week’s notes, review AI-drafted questions,
            then share a timed test link. Scores stay with your cohort.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login" className="rounded-full bg-clay px-5 py-3 text-sm font-medium text-white">
              Sign in
            </Link>
            <Link href="/register" className="rounded-full border border-ink/20 px-5 py-3 text-sm">
              Register
            </Link>
            <Link href="/t/cq-demo-photosynthesis" className="rounded-full border border-ink/20 px-5 py-3 text-sm">
              Open sample tryout
            </Link>
          </div>
        </div>
        <ol className="paper-card space-y-4 p-6 text-sm leading-relaxed">
          <li>
            <span className="font-medium text-moss">1. Notes</span>
            <p className="text-ink/70">Paste a chapter, worksheet, or class notes. PDF, .txt, and .md are allowed.</p>
          </li>
          <li>
            <span className="font-medium text-moss">2. Review questions</span>
            <p className="text-ink/70">Edit, drop, or regenerate items. Nothing reaches students until you share.</p>
          </li>
          <li>
            <span className="font-medium text-moss">3. Share a timed link</span>
            <p className="text-ink/70">Copy a WhatsApp-ready URL. Students sit the test under their name.</p>
          </li>
          <li>
            <span className="font-medium text-moss">4. See who needs help</span>
            <p className="text-ink/70">Roster and per-question scores live on the same tryout page.</p>
          </li>
        </ol>
      </section>
    </main>
  );
}
