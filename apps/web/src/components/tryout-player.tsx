"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { submitAttempt } from "@/app/t/actions";
import { letters } from "@/lib/options";

export type PlayerQuestion = {
  id: string;
  stem: string;
  options: string[];
  position: number;
};

type Props = {
  attemptId: string;
  token: string;
  durationSeconds: number;
  startedAt: string;
  questions: PlayerQuestion[];
};

export function TryoutPlayer({ attemptId, token, durationSeconds, startedAt, questions }: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [remaining, setRemaining] = useState(() => remainingSeconds(startedAt, durationSeconds));
  const [pending, startTransition] = useTransition();

  const current = questions[index];

  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = remainingSeconds(startedAt, durationSeconds);
      setRemaining(next);
      if (next <= 0) {
        window.clearInterval(timer);
        submitNow();
      }
    }, 500);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt, durationSeconds]);

  function submitNow() {
    const form = new FormData();
    form.set("attemptId", attemptId);
    form.set("token", token);
    form.set("answers", JSON.stringify(answers));
    startTransition(() => {
      void submitAttempt(form);
    });
  }

  const clock = useMemo(() => {
    const m = Math.max(0, Math.floor(remaining / 60));
    const s = Math.max(0, remaining % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [remaining]);

  if (!current) {
    return <p>This tryout has no questions.</p>;
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-5xl gap-6 px-4 py-6 md:grid-cols-[220px_1fr]">
      <aside className="paper-card h-fit p-4">
        <p className={`font-mono text-2xl ${remaining < 60 ? "text-clay" : "text-ink"}`}>{clock}</p>
        <p className="mt-1 text-xs text-ink/50">Time remaining</p>
        <div className="mt-4 grid grid-cols-5 gap-2">
          {questions.map((q, i) => {
            const answered = answers[q.id] !== undefined && answers[q.id] !== null;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-9 rounded-lg text-xs ${
                  i === index
                    ? "bg-ink text-paper"
                    : flagged[q.id]
                      ? "bg-clay/20"
                      : answered
                        ? "bg-moss/20"
                        : "bg-line/70"
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={submitNow}
          disabled={pending}
          className="mt-4 w-full rounded-full bg-clay py-2 text-sm text-white disabled:opacity-60"
        >
          {pending ? "Submitting…" : "Submit tryout"}
        </button>
      </aside>

      <section className="paper-card p-6">
        <p className="text-sm text-ink/50">
          Question {index + 1} of {questions.length}
        </p>
        <h1 className="mt-2 font-serif text-2xl leading-snug">{current.stem}</h1>
        <div className="mt-6 space-y-2">
          {current.options.map((option, optionIndex) => {
            const selected = answers[current.id] === optionIndex;
            return (
              <button
                key={option + optionIndex}
                type="button"
                onClick={() => setAnswers((prev) => ({ ...prev, [current.id]: optionIndex }))}
                className={`block w-full rounded-xl border px-4 py-3 text-left text-sm ${
                  selected ? "border-moss bg-moss/10" : "border-line bg-white"
                }`}
              >
                <span className="mr-2 font-medium">{letters(optionIndex)}.</span>
                {option}
              </button>
            );
          })}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            className="text-sm underline"
            onClick={() => setFlagged((prev) => ({ ...prev, [current.id]: !prev[current.id] }))}
          >
            {flagged[current.id] ? "Unflag" : "Flag for review"}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-full border border-line px-4 py-2 text-sm"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
            >
              Previous
            </button>
            <button
              type="button"
              className="rounded-full bg-ink px-4 py-2 text-sm text-paper"
              onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
              disabled={index === questions.length - 1}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function remainingSeconds(startedAt: string, durationSeconds: number) {
  const end = new Date(startedAt).getTime() + durationSeconds * 1000;
  return Math.max(0, Math.ceil((end - Date.now()) / 1000));
}
