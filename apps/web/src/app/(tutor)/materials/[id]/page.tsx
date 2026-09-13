import { notFound } from "next/navigation";
import { archiveMaterial, updateMaterial } from "../actions";
import { GenerateForm } from "../generate-form";
import { SubmitButton } from "@/components/submit-button";
import { BODY_MAX_CHARS } from "@/lib/constants";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function MaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const material = await prisma.material.findFirst({
    where: { id, userId: session?.user?.id },
    include: { quizzes: { orderBy: { createdAt: "desc" } } },
  });
  if (!material) notFound();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.16em] text-moss">Material</p>
        <h1 className="mt-1 font-serif text-4xl">{material.title}</h1>
        <p className="mt-2 text-sm text-ink/60">
          {material.subject || "untagged"} · {material.quizzes.length} quizzes
          {material.archivedAt ? " · archived" : ""}
        </p>
      </div>

      <form action={updateMaterial} className="paper-card space-y-4 p-5">
        <input type="hidden" name="materialId" value={material.id} />
        <label className="block text-sm">
          Title
          <input name="title" required defaultValue={material.title} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
        </label>
        <label className="block text-sm">
          Subject tag
          <input name="subject" defaultValue={material.subject} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
        </label>
        <label className="block text-sm">
          Notes
          <textarea
            name="bodyText"
            required
            minLength={40}
            maxLength={BODY_MAX_CHARS}
            rows={12}
            defaultValue={material.bodyText}
            className="mt-1 w-full rounded-xl border border-line px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Replace from file (.txt / .md / .pdf)
          <input name="file" type="file" accept=".txt,.md,.pdf" className="mt-1 block w-full text-sm" />
        </label>
        <SubmitButton className="rounded-full bg-ink px-4 py-2 text-sm text-paper">Save edits</SubmitButton>
      </form>

      <div className="grid gap-4 md:grid-cols-2">
        <GenerateForm materialId={material.id} disabled={Boolean(material.archivedAt)} />
        <section className="paper-card space-y-3 p-5">
          <h2 className="font-serif text-xl">Quizzes from this material</h2>
          {material.quizzes.length === 0 ? (
            <p className="text-sm text-ink/65">None yet. Create questions to review them here.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {material.quizzes.map((quiz) => (
                <li key={quiz.id}>
                  <Link className="underline" href={`/quizzes/${quiz.id}/preview`}>
                    {quiz.title}
                  </Link>{" "}
                  <span className="text-ink/50">· {quiz.status}</span>
                </li>
              ))}
            </ul>
          )}
          <form action={archiveMaterial}>
            <input type="hidden" name="materialId" value={material.id} />
            <SubmitButton className="rounded-full border border-line px-3 py-1.5 text-sm">
              {material.archivedAt ? "Unarchive" : "Archive material"}
            </SubmitButton>
          </form>
        </section>
      </div>
    </div>
  );
}
