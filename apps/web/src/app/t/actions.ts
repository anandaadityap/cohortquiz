"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { TRYOUT_GRACE_SECONDS } from "@/lib/constants";
import { gradeAttemptWithGo } from "@/lib/go-client";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/token";

export async function startAttempt(formData: FormData) {
  const parsed = z
    .object({
      token: z.string().min(1),
      studentLabel: z.string().trim().min(2).max(80),
    })
    .safeParse({
      token: formData.get("token"),
      studentLabel: formData.get("studentLabel"),
    });
  if (!parsed.success) {
    throw new Error("Enter a name with at least 2 characters.");
  }

  const tryout = await prisma.tryout.findUnique({
    where: { tokenHash: hashToken(parsed.data.token) },
    include: { quiz: { include: { questions: true } } },
  });
  if (!tryout || !tryout.isActive || tryout.quiz.status !== "approved") {
    throw new Error("Tryout not found.");
  }
  if (tryout.expiresAt && tryout.expiresAt < new Date()) {
    throw new Error("This tryout link has expired.");
  }
  if (tryout.quiz.questions.length === 0) {
    throw new Error("This tryout has no questions yet.");
  }

  const attempt = await prisma.attempt.create({
    data: {
      tryoutId: tryout.id,
      studentLabel: parsed.data.studentLabel,
    },
  });

  redirect(`/t/${parsed.data.token}/play/${attempt.id}`);
}

export async function submitAttempt(formData: FormData) {
  const attemptId = String(formData.get("attemptId") ?? "");
  const token = String(formData.get("token") ?? "");
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
          quiz: { include: { questions: { orderBy: { position: "asc" } } } },
        },
      },
    },
  });
  if (!attempt) throw new Error("Attempt not found.");
  if (hashToken(token) !== attempt.tryout.tokenHash) throw new Error("Tryout not found.");
  if (attempt.submittedAt) {
    redirect(`/t/${token}/result/${attempt.id}`);
  }

  const submittedAt = new Date();
  const payload = {
    quiz_id: attempt.tryout.quizId,
    answers: attempt.tryout.quiz.questions.map((question) => ({
      question_id: question.id,
      selected_index: answers[question.id] ?? null,
    })),
    started_at: attempt.startedAt.toISOString(),
    submitted_at: submittedAt.toISOString(),
    time_limit_seconds: attempt.tryout.durationSeconds,
  };

  const deadline = new Date(
    attempt.startedAt.getTime() + (attempt.tryout.durationSeconds + TRYOUT_GRACE_SECONDS) * 1000,
  );
  const graded = await gradeAttemptWithGo(payload);

  await prisma.$transaction([
    prisma.attempt.update({
      where: { id: attempt.id },
      data: {
        submittedAt,
        scoreCorrect: graded.score_correct,
        scoreTotal: graded.score_total,
        percent: graded.percent,
        timedOut: graded.timed_out || submittedAt > deadline,
      },
    }),
    prisma.attemptAnswer.deleteMany({ where: { attemptId: attempt.id } }),
    prisma.attemptAnswer.createMany({
      data: graded.per_item.map((item) => ({
        attemptId: attempt.id,
        questionId: item.question_id,
        selectedIndex: item.selected_index ?? -1,
        isCorrect: item.correct,
      })),
    }),
  ]);

  redirect(`/t/${token}/result/${attempt.id}`);
}
