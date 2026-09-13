import Link from "next/link";
import { createMaterial } from "../actions";
import { BODY_MAX_CHARS } from "@/lib/constants";
import { SubmitButton } from "@/components/submit-button";

export default function NewMaterialPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-serif text-4xl">Paste notes</h1>
      <p className="mt-2 text-ink/70">
        Save notes in your library, or{" "}
        <Link href="/tryouts/new" className="underline">
          create a tryout
        </Link>{" "}
        from notes in one sitting.
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
          <label className="text-sm font-medium" htmlFor="subject">
            Subject tag
          </label>
          <input
            id="subject"
            name="subject"
            placeholder="e.g. SMA IPA"
            className="mt-1 w-full rounded-xl border border-line px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="bodyText">
            Notes
          </label>
          <textarea
            id="bodyText"
            name="bodyText"
            minLength={40}
            maxLength={BODY_MAX_CHARS}
            rows={14}
            placeholder="Paste the source text students were taught from…"
            className="mt-1 w-full rounded-xl border border-line px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="file">
            Or upload .txt / .md / .pdf
          </label>
          <input id="file" name="file" type="file" accept=".txt,.md,.pdf" className="mt-1 block w-full text-sm" />
        </div>
        <SubmitButton className="rounded-full bg-ink px-5 py-2.5 text-sm text-paper">Save material</SubmitButton>
      </form>
    </div>
  );
}
