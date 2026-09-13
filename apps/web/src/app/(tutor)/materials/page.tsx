import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function MaterialsPage() {
  const session = await auth();
  const materials = await prisma.material.findMany({
    where: { userId: session?.user?.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { quizzes: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">Materials</h1>
          <p className="mt-2 text-ink/70">Source notes library. Creating a tryout from notes is the usual path.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/tryouts/new" className="rounded-full bg-clay px-4 py-2 text-sm text-white">
            Create tryout
          </Link>
          <Link href="/materials/new" className="rounded-full border border-line px-4 py-2 text-sm">
            Save notes only
          </Link>
        </div>
      </div>
      {materials.length === 0 ? (
        <p className="paper-card p-6 text-ink/70">No materials yet. Paste a chapter to start.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {materials.map((material) => (
            <article key={material.id} className="paper-card p-5">
              <p className="text-xs uppercase tracking-wide text-moss">{material.subject || "untagged"}</p>
              <h2 className="mt-1 font-serif text-2xl">{material.title}</h2>
              <p className="mt-2 text-sm text-ink/60">
                {material._count.quizzes} quizzes
                {material.archivedAt ? " · archived" : ""}
              </p>
              <Link href={`/materials/${material.id}`} className="mt-4 inline-block rounded-full bg-ink px-3 py-1.5 text-sm text-paper">
                Open
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
