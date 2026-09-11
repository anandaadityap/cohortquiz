"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { QuestionStatus } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { generateQuizFromGo } from "@/lib/go-client";
import { prisma } from "@/lib/prisma";

async function requireTutor() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You need to sign in first.");
  }
  return session.user;
}

export async function createMaterial(formData: FormData) {
  const user = await requireTutor();
  const parsed = z
    .object({
      title: z.string().trim().min(3).max(160),
      content: z.string().trim().min(40),
    })
    .safeParse({
      title: formData.get("title"),
      content: formData.get("content"),
    });
  if (!parsed.success) {
    throw new Error("Title needs 3+ characters and the notes need at least 40.");
  }
  const material = await prisma.material.create({
    data: {
      title: parsed.data.title,
      content: parsed.data.content,
      authorId: user.id,
    },
  });
  redirect(`/app/materials/${material.id}`);
}

export async function generateQuestions(formData: FormData) {
  const user = await requireTutor();
  const materialId = String(formData.get("materialId") ?? "");
  const count = Number(formData.get("count") ?? 5);
  const material = await prisma.material.findFirst({
    where: { id: materialId, authorId: user.id },
  });
  if (!material) {
    throw new Error("Material not found.");
  }

  const result = await generateQuizFromGo({
    materialTitle: material.title,
    materialContent: material.content,
    count: Number.isFinite(count) ? count : 5,
  });

  const rows = result.questions.filter(
    (q) =>
      q.stem &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      q.correctIndex >= 0 &&
      q.correctIndex < 4 &&
      q.explanation,
  );

  if (rows.length === 0) {
    throw new Error("The generator returned no usable questions.");
  }

  await prisma.question.createMany({
    data: rows.map((q) => ({
      materialId: material.id,
      stem: q.stem,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      status: QuestionStatus.DRAFT,
      source: result.generator === "openai" ? "ai" : "mock",
    })),
  });

  revalidatePath(`/app/materials/${material.id}`);
}

export async function setQuestionStatus(formData: FormData) {
  const user = await requireTutor();
  const id = String(formData.get("questionId") ?? "");
  const status = String(formData.get("status") ?? "") as QuestionStatus;
  if (status !== "APPROVED" && status !== "REJECTED" && status !== "DRAFT") {
    throw new Error("Invalid status.");
  }

  const question = await prisma.question.findFirst({
    where: { id, material: { authorId: user.id } },
    include: { tryoutQuestions: true },
  });
  if (!question) {
    throw new Error("Question not found.");
  }
  if (question.tryoutQuestions.length > 0 && status !== "APPROVED") {
    throw new Error("This item is already on a tryout, so it must stay approved.");
  }

  await prisma.question.update({ where: { id }, data: { status } });
  revalidatePath(`/app/materials/${question.materialId}`);
}

export async function publishTryout(formData: FormData) {
  const user = await requireTutor();
  const parsed = z
    .object({
      materialId: z.string().min(1),
      title: z.string().trim().min(3).max(160),
      durationMinutes: z.coerce.number().int().min(3).max(180),
    })
    .safeParse({
      materialId: formData.get("materialId"),
      title: formData.get("title"),
      durationMinutes: formData.get("durationMinutes"),
    });
  if (!parsed.success) {
    throw new Error("Check the tryout title and duration.");
  }

  const material = await prisma.material.findFirst({
    where: { id: parsed.data.materialId, authorId: user.id },
    include: { questions: { where: { status: "APPROVED" }, orderBy: { createdAt: "asc" } } },
  });
  if (!material) {
    throw new Error("Material not found.");
  }
  if (material.questions.length === 0) {
    throw new Error("Approve at least one question before publishing a tryout.");
  }

  const token = `t-${crypto.randomUUID().slice(0, 8)}`;
  const tryout = await prisma.tryout.create({
    data: {
      materialId: material.id,
      title: parsed.data.title,
      token,
      durationMinutes: parsed.data.durationMinutes,
      createdById: user.id,
      questions: {
        create: material.questions.map((q, position) => ({
          questionId: q.id,
          position,
        })),
      },
    },
  });

  redirect(`/app/tryouts/${tryout.id}`);
}
