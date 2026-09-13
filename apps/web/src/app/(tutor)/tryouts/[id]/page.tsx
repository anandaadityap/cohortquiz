import Link from "next/link";
import { reopenTryout, revokeTryout, rotateTryoutToken } from "../actions";
import { ShareControls } from "@/components/share-controls";
import { SubmitButton } from "@/components/submit-button";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isQuizContentLocked } from "@/lib/quiz-lock";
import { tryoutHeadcountLabel } from "@/lib/attempts";
import { tryoutShareUrl, tryoutStatusLabel, whatsappTryoutText } from "@/lib/share";
import { notFound } from "next/navigation";

function formatWhen(value: Date) {
  return value.toISOString().slice(0, 16).replace("T", " ") + " UTC";
}

export default async function TryoutManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const tryout = await prisma.tryout.findFirst({
    where: { id, quiz: { userId: session?.user?.id } },
    include: {
      quiz: { include: { questions: { orderBy: { position: "asc" } } } },
      attempts: { orderBy: { startedAt: "desc" }, include: { answers: true } },
    },
  });
  if (!tryout) notFound();

  const submitted = tryout.attempts.filter((a) => a.submittedAt);
  const inProgress = tryout.attempts.filter((a) => !a.submittedAt);
  const percents = submitted.map((a) => a.percent ?? 0);
  const mean = percents.length === 0 ? null : percents.reduce((s, n) => s + n, 0) / percents.length;
  const locked = await isQuizContentLocked(tryout.quizId);
  const status = tryoutStatusLabel(tryout.isActive);
  const minutes = tryout.durationSeconds / 60;
  const share = tryout.token ? tryoutShareUrl(tryout.token) : null;
  const whatsapp = share
    ? whatsappTryoutText({
        title: tryout.quiz.title,
        itemCount: tryout.quiz.questions.length,
        minutes,
        url: share,
      })
    : "";

  const itemStats = tryout.quiz.questions.map((question) => {
    const rows = submitted.flatMap((a) => a.answers.filter((ans) => ans.questionId === question.id));
    const correct = rows.filter((r) => r.isCorrect).length;
    const pct = rows.length === 0 ? null : Math.round((correct * 100) / rows.length);
    return { question, answered: rows.length, pct };
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.16em] text-moss">{status}</p>
        <h1 className="mt-1 font-serif text-4xl">{tryout.quiz.title}</h1>
        <p className="mt-2 text-sm text-ink/60">
          {tryout.quiz.questions.length} questions · {minutes} minutes ·{" "}
          {tryoutHeadcountLabel(submitted.length, inProgress.length)}
          {mean === null ? "" : ` · mean ${mean.toFixed(0)}%`}
          {locked ? " · questions locked" : ""}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <Link href={`/quizzes/${tryout.quizId}/preview`} className="rounded-full border border-line px-3 py-1.5">
            Edit questions
          </Link>
          <a href={`/tryouts/${tryout.id}/export`} className="rounded-full border border-line px-3 py-1.5">
            Export CSV
          </a>
        </div>
      </div>

      <section className="paper-card space-y-3 p-5">
        <h2 className="font-serif text-xl">Student link</h2>
        {share ? (
          <ShareControls url={share} whatsappText={whatsapp} />
        ) : (
          <p className="text-sm text-ink/65">
            This tryout was saved before links could be shown again. Change the link to create a new student URL.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {tryout.isActive ? (
            <form action={revokeTryout}>
              <input type="hidden" name="tryoutId" value={tryout.id} />
              <SubmitButton className="rounded-full border border-line px-3 py-1.5 text-sm">Close tryout</SubmitButton>
            </form>
          ) : (
            <form action={reopenTryout}>
              <input type="hidden" name="tryoutId" value={tryout.id} />
              <SubmitButton className="rounded-full border border-line px-3 py-1.5 text-sm">Open tryout</SubmitButton>
            </form>
          )}
          <form action={rotateTryoutToken}>
            <input type="hidden" name="tryoutId" value={tryout.id} />
            <SubmitButton className="rounded-full bg-ink px-3 py-1.5 text-sm text-paper">
              Change link (old link stops working)
            </SubmitButton>
          </form>
        </div>
      </section>

      <section className="paper-card overflow-x-auto p-5">
        <h2 className="font-serif text-xl">Roster</h2>
        <p className="mt-1 text-sm text-ink/60">
          Scores appear after a student submits. In progress means they started and have not finished.
        </p>
        <table className="mt-3 w-full text-left text-sm">
          <thead className="text-ink/50">
            <tr>
              <th className="py-2">Student</th>
              <th>Score</th>
              <th>Time</th>
              <th>Flags</th>
            </tr>
          </thead>
          <tbody>
            {tryout.attempts.length === 0 ? (
              <tr>
                <td className="py-4 text-ink/60" colSpan={4}>
                  No students yet. Share the link when you are ready.
                </td>
              </tr>
            ) : (
              tryout.attempts.map((attempt) => (
                <tr key={attempt.id} className="border-t border-line">
                  <td className="py-3">{attempt.studentLabel}</td>
                  <td>
                    {attempt.submittedAt
                      ? `${attempt.scoreCorrect}/${attempt.scoreTotal} (${attempt.percent?.toFixed(0)}%)`
                      : "In progress"}
                  </td>
                  <td>{formatWhen(attempt.submittedAt ?? attempt.startedAt)}</td>
                  <td>{attempt.timedOut ? "Timed out" : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className="paper-card p-5">
        <h2 className="font-serif text-xl">Per-question % correct</h2>
        <ol className="mt-3 space-y-3 text-sm">
          {itemStats.map((row, index) => (
            <li key={row.question.id}>
              <p className="font-medium">
                {index + 1}. {row.question.stem}
              </p>
              <p className="text-ink/60">
                {row.pct === null ? "No answers yet" : `${row.pct}% correct`} · {row.answered} responses
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
