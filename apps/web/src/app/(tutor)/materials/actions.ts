"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { GENERATE_DEFAULT_COUNT } from "@/lib/constants";
import { generateQuizFromGo } from "@/lib/go-client";
import { humanizeGenerateError, isNextRedirect } from "@/lib/human-error";
import { materialParseError, materialSchema, textFromUpload } from "@/lib/material-text";
import { persistGeneratedQuiz } from "@/lib/persist-quiz";
import { parseDifficulty } from "@/lib/options";
import { prisma } from "@/lib/prisma";
import { requireTutor } from "@/lib/session";

export async function createMaterial(formData: FormData) {
  const user = await requireTutor();
  const uploaded = formData.get("file");
  const fromFile = await textFromUpload(uploaded instanceof File ? uploaded : null, "");
  const parsed = materialSchema.safeParse({
    title: formData.get("title"),
    subject: formData.get("subject") ?? "",
    bodyText: fromFile || String(formData.get("bodyText") ?? ""),
  });
  if (!parsed.success) {
    throw new Error(materialParseError());
  }
  const material = await prisma.material.create({
    data: {
      title: parsed.data.title,
      subject: parsed.data.subject,
      bodyText: parsed.data.bodyText,
      userId: user.id,
    },
  });
  redirect(`/materials/${material.id}`);
}

export async function updateMaterial(formData: FormData) {
  const user = await requireTutor();
  const id = String(formData.get("materialId") ?? "");
  const existing = await prisma.material.findFirst({ where: { id, userId: user.id } });
  if (!existing) throw new Error("Material not found.");
  const uploaded = formData.get("file");
  const fromFile = await textFromUpload(uploaded instanceof File ? uploaded : null, "");
  const parsed = materialSchema.safeParse({
    title: formData.get("title"),
    subject: formData.get("subject") ?? "",
    bodyText: fromFile || String(formData.get("bodyText") ?? ""),
  });
  if (!parsed.success) {
    throw new Error(materialParseError());
  }
  await prisma.material.update({
    where: { id },
    data: {
      title: parsed.data.title,
      subject: parsed.data.subject,
      bodyText: parsed.data.bodyText,
    },
  });
  revalidatePath(`/materials/${id}`);
}

export async function archiveMaterial(formData: FormData) {
  const user = await requireTutor();
  const id = String(formData.get("materialId") ?? "");
  const existing = await prisma.material.findFirst({ where: { id, userId: user.id } });
  if (!existing) throw new Error("Material not found.");
  await prisma.material.update({
    where: { id },
    data: { archivedAt: existing.archivedAt ? null : new Date() },
  });
  revalidatePath("/materials");
  revalidatePath(`/materials/${id}`);
}

export async function generateQuiz(formData: FormData) {
  const user = await requireTutor();
  const materialId = String(formData.get("materialId") ?? "");
  const count = Number(formData.get("count") ?? GENERATE_DEFAULT_COUNT);
  const difficulty = parseDifficulty(String(formData.get("difficulty") ?? "mixed"));
  const material = await prisma.material.findFirst({
    where: { id: materialId, userId: user.id },
  });
  if (!material) throw new Error("Material not found.");
  if (material.archivedAt) throw new Error("Unarchive this material before generating.");

  try {
    const result = await generateQuizFromGo({
      material_title: material.title,
      material_text: material.bodyText,
      item_count: Number.isFinite(count) ? count : GENERATE_DEFAULT_COUNT,
      difficulty,
    });
    if (!result.items?.length) {
      throw new Error("Could not create questions. Try again.");
    }

    const quiz = await persistGeneratedQuiz({
      userId: user.id,
      materialId: material.id,
      title: material.title,
      result,
      difficulty,
    });

    redirect(`/tryouts/new?quizId=${quiz.id}&step=2`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    throw new Error(humanizeGenerateError(error));
  }
}
