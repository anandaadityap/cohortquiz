import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function QuizAnalyticsRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const quiz = await prisma.quiz.findFirst({
    where: { id, userId: session?.user?.id },
    include: { tryouts: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!quiz) notFound();
  if (quiz.tryouts[0]) {
    redirect(`/tryouts/${quiz.tryouts[0].id}`);
  }
  redirect(`/quizzes/${id}/preview`);
}
