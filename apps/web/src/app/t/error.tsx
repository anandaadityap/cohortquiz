"use client";

export default function TryoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <h1 className="font-serif text-3xl">Tryout error</h1>
      <p className="mt-3 text-ink/70">{error.message || "This attempt could not continue."}</p>
      <button type="button" onClick={reset} className="mt-4 rounded-full bg-ink px-4 py-2 text-sm text-paper">
        Try again
      </button>
    </main>
  );
}
