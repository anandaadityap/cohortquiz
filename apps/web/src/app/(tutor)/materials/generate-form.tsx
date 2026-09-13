"use client";

import { generateQuiz } from "./actions";
import { GENERATE_DEFAULT_COUNT } from "@/lib/constants";
import { SubmitButton } from "@/components/submit-button";

export function GenerateForm({ materialId, disabled }: { materialId: string; disabled?: boolean }) {
  return (
    <form action={generateQuiz} className="paper-card space-y-3 p-5">
      <h2 className="font-serif text-xl">Create questions</h2>
      <p className="text-sm text-ink/65">
        Draft a new quiz from these notes. You will review items before sharing a student link. This can take up to a
        minute.
      </p>
      <input type="hidden" name="materialId" value={materialId} />
      <label className="block text-sm">
        How many items
        <input
          name="count"
          type="number"
          min={1}
          max={20}
          defaultValue={GENERATE_DEFAULT_COUNT}
          className="mt-1 w-full rounded-xl border border-line px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Difficulty
        <select name="difficulty" defaultValue="mixed" className="mt-1 w-full rounded-xl border border-line px-3 py-2">
          <option value="mixed">mixed</option>
          <option value="easy">easy</option>
          <option value="medium">medium</option>
          <option value="hard">hard</option>
        </select>
      </label>
      <SubmitButton
        disabled={disabled}
        pendingLabel="Creating questions… this can take up to a minute"
        className="rounded-full bg-moss px-4 py-2 text-sm text-white disabled:opacity-40"
      >
        Create questions
      </SubmitButton>
    </form>
  );
}
