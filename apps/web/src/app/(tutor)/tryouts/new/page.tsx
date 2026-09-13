import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { NotesForm } from "./notes-form";
import { ShareForm } from "./share-form";
import { QuestionItemEditor } from "@/components/question-item-editor";
import { auth } from "@/auth";
import { isQuizContentLocked } from "@/lib/quiz-lock";
import { prisma } from "@/lib/prisma";

function StepChrome({ step }: { step: 1 | 2 | 3 }) {
  const labels = ["Notes", "Questions", "Share"];
  return (
    <p className="text-sm text-ink/60">
      {step} / 3 {labels[step - 1]}
    </p>
  );
}

export default async function NewTryoutPage({
  searchParams,
}: {
  searchParams: Promise<{ quizId?: string; step?: string }>;
}) {
  const session = await auth();
  const { quizId, step: stepRaw } = await searchParams;
  const requested = Number(stepRaw);
  const step = requested === 2 || requested === 3 ? requested : quizId ? 2 : 1;

  if (!quizId) {
    return (
      <div className="mx-auto max-w-2xl">
        <StepChrome step={1} />
        <h1 className="mt-2 font-serif text-4xl">Create tryout</h1>
        <p className="mt-2 text-ink/70">Paste this week’s notes. We draft questions, you review, then share a link.</p>
        <NotesForm />
      </div>
    );
  }

  const quiz = await prisma.quiz.findFirst({
    where: { id: quizId, userId: session?.user?.id },
    include: {
      material: true,
      questions: { orderBy: { position: "asc" } },
      tryouts: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!quiz) notFound();

  const live = quiz.tryouts[0];
  if (live) {
    redirect(`/tryouts/${live.id}`);
  }

  const frozen = await isQuizContentLocked(quiz.id);

  if (step === 3) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <StepChrome step={3} />
        <h1 className="font-serif text-4xl">Share</h1>
        <p className="text-ink/70">Set the timer. Students get a link they can reopen from your workspace anytime.</p>
        <ShareForm quizId={quiz.id} title={quiz.title} itemCount={quiz.questions.length} />
        <Link href={`/tryouts/new?quizId=${quiz.id}&step=2`} className="inline-block text-sm underline">
          Back to questions
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <StepChrome step={2} />
        <h1 className="mt-2 font-serif text-4xl">{quiz.title}</h1>
        <p className="mt-2 text-sm text-ink/60">
          {quiz.questions.length} questions
          {quiz.material ? (
            <>
              {" "}
              · notes{" "}
              <Link className="underline" href={`/materials/${quiz.material.id}`}>
                {quiz.material.title}
              </Link>
            </>
          ) : null}
        </p>
      </div>

      {frozen ? (
        <p className="paper-card p-4 text-sm text-ink/70">
          A student has already started, so these questions are locked.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Link
          href={quiz.questions.length > 0 ? `/tryouts/new?quizId=${quiz.id}&step=3` : "#"}
          className={`rounded-full px-4 py-2 text-sm text-white ${
            quiz.questions.length > 0 ? "bg-clay" : "pointer-events-none bg-ink/30"
          }`}
        >
          Continue to share
        </Link>
        <Link href="/dashboard" className="rounded-full border border-line px-4 py-2 text-sm">
          Save draft
        </Link>
      </div>

      <section className="space-y-4">
        {quiz.questions.map((question, index) => (
          <QuestionItemEditor key={question.id} question={question} index={index} frozen={frozen} />
        ))}
      </section>
    </div>
  );
}
