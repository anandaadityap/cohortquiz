import { createMaterial } from "@/app/app/actions";

export default function NewMaterialPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-serif text-4xl">Paste material</h1>
      <p className="mt-2 text-ink/70">
        The generator may only use this text. Keep it specific — a chapter, worksheet, or class notes.
      </p>
      <form action={createMaterial} className="paper-card mt-6 space-y-4 p-6">
        <div>
          <label className="text-sm font-medium" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            minLength={3}
            placeholder="e.g. Newton’s laws — meeting 3"
            className="mt-1 w-full rounded-xl border border-line px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="content">
            Notes
          </label>
          <textarea
            id="content"
            name="content"
            required
            minLength={40}
            rows={14}
            placeholder="Paste the source text students were taught from…"
            className="mt-1 w-full rounded-xl border border-line px-3 py-2"
          />
        </div>
        <button type="submit" className="rounded-full bg-ink px-5 py-2.5 text-sm text-paper">
          Save material
        </button>
      </form>
    </div>
  );
}
