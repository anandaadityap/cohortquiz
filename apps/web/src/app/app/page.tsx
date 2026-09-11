import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await auth();
  const materials = await prisma.material.findMany({
    where: { authorId: session?.user?.id },
    orderBy: { createdAt: "desc" },
    include: {
      questions: true,
      tryouts: { include: { _count: { select: { attempts: true } } } },
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">Workspace</h1>
          <p className="mt-2 max-w-2xl text-ink/70">
            Materials stay private until you approve questions and publish a tryout link.
          </p>
        </div>
        <Link href="/app/materials/new" className="rounded-full bg-clay px-4 py-2 text-sm text-white">
          New material
        </Link>
      </div>

      {materials.length === 0 ? (
        <p className="paper-card p-6 text-ink/70">No materials yet. Paste a chapter to start.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {materials.map((material) => {
            const drafts = material.questions.filter((q) => q.status === "DRAFT").length;
            const approved = material.questions.filter((q) => q.status === "APPROVED").length;
            return (
              <article key={material.id} className="paper-card p-5">
                <h2 className="font-serif text-2xl">{material.title}</h2>
                <p className="mt-2 text-sm text-ink/60">
                  {approved} approved · {drafts} drafts · {material.tryouts.length} tryouts
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-sm">
                  <Link
                    href={`/app/materials/${material.id}`}
                    className="rounded-full bg-ink px-3 py-1.5 text-paper"
                  >
                    Review questions
                  </Link>
                  {material.tryouts.map((tryout) => (
                    <Link
                      key={tryout.id}
                      href={`/app/tryouts/${tryout.id}`}
                      className="rounded-full border border-line px-3 py-1.5"
                    >
                      {tryout.title} ({tryout._count.attempts})
                    </Link>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
