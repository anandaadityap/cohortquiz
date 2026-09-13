"use client";

export default function TutorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="paper-card space-y-3 p-6">
      <h1 className="font-serif text-2xl">Something went wrong</h1>
      <p className="text-sm text-ink/70">{error.message || "The workspace hit an unexpected error."}</p>
      <button type="button" onClick={reset} className="rounded-full bg-ink px-4 py-2 text-sm text-paper">
        Try again
      </button>
    </div>
  );
}
