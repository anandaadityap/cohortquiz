import Link from "next/link";
import { notFound } from "next/navigation";
import { asStringArray, letters } from "@/lib/options";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/token";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ token: string; attemptId: string }>;
}) {
  const { token, attemptId } = await params;
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: true,
      tryout: {
        include: {
          quiz: { include: { questions: { orderBy: { position: "asc" } } } },
        },
      },
    },
  });
  if (!attempt || attempt.tryout.tokenHash !== hashToken(token) || !attempt.submittedAt) notFound();

  const selected = new Map(attempt.answers.map((row) => [row.questionId, row.selectedIndex]));

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <p className="font-serif text-2xl">CohortQuiz</p>
      <section className="paper-card mt-6 p-6">
        <p className="text-sm text-moss">Attempt complete</p>
        <h1 className="mt-1 font-serif text-4xl">{attempt.tryout.quiz.title}</h1>
        <p className="text-lg">
          {attempt.scoreCorrect}/{attempt.scoreTotal} ({attempt.percent?.toFixed(0)}%)
          {attempt.timedOut ? " · timed out" : ""}
        </p>
        <p className="mt-2 text-sm text-ink/60">{attempt.studentLabel}</p>
      </section>
      <section className="mt-6 space-y-4">
        {attempt.tryout.quiz.questions.map((question, index) => {
          const options = asStringArray(question.options);
          const choice = selected.get(question.id);
          const unanswered = choice === undefined || choice < 0;
          const correct = choice === question.correctIndex;
          return (
            <article key={question.id} className="paper-card p-5">
              <p className="text-sm text-ink/50">
                {index + 1}. {unanswered ? "Unanswered" : correct ? "Correct" : "Incorrect"}
              </p>
              <h2 className="mt-1 font-medium">{question.stem}</h2>
              <ol className="mt-3 space-y-1 text-sm">
                {options.map((option, optionIndex) => (
                  <li key={option + optionIndex}>
                    {letters(optionIndex)}. {option}
                    {optionIndex === question.correctIndex ? " (answer)" : ""}
                    {choice === optionIndex && optionIndex !== question.correctIndex ? " (your choice)" : ""}
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-sm text-ink/65">{question.explanation}</p>
            </article>
          );
        })}
      </section>
      <p className="mt-8 text-sm">
        <Link className="underline" href="/">
          Back to CohortQuiz
        </Link>
      </p>
    </main>
  );
}
