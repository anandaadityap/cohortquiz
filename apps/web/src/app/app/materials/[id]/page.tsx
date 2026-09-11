import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { generateQuestions, publishTryout, setQuestionStatus } from "@/app/app/actions";
import { asStringArray, letters } from "@/lib/options";
import { prisma } from "@/lib/prisma";

export default async function MaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const material = await prisma.material.findFirst({
    where: { id, authorId: session?.user?.id },
    include: {
      questions: { orderBy: { createdAt: "asc" } },
      tryouts: true,
    },
  });
  if (!material) notFound();

  const approved = material.questions.filter((q) => q.status === "APPROVED").length;
  const drafts = material.questions.filter((q) => q.status === "DRAFT").length;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.16em] text-moss">Material</p>
        <h1 className="mt-1 font-serif text-4xl">{material.title}</h1>
        <p className="mt-2 text-sm text-ink/60">
          {approved} approved · {drafts} awaiting review · {material.tryouts.length} published tryouts
        </p>
      </div>

      <section className="paper-card p-5">
        <h2 className="font-serif text-xl">Source notes</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink/80">{material.content}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <form action={generateQuestions} className="paper-card space-y-3 p-5">
          <h2 className="font-serif text-xl">Generate drafts</h2>
          <p className="text-sm text-ink/65">
            Next.js posts this material to the Go service. New items land as <strong>drafts</strong> and
            cannot appear on a tryout until you approve them.
          </p>
          <input type="hidden" name="materialId" value={material.id} />
          <label className="block text-sm">
            How many items
            <input
              name="count"
              type="number"
              min={3}
              max={12}
              defaultValue={5}
              className="mt-1 w-full rounded-xl border border-line px-3 py-2"
            />
          </label>
          <button type="submit" className="rounded-full bg-moss px-4 py-2 text-sm text-white">
            Draft with Go generator
          </button>
        </form>

        <form action={publishTryout} className="paper-card space-y-3 p-5">
          <h2 className="font-serif text-xl">Publish tryout</h2>
          <p className="text-sm text-ink/65">
            Only approved questions are copied onto the timed CBT link.
          </p>
          <input type="hidden" name="materialId" value={material.id} />
          <label className="block text-sm">
            Tryout title
            <input
              name="title"
              required
              defaultValue={`${material.title} tryout`}
              className="mt-1 w-full rounded-xl border border-line px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Duration (minutes)
            <input
              name="durationMinutes"
              type="number"
              min={3}
              max={180}
              defaultValue={12}
              className="mt-1 w-full rounded-xl border border-line px-3 py-2"
            />
          </label>
          <button
            type="submit"
            disabled={approved === 0}
            className="rounded-full bg-clay px-4 py-2 text-sm text-white disabled:opacity-40"
          >
            Publish approved items
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl">Question review</h2>
        {material.questions.length === 0 ? (
          <p className="text-ink/65">No questions yet. Generate drafts from the notes above.</p>
        ) : (
          material.questions.map((question) => {
            const options = asStringArray(question.options);
            return (
              <article key={question.id} className="paper-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs uppercase tracking-wide ${
                      question.status === "APPROVED"
                        ? "bg-moss/15 text-moss"
                        : question.status === "REJECTED"
                          ? "bg-clay/15 text-clay"
                          : "bg-line text-ink/70"
                    }`}
                  >
                    {question.status}
                  </span>
                  <span className="text-xs text-ink/50">source: {question.source}</span>
                </div>
                <p className="mt-3 font-medium">{question.stem}</p>
                <ol className="mt-3 space-y-1 text-sm">
                  {options.map((option, index) => (
                    <li
                      key={option + index}
                      className={index === question.correctIndex ? "font-medium text-moss" : "text-ink/75"}
                    >
                      {letters(index)}. {option}
                      {index === question.correctIndex ? " — correct" : ""}
                    </li>
                  ))}
                </ol>
                <p className="mt-3 text-sm text-ink/65">{question.explanation}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {question.status !== "APPROVED" ? (
                    <form action={setQuestionStatus}>
                      <input type="hidden" name="questionId" value={question.id} />
                      <input type="hidden" name="status" value="APPROVED" />
                      <button className="rounded-full bg-moss px-3 py-1.5 text-sm text-white" type="submit">
                        Approve
                      </button>
                    </form>
                  ) : null}
                  {question.status !== "REJECTED" ? (
                    <form action={setQuestionStatus}>
                      <input type="hidden" name="questionId" value={question.id} />
                      <input type="hidden" name="status" value="REJECTED" />
                      <button className="rounded-full border border-line px-3 py-1.5 text-sm" type="submit">
                        Reject
                      </button>
                    </form>
                  ) : null}
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
