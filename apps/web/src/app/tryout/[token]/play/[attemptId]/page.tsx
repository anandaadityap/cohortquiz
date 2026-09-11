import { notFound, redirect } from "next/navigation";
import { TryoutPlayer } from "@/components/tryout-player";
import { asStringArray } from "@/lib/options";
import { prisma } from "@/lib/prisma";

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
          questions: { include: { question: true }, orderBy: { position: "asc" } },
        },
      },
    },
  });
  if (!attempt || attempt.tryout.token !== token) notFound();
  if (attempt.submittedAt) {
    redirect(`/tryout/${token}/result/${attempt.id}`);
  }

  const questions = attempt.tryout.questions
    .filter((row) => row.question.status === "APPROVED")
    .map((row) => ({
      id: row.questionId,
      stem: row.question.stem,
      options: asStringArray(row.question.options),
      position: row.position,
    }));

  return (
    <TryoutPlayer
      attemptId={attempt.id}
      durationMinutes={attempt.tryout.durationMinutes}
      startedAt={attempt.startedAt.toISOString()}
      questions={questions}
    />
  );
}
