import { prisma } from "@/lib/prisma";

/** Lock stems/options once any student has started — including in-progress attempts. */
export async function isQuizContentLocked(quizId: string) {
  const started = await prisma.attempt.count({
    where: { tryout: { quizId } },
  });
  return started > 0;
}

export async function assertQuizEditable(quizId: string, status?: string) {
  if (status === "archived") {
    throw new Error("Archived quizzes cannot be edited.");
  }
  if (await isQuizContentLocked(quizId)) {
    throw new Error("A student has already started this tryout, so questions are locked.");
  }
}
