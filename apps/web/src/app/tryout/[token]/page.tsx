import { notFound } from "next/navigation";
import { startAttempt } from "@/app/tryout/actions";
import { prisma } from "@/lib/prisma";

export default async function TryoutGatePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const tryout = await prisma.tryout.findUnique({
    where: { token },
    include: {
      material: true,
      questions: { include: { question: true } },
    },
  });
  if (!tryout) notFound();
  const count = tryout.questions.filter((q) => q.question.status === "APPROVED").length;

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
      <p className="text-center font-serif text-2xl">CohortQuiz</p>
      <div className="paper-card mt-8 p-8">
        <p className="text-sm uppercase tracking-[0.16em] text-moss">Timed tryout</p>
        <h1 className="mt-2 font-serif text-3xl">{tryout.title}</h1>
        <p className="mt-3 text-sm text-ink/70">
          {count} questions · {tryout.durationMinutes} minutes · sourced from {tryout.material.title}
        </p>
        <form action={startAttempt} className="mt-6 space-y-4">
          <input type="hidden" name="token" value={tryout.token} />
          <label className="block text-sm">
            Your name (shown on the cohort roster)
            <input
              name="displayName"
              required
              minLength={2}
              className="mt-1 w-full rounded-xl border border-line px-3 py-2"
              placeholder="e.g. Budi"
            />
          </label>
          <button type="submit" className="w-full rounded-full bg-ink py-3 text-sm text-paper">
            Start the clock
          </button>
        </form>
      </div>
    </main>
  );
}
