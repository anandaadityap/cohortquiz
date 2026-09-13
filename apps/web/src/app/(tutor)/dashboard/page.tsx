import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ShareControls } from "@/components/share-controls";
import { tryoutShareUrl, tryoutStatusLabel, whatsappTryoutText } from "@/lib/share";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const [tryouts, drafts] = await Promise.all([
    prisma.tryout.findMany({
      where: { quiz: { userId, status: { not: "archived" } } },
      orderBy: { createdAt: "desc" },
      include: {
        quiz: { include: { _count: { select: { questions: true } } } },
        attempts: { where: { submittedAt: { not: null } }, orderBy: { submittedAt: "desc" }, take: 5 },
        _count: { select: { attempts: true } },
      },
    }),
    prisma.quiz.findMany({
      where: { userId, status: "draft" },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { questions: true } } },
    }),
  ]);

  const open = tryouts.filter((t) => t.isActive);
  const closed = tryouts.filter((t) => !t.isActive);
  const empty = tryouts.length === 0 && drafts.length === 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">Workspace</h1>
          <p className="mt-2 max-w-2xl text-ink/70">
            {empty
              ? "Turn this week’s notes into a timed test."
              : "Open this week’s tryout, copy the student link, or continue a draft."}
          </p>
        </div>
        <Link href="/tryouts/new" className="rounded-full bg-clay px-4 py-2 text-sm text-white">
          Create tryout
        </Link>
      </div>

      {empty ? (
        <section className="paper-card p-8">
          <p className="max-w-lg text-ink/75">
            Paste class notes, review the questions, then share a WhatsApp link. Students sit a timed test under their
            name — no student accounts.
          </p>
          <Link href="/tryouts/new" className="mt-6 inline-block rounded-full bg-clay px-5 py-2.5 text-sm text-white">
            Create tryout
          </Link>
        </section>
      ) : null}

      {open.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-serif text-2xl">Live</h2>
          {open.map((tryout) => (
            <TryoutCard key={tryout.id} tryout={tryout} />
          ))}
        </section>
      ) : null}

      {drafts.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-serif text-2xl">Drafts</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {drafts.map((quiz) => (
              <article key={quiz.id} className="paper-card p-5">
                <p className="text-xs uppercase tracking-wide text-moss">Draft</p>
                <h3 className="mt-1 font-serif text-2xl">{quiz.title}</h3>
                <p className="mt-2 text-sm text-ink/60">{quiz._count.questions} questions</p>
                <Link
                  href={`/tryouts/new?quizId=${quiz.id}&step=2`}
                  className="mt-4 inline-block rounded-full bg-ink px-3 py-1.5 text-sm text-paper"
                >
                  Continue review
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {closed.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-serif text-2xl">Closed</h2>
          <ul className="space-y-2 text-sm">
            {closed.map((tryout) => (
              <li key={tryout.id}>
                <Link className="underline" href={`/tryouts/${tryout.id}`}>
                  {tryout.quiz.title}
                </Link>
                <span className="text-ink/50"> · {tryoutStatusLabel(false)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function TryoutCard({
  tryout,
}: {
  tryout: {
    id: string;
    token: string | null;
    durationSeconds: number;
    isActive: boolean;
    quiz: { title: string; _count: { questions: number } };
    attempts: Array<{ id: string; studentLabel: string; percent: number | null }>;
    _count: { attempts: number };
  };
}) {
  const minutes = tryout.durationSeconds / 60;
  const share = tryout.token ? tryoutShareUrl(tryout.token) : null;
  const submitted = tryout.attempts;
  const mean =
    submitted.length === 0
      ? null
      : submitted.reduce((sum, row) => sum + (row.percent ?? 0), 0) / submitted.length;
  const whatsapp = share
    ? whatsappTryoutText({
        title: tryout.quiz.title,
        itemCount: tryout.quiz._count.questions,
        minutes,
        url: share,
      })
    : "";

  return (
    <article className="paper-card space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-moss">{tryoutStatusLabel(tryout.isActive)}</p>
          <h3 className="mt-1 font-serif text-2xl">
            <Link href={`/tryouts/${tryout.id}`} className="hover:underline">
              {tryout.quiz.title}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-ink/60">
            {tryout.quiz._count.questions} questions · {minutes} minutes · {tryout._count.attempts} attempts
            {mean === null ? "" : ` · mean ${mean.toFixed(0)}%`}
          </p>
        </div>
        <Link href={`/tryouts/${tryout.id}`} className="rounded-full border border-line px-3 py-1.5 text-sm">
          Open
        </Link>
      </div>
      {share ? <ShareControls url={share} whatsappText={whatsapp} /> : null}
      {submitted.length > 0 ? (
        <ul className="space-y-1 text-sm text-ink/75">
          {submitted.map((row) => (
            <li key={row.id}>
              {row.studentLabel}: {row.percent?.toFixed(0)}%
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink/60">No scores yet.</p>
      )}
    </article>
  );
}
