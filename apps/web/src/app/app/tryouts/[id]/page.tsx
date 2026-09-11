import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function TryoutScoresPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const tryout = await prisma.tryout.findFirst({
    where: { id, createdById: session?.user?.id },
    include: {
      material: true,
      questions: true,
      attempts: { orderBy: { submittedAt: "desc" } },
    },
  });
  if (!tryout) notFound();

  const origin = process.env.AUTH_URL || "http://localhost:3000";
  const link = `${origin}/tryout/${tryout.token}`;
  const submitted = tryout.attempts.filter((a) => a.submittedAt);
  const avg =
    submitted.length === 0
      ? null
      : Math.round(submitted.reduce((sum, a) => sum + (a.percentage ?? 0), 0) / submitted.length);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.16em] text-moss">Cohort scores</p>
        <h1 className="mt-1 font-serif text-4xl">{tryout.title}</h1>
        <p className="mt-2 text-sm text-ink/60">
          {tryout.questions.length} approved items · {tryout.durationMinutes} minutes · from{" "}
          <Link className="underline" href={`/app/materials/${tryout.materialId}`}>
            {tryout.material.title}
          </Link>
        </p>
      </div>

      <section className="paper-card space-y-2 p-5">
        <p className="text-sm font-medium">Student link</p>
        <p className="break-all font-mono text-sm">{link}</p>
        <Link href={`/tryout/${tryout.token}`} className="inline-block text-sm text-moss underline">
          Open as a student
        </Link>
      </section>

      <section className="paper-card overflow-x-auto p-5">
        <div className="mb-4 flex flex-wrap gap-6 text-sm">
          <div>
            <p className="text-ink/50">Attempts</p>
            <p className="font-serif text-3xl">{submitted.length}</p>
          </div>
          <div>
            <p className="text-ink/50">Average</p>
            <p className="font-serif text-3xl">{avg === null ? "—" : `${avg}%`}</p>
          </div>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="text-ink/50">
            <tr>
              <th className="py-2">Student</th>
              <th>Score</th>
              <th>Submitted</th>
              <th>Flags</th>
            </tr>
          </thead>
          <tbody>
            {tryout.attempts.length === 0 ? (
              <tr>
                <td className="py-4 text-ink/60" colSpan={4}>
                  No attempts yet. Share the link with the cohort.
                </td>
              </tr>
            ) : (
              tryout.attempts.map((attempt) => (
                <tr key={attempt.id} className="border-t border-line">
                  <td className="py-3">{attempt.displayName}</td>
                  <td>
                    {attempt.submittedAt
                      ? `${attempt.score}/${attempt.total} (${attempt.percentage}%)`
                      : "In progress"}
                  </td>
                  <td>{attempt.submittedAt ? attempt.submittedAt.toLocaleString() : "—"}</td>
                  <td>{attempt.late ? "Late" : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
