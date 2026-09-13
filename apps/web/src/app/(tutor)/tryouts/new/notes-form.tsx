"use client";

import { useActionState } from "react";
import { createTryoutDraft, type WizardState } from "./actions";
import { BODY_MAX_CHARS } from "@/lib/constants";
import { SubmitButton } from "@/components/submit-button";

const initial: WizardState = { error: null };

export function NotesForm() {
  const [state, action] = useActionState(createTryoutDraft, initial);

  return (
    <form action={action} className="paper-card mt-6 space-y-4 p-6">
      <div>
        <label className="text-sm font-medium" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          minLength={3}
          placeholder="Photosynthesis — week 3"
          className="mt-1 w-full rounded-xl border border-line px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="subject">
          Subject (optional)
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
          placeholder="Paste this week’s class notes…"
          className="mt-1 w-full rounded-xl border border-line px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="file">
          Or upload .txt / .md / .pdf
        </label>
        <input id="file" name="file" type="file" accept=".txt,.md,.pdf" className="mt-1 block w-full text-sm" />
      </div>
      {state.error ? <p className="text-sm text-clay">{state.error}</p> : null}
      <SubmitButton
        pendingLabel="Creating questions… this can take up to a minute"
        className="rounded-full bg-clay px-5 py-2.5 text-sm text-white"
      >
        Create questions with AI
      </SubmitButton>
    </form>
  );
}
