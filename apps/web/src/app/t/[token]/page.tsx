import { notFound } from "next/navigation";
import { startAttempt } from "../actions";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/token";
import { SubmitButton } from "@/components/submit-button";

export default async function TryoutGatePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const tryout = await prisma.tryout.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { quiz: { include: { questions: true } } },
  });
  if (!tryout || !tryout.isActive || tryout.quiz.status !== "approved") notFound();

  const minutes = tryout.durationSeconds / 60;

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
      <p className="text-center font-serif text-2xl">CohortQuiz</p>
      <div className="paper-card mt-8 p-8">
        <h1 className="font-serif text-3xl">{tryout.quiz.title}</h1>
        <p className="mt-3 text-sm text-ink/70">
          {tryout.quiz.questions.length} questions · {minutes} minutes
        </p>
        <p className="mt-4 text-sm text-ink/70">
          You have {minutes} minutes. Unanswered questions score 0.
        </p>
        <form action={startAttempt} className="mt-6 space-y-4">
          <input type="hidden" name="token" value={token} />
          <label className="block text-sm">
            Your full name
            <input
              name="studentLabel"
              required
              minLength={2}
              className="mt-1 w-full rounded-xl border border-line px-3 py-2"
              placeholder="e.g. Andi"
            />
          </label>
          <SubmitButton className="w-full rounded-full bg-ink py-3 text-sm text-paper">Start</SubmitButton>
        </form>
      </div>
    </main>
  );
}
