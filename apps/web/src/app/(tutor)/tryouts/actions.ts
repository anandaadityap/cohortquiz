"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTutor } from "@/lib/session";
import { hashToken, newTryoutToken } from "@/lib/token";

async function ownedTryout(id: string, userId: string) {
  const tryout = await prisma.tryout.findFirst({
    where: { id, quiz: { userId } },
    include: { quiz: true },
  });
  if (!tryout) throw new Error("Tryout not found.");
  return tryout;
}

function revalidateTryout(id: string) {
  revalidatePath(`/tryouts/${id}`);
  revalidatePath("/dashboard");
}

export async function revokeTryout(formData: FormData) {
  const user = await requireTutor();
  const id = String(formData.get("tryoutId") ?? "");
  const tryout = await ownedTryout(id, user.id);
  await prisma.tryout.update({
    where: { id: tryout.id },
    data: { isActive: false },
  });
  revalidateTryout(tryout.id);
}

export async function reopenTryout(formData: FormData) {
  const user = await requireTutor();
  const id = String(formData.get("tryoutId") ?? "");
  const tryout = await ownedTryout(id, user.id);
  await prisma.tryout.update({
    where: { id: tryout.id },
    data: { isActive: true },
  });
  revalidateTryout(tryout.id);
}

export async function rotateTryoutToken(formData: FormData) {
  const user = await requireTutor();
  const id = String(formData.get("tryoutId") ?? "");
  const tryout = await ownedTryout(id, user.id);
  const token = newTryoutToken();
  await prisma.tryout.update({
    where: { id: tryout.id },
    data: { token, tokenHash: hashToken(token) },
  });
  revalidateTryout(tryout.id);
}
