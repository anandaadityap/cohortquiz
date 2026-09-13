"use server";

import { redirect } from "next/navigation";
import { GENERATE_DEFAULT_COUNT } from "@/lib/constants";
import { generateQuizFromGo } from "@/lib/go-client";
import { humanizeActionError, humanizeGenerateError, isNextRedirect } from "@/lib/human-error";
import { materialParseError, materialSchema, textFromUpload } from "@/lib/material-text";
import { persistGeneratedQuiz } from "@/lib/persist-quiz";
import { prisma } from "@/lib/prisma";
import { requireTutor } from "@/lib/session";
import { publishTryout } from "@/app/(tutor)/quizzes/actions";

export type WizardState = { error: string | null };

export async function createTryoutDraft(_prev: WizardState, formData: FormData): Promise<WizardState> {
  try {
    const user = await requireTutor();
    const uploaded = formData.get("file");
    const fromFile = await textFromUpload(uploaded instanceof File ? uploaded : null, "");
    const parsed = materialSchema.safeParse({
      title: formData.get("title"),
      subject: formData.get("subject") ?? "",
      bodyText: fromFile || String(formData.get("bodyText") ?? ""),
    });
    if (!parsed.success) {
      return { error: materialParseError() };
    }

    const result = await generateQuizFromGo({
      material_title: parsed.data.title,
      material_text: parsed.data.bodyText,
      item_count: GENERATE_DEFAULT_COUNT,
    });
    if (!result.items?.length) {
      return { error: "Could not create questions. Try again." };
    }

    const material = await prisma.material.create({
      data: {
        title: parsed.data.title,
        subject: parsed.data.subject,
        bodyText: parsed.data.bodyText,
        userId: user.id,
      },
    });
    const quiz = await persistGeneratedQuiz({
      userId: user.id,
      materialId: material.id,
      title: parsed.data.title,
      result,
      difficulty: "mixed",
    });

    redirect(`/tryouts/new?quizId=${quiz.id}&step=2`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return { error: humanizeGenerateError(error) };
  }
}

export async function publishTryoutForm(_prev: WizardState, formData: FormData): Promise<WizardState> {
  try {
    await publishTryout(formData);
    return { error: null };
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return { error: humanizeActionError(error, "Could not share this tryout. Try again.") };
  }
}
