import Link from "next/link";
import { notFound } from "next/navigation";
import { archiveQuiz, deleteQuiz, publishTryout } from "../../actions";
import { QuestionItemEditor } from "@/components/question-item-editor";
import { SubmitButton } from "@/components/submit-button";
import { auth } from "@/auth";
import { isQuizContentLocked } from "@/lib/quiz-lock";
import { prisma } from "@/lib/prisma";

export default async function QuizPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const quiz = await prisma.quiz.findFirst({
    where: { id, userId: session?.user?.id },
    include: {
      material: true,
      questions: { orderBy: { position: "asc" } },
      tryouts: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!quiz) notFound();
  const frozen = quiz.status === "archived" || (await isQuizContentLocked(quiz.id));
  const latestTryout = quiz.tryouts[0];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.16em] text-moss">Questions</p>
        <h1 className="mt-1 font-serif text-4xl">{quiz.title}</h1>
        <p className="mt-2 text-sm text-ink/60">
          {quiz.questions.length} questions
          {quiz.material ? (
            <>
              {" "}
              · from{" "}
              <Link className="underline" href={`/materials/${quiz.material.id}`}>
                {quiz.material.title}
              </Link>
            </>
          ) : null}
          {frozen ? " · locked" : ""}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {latestTryout ? (
            <Link href={`/tryouts/${latestTryout.id}`} className="rounded-full border border-line px-3 py-1.5">
              Open tryout
            </Link>
          ) : (
            <Link href={`/tryouts/new?quizId=${quiz.id}&step=3`} className="rounded-full border border-line px-3 py-1.5">
              Share tryout
            </Link>
          )}
        </div>
      </div>

      {frozen ? (
        <p className="paper-card p-4 text-sm text-ink/70">
          {quiz.status === "archived"
            ? "This quiz is archived."
            : "A student has already started, so questions are locked. You can still share another tryout from the same set."}
        </p>
      ) : (
        <p className="text-sm text-ink/65">You can edit questions until a student starts the tryout.</p>
      )}

      {quiz.status !== "archived" ? (
        <form action={publishTryout} className="paper-card space-y-3 p-5">
          <h2 className="font-serif text-xl">Share another tryout</h2>
          <p className="text-sm text-ink/65">Creates a student link with the duration you choose.</p>
          <input type="hidden" name="quizId" value={quiz.id} />
          <label className="block text-sm">
            Duration (minutes)
            <input
              name="durationMinutes"
              type="number"
              min={3}
              max={180}
              defaultValue={15}
              className="mt-1 w-full rounded-xl border border-line px-3 py-2"
            />
          </label>
          <SubmitButton
            disabled={quiz.questions.length === 0}
            className="rounded-full bg-clay px-4 py-2 text-sm text-white disabled:opacity-40"
          >
            Share tryout
          </SubmitButton>
        </form>
      ) : null}

      {quiz.tryouts.length > 0 ? (
        <section className="paper-card p-5 text-sm">
          <h2 className="font-serif text-xl">Tryouts</h2>
          <ul className="mt-3 space-y-2">
            {quiz.tryouts.map((tryout) => (
              <li key={tryout.id}>
                <Link className="underline" href={`/tryouts/${tryout.id}`}>
                  {tryout.durationSeconds / 60} min · {tryout.isActive ? "Open" : "Closed"}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="font-serif text-2xl">Items</h2>
        {quiz.questions.map((question, index) => (
          <QuestionItemEditor key={question.id} question={question} index={index} frozen={frozen} />
        ))}
      </section>

      <section className="flex flex-wrap gap-2">
        <form action={archiveQuiz}>
          <input type="hidden" name="quizId" value={quiz.id} />
          <SubmitButton className="rounded-full border border-line px-3 py-1.5 text-sm">
            {quiz.status === "archived" ? "Unarchive to draft" : "Archive quiz"}
          </SubmitButton>
        </form>
        <form action={deleteQuiz}>
          <input type="hidden" name="quizId" value={quiz.id} />
          <SubmitButton className="rounded-full border border-line px-3 py-1.5 text-sm text-clay">
            Delete quiz
          </SubmitButton>
        </form>
      </section>
    </div>
  );
}
