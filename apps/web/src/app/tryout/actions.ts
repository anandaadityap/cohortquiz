"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { gradeAttemptWithGo } from "@/lib/go-client";
import { prisma } from "@/lib/prisma";

export async function startAttempt(formData: FormData) {
  const parsed = z
    .object({
      token: z.string().min(1),
      displayName: z.string().trim().min(2).max(80),
    })
    .safeParse({
      token: formData.get("token"),
      displayName: formData.get("displayName"),
    });
  if (!parsed.success) {
    throw new Error("Enter a name with at least 2 characters.");
  }

  const tryout = await prisma.tryout.findUnique({
    where: { token: parsed.data.token },
    include: { questions: { include: { question: true } } },
  });
  if (!tryout) {
    throw new Error("Tryout not found.");
  }
  const approved = tryout.questions.filter((row) => row.question.status === "APPROVED");
  if (approved.length === 0) {
    throw new Error("This tryout has no approved questions yet.");
  }

  const attempt = await prisma.attempt.create({
    data: {
      tryoutId: tryout.id,
      displayName: parsed.data.displayName,
    },
  });

  redirect(`/tryout/${tryout.token}/play/${attempt.id}`);
}

export async function submitAttempt(formData: FormData) {
  const attemptId = String(formData.get("attemptId") ?? "");
  const answersRaw = String(formData.get("answers") ?? "{}");
  let answers: Record<string, number | null> = {};
  try {
    answers = JSON.parse(answersRaw) as Record<string, number | null>;
  } catch {
    answers = {};
  }

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
  if (!attempt) {
    throw new Error("Attempt not found.");
  }
  if (attempt.submittedAt) {
    redirect(`/tryout/${attempt.tryout.token}/result/${attempt.id}`);
  }

  const items = attempt.tryout.questions
    .filter((row) => row.question.status === "APPROVED")
    .map((row) => ({
      questionId: row.questionId,
      selectedIndex: answers[row.questionId] ?? null,
      correctIndex: row.question.correctIndex,
    }));

  const graded = await gradeAttemptWithGo(items);

  const deadline = new Date(attempt.startedAt.getTime() + attempt.tryout.durationMinutes * 60_000 + 20_000);
  const late = new Date() > deadline;

  await prisma.attempt.update({
    where: { id: attempt.id },
    data: {
      submittedAt: new Date(),
      answers,
      score: graded.score,
      total: graded.total,
      percentage: graded.percentage,
      late,
    },
  });

  redirect(`/tryout/${attempt.tryout.token}/result/${attempt.id}`);
}
