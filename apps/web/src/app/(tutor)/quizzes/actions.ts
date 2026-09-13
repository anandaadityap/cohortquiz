"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { generateQuizFromGo } from "@/lib/go-client";
import { humanizeGenerateError, isNextRedirect } from "@/lib/human-error";
import { parseBloom, parseDifficulty } from "@/lib/options";
import { prisma } from "@/lib/prisma";
import { assertQuizEditable } from "@/lib/quiz-lock";
import { requireTutor } from "@/lib/session";
import { hashToken, newTryoutToken } from "@/lib/token";

function revalidateQuizSurfaces(quizId: string) {
  revalidatePath(`/quizzes/${quizId}/preview`);
  revalidatePath("/tryouts/new");
  revalidatePath("/dashboard");
  revalidatePath("/quizzes");
}

async function ownedQuiz(id: string, userId: string) {
  const quiz = await prisma.quiz.findFirst({
    where: { id, userId },
    include: {
      material: true,
      questions: { orderBy: { position: "asc" } },
      tryouts: { include: { _count: { select: { attempts: true } } } },
    },
  });
  if (!quiz) throw new Error("Quiz not found.");
  return quiz;
}

export async function updateQuestion(formData: FormData) {
  const user = await requireTutor();
  const questionId = String(formData.get("questionId") ?? "");
  const question = await prisma.question.findFirst({
    where: { id: questionId, quiz: { userId: user.id } },
    include: { quiz: true },
  });
  if (!question) throw new Error("Question not found.");
  await assertQuizEditable(question.quizId, question.quiz.status);

  const options = [0, 1, 2, 3].map((i) => String(formData.get(`option_${i}`) ?? "").trim());
  const parsed = z
    .object({
      stem: z.string().trim().min(8),
      correctIndex: z.coerce.number().int().min(0).max(3),
      explanation: z.string().trim().min(4),
      sourceExcerpt: z.string().trim().min(4),
    })
    .safeParse({
      stem: formData.get("stem"),
      correctIndex: formData.get("correctIndex"),
      explanation: formData.get("explanation"),
      sourceExcerpt: formData.get("sourceExcerpt"),
    });
  if (!parsed.success || options.some((opt) => opt.length < 1) || new Set(options.map((o) => o.toLowerCase())).size !== 4) {
    throw new Error("Each question needs a stem, four unique options, a correct answer, explanation, and source excerpt.");
  }

  await prisma.question.update({
    where: { id: questionId },
    data: {
      stem: parsed.data.stem,
      options,
      correctIndex: parsed.data.correctIndex,
      explanation: parsed.data.explanation,
      sourceExcerpt: parsed.data.sourceExcerpt,
      difficulty: parseDifficulty(String(formData.get("difficulty") ?? "")),
      bloomTag: parseBloom(String(formData.get("bloomTag") ?? "")),
    },
  });
  revalidateQuizSurfaces(question.quizId);
}

export async function deleteQuestion(formData: FormData) {
  const user = await requireTutor();
  const questionId = String(formData.get("questionId") ?? "");
  const question = await prisma.question.findFirst({
    where: { id: questionId, quiz: { userId: user.id } },
    include: { quiz: { include: { questions: true } } },
  });
  if (!question) throw new Error("Question not found.");
  await assertQuizEditable(question.quizId, question.quiz.status);
  if (question.quiz.questions.length <= 1) {
    throw new Error("Keep at least one question.");
  }
  await prisma.question.delete({ where: { id: questionId } });
  const remaining = await prisma.question.findMany({
    where: { quizId: question.quizId },
    orderBy: { position: "asc" },
  });
  await prisma.$transaction(
    remaining.map((row, position) =>
      prisma.question.update({ where: { id: row.id }, data: { position } }),
    ),
  );
  await prisma.quiz.update({
    where: { id: question.quizId },
    data: { itemCount: remaining.length },
  });
  revalidateQuizSurfaces(question.quizId);
}

