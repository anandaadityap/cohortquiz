import Link from "next/link";
import { notFound } from "next/navigation";
import { asStringArray, letters } from "@/lib/options";
import { prisma } from "@/lib/prisma";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ token: string; attemptId: string }>;
}) {
  const { token, attemptId } = await params;
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      tryout: {
        include: {
          questions: { include: { question: true }, orderBy: { position: "asc" } },
        },
      },
    },
  });
  if (!attempt || attempt.tryout.token !== token || !attempt.submittedAt) notFound();

  const answers = (attempt.answers ?? {}) as Record<string, number | null>;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <p className="font-serif text-2xl">CohortQuiz</p>
      <section className="paper-card mt-6 p-6">
        <p className="text-sm text-moss">Attempt complete</p>
        <h1 className="mt-1 font-serif text-4xl">{attempt.tryout.title}</h1>
        <p className="mt-3 text-lg">
          {attempt.displayName}: {attempt.score}/{attempt.total} ({attempt.percentage}%)
          {attempt.late ? " · submitted late" : ""}
        </p>
        <p className="mt-2 text-sm text-ink/60">Graded by the Go API from the server, not in the browser.</p>
      </section>
      <section className="mt-6 space-y-4">
        {attempt.tryout.questions
          .filter((row) => row.question.status === "APPROVED")
          .map((row, index) => {
            const options = asStringArray(row.question.options);
            const selected = answers[row.questionId];
            const correct = selected === row.question.correctIndex;
            return (
              <article key={row.questionId} className="paper-card p-5">
                <p className="text-sm text-ink/50">
                  {index + 1}. {correct ? "Correct" : "Incorrect"}
                </p>
                <h2 className="mt-1 font-medium">{row.question.stem}</h2>
                <ol className="mt-3 space-y-1 text-sm">
                  {options.map((option, optionIndex) => (
                    <li key={option + optionIndex}>
                      {letters(optionIndex)}. {option}
                      {optionIndex === row.question.correctIndex ? " (answer)" : ""}
                      {selected === optionIndex && optionIndex !== row.question.correctIndex
                        ? " (your choice)"
                        : ""}
                    </li>
                  ))}
                </ol>
                <p className="mt-3 text-sm text-ink/65">{row.question.explanation}</p>
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
