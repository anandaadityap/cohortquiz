"use client";

import { useActionState } from "react";
import { publishTryoutForm, type WizardState } from "./actions";
import { SubmitButton } from "@/components/submit-button";

const initial: WizardState = { error: null };

export function ShareForm({
  quizId,
  title,
  itemCount,
}: {
  quizId: string;
  title: string;
  itemCount: number;
}) {
  const [state, action] = useActionState(publishTryoutForm, initial);

  return (
    <form action={action} className="paper-card mt-6 space-y-4 p-6">
      <input type="hidden" name="quizId" value={quizId} />
      <p className="text-sm text-ink/70">
        {title} · {itemCount} questions
      </p>
      <label className="block text-sm font-medium">
        Duration (minutes)
        <input
          name="durationMinutes"
          type="number"
          min={3}
          max={180}
          defaultValue={15}
          className="mt-1 w-full rounded-xl border border-line px-3 py-2 font-normal"
        />
      </label>
      {state.error ? <p className="text-sm text-clay">{state.error}</p> : null}
      <SubmitButton className="rounded-full bg-clay px-5 py-2.5 text-sm text-white">Share tryout</SubmitButton>
    </form>
  );
}