export async function regenerateQuestion(formData: FormData) {
  const user = await requireTutor();
  const questionId = String(formData.get("questionId") ?? "");
  const question = await prisma.question.findFirst({
    where: { id: questionId, quiz: { userId: user.id } },
    include: { quiz: { include: { material: true } } },
  });
  if (!question) throw new Error("Question not found.");
  await assertQuizEditable(question.quizId, question.quiz.status);
  const source = question.quiz.material?.bodyText;
  if (!source) throw new Error("This quiz has no source notes to regenerate from.");

  try {
    const result = await generateQuizFromGo({
      material_title: question.quiz.material?.title ?? question.quiz.title,
      material_text: source,
      item_count: 1,
      difficulty: question.difficulty,
    });
    const item = result.items[0];
    if (!item) throw new Error("Could not create a replacement question. Try again.");

    await prisma.question.update({
      where: { id: question.id },
      data: {
        stem: item.stem,
        options: item.options,
        correctIndex: item.correct_index,
        explanation: item.explanation,
        sourceExcerpt: item.source_excerpt,
        difficulty: parseDifficulty(item.difficulty) === "mixed" ? question.difficulty : parseDifficulty(item.difficulty),
        bloomTag: parseBloom(item.bloom_tag),
      },
    });
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    throw new Error(humanizeGenerateError(error));
  }
  revalidateQuizSurfaces(question.quizId);
}

export async function approveQuiz(formData: FormData) {
  const user = await requireTutor();
  const id = String(formData.get("quizId") ?? "");
  const quiz = await ownedQuiz(id, user.id);
  if (quiz.questions.length === 0) throw new Error("Add at least one question first.");
  await prisma.quiz.update({
    where: { id },
    data: { status: "approved", itemCount: quiz.questions.length },
  });
  revalidateQuizSurfaces(id);
}

export async function archiveQuiz(formData: FormData) {
  const user = await requireTutor();
  const id = String(formData.get("quizId") ?? "");
  const quiz = await ownedQuiz(id, user.id);
  await prisma.quiz.update({
    where: { id },
    data: { status: quiz.status === "archived" ? "draft" : "archived" },
  });
  revalidatePath("/quizzes");
  revalidateQuizSurfaces(id);
}

export async function deleteQuiz(formData: FormData) {
  const user = await requireTutor();
  const id = String(formData.get("quizId") ?? "");
  const quiz = await ownedQuiz(id, user.id);
  const attemptCount = quiz.tryouts.reduce((sum, t) => sum + t._count.attempts, 0);
  if (attemptCount > 0) {
    throw new Error("This quiz has attempts, so it cannot be deleted. Archive it instead.");
  }
  if (quiz.tryouts.length > 0) {
    throw new Error("This quiz has tryouts. Close them or archive the quiz instead of deleting.");
  }
  await prisma.quiz.delete({ where: { id } });
  redirect("/quizzes");
}

export async function publishTryout(formData: FormData) {
  const user = await requireTutor();
  const parsed = z
    .object({
      quizId: z.string().min(1),
      durationMinutes: z.coerce.number().int().min(3).max(180),
    })
    .safeParse({
      quizId: formData.get("quizId"),
      durationMinutes: formData.get("durationMinutes"),
    });
  if (!parsed.success) throw new Error("Duration must be between 3 and 180 minutes.");
  const quiz = await ownedQuiz(parsed.data.quizId, user.id);
  if (quiz.status === "archived") throw new Error("Unarchive this quiz before sharing.");
  if (quiz.questions.length === 0) throw new Error("Keep at least one question before sharing.");

  const token = newTryoutToken();
  const tryout = await prisma.$transaction(async (tx) => {
    if (quiz.status !== "approved") {
      await tx.quiz.update({
        where: { id: quiz.id },
        data: { status: "approved", itemCount: quiz.questions.length },
      });
    }
    return tx.tryout.create({
      data: {
        quizId: quiz.id,
        token,
        tokenHash: hashToken(token),
        durationSeconds: parsed.data.durationMinutes * 60,
        isActive: true,
      },
    });
  });
  revalidatePath("/dashboard");
  redirect(`/tryouts/${tryout.id}`);
}
