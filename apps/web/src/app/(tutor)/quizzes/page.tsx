import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function QuizzesPage() {
  const session = await auth();
  const quizzes = await prisma.quiz.findMany({
    where: { userId: session?.user?.id },
    orderBy: { createdAt: "desc" },
    include: {
      material: true,
      tryouts: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { questions: true, tryouts: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl">Quizzes</h1>
        <p className="mt-2 text-ink/70">Advanced question sets. The usual path is Create tryout from the workspace.</p>
      </div>
      {quizzes.length === 0 ? (
        <p className="paper-card p-6 text-ink/70">No quizzes yet. Create a tryout from this week’s notes.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {quizzes.map((quiz) => (
            <article key={quiz.id} className="paper-card p-5">
              <p className="text-xs uppercase tracking-wide text-moss">
                {quiz.status === "draft" ? "Draft" : quiz.status === "archived" ? "Archived" : "Ready"}
              </p>
              <h2 className="mt-1 font-serif text-2xl">{quiz.title}</h2>
              <p className="mt-2 text-sm text-ink/60">
                {quiz._count.questions} questions · {quiz._count.tryouts} tryouts
                {quiz.material ? ` · ${quiz.material.title}` : ""}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <Link href={`/quizzes/${quiz.id}/preview`} className="rounded-full bg-ink px-3 py-1.5 text-paper">
                  {quiz.status === "draft" ? "Continue review" : "Questions"}
                </Link>
                {quiz.tryouts[0] ? (
                  <Link href={`/tryouts/${quiz.tryouts[0].id}`} className="rounded-full border border-line px-3 py-1.5">
                    Scores
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
