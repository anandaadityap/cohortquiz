import { notFound, redirect } from "next/navigation";
import { TryoutPlayer } from "@/components/tryout-player";
import { asStringArray } from "@/lib/options";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/token";

export default async function PlayPage({
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
          quiz: { include: { questions: { orderBy: { position: "asc" } } } },
        },
      },
    },
  });
  if (!attempt || attempt.tryout.tokenHash !== hashToken(token) || !attempt.tryout.isActive) notFound();
  if (attempt.submittedAt) {
    redirect(`/t/${token}/result/${attempt.id}`);
  }

  const questions = attempt.tryout.quiz.questions.map((question) => ({
    id: question.id,
    stem: question.stem,
    options: asStringArray(question.options),
    position: question.position,
  }));

  return (
    <TryoutPlayer
      attemptId={attempt.id}
      token={token}
      durationSeconds={attempt.tryout.durationSeconds}
      startedAt={attempt.startedAt.toISOString()}
      questions={questions}
    />
  );
}
