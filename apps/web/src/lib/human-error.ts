import { GoApiError } from "@/lib/go-client";

export function isNextRedirect(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export function humanizeGenerateError(error: unknown): string {
  if (error instanceof GoApiError) {
    const msg = error.message.toLowerCase();
    if (error.status === 400 && msg.includes("40")) {
      return "Not enough notes to create questions. Paste a bit more.";
    }
    if (error.status === 429) return "Too many requests. Wait a moment and try again.";
    if (error.status === 504) return "Creating questions took too long. Try again.";
    return "Could not create questions. Try again.";
  }
  if (error instanceof Error && error.message) {
    if (/\b(502|504|500)\b/i.test(error.message) || /go api|stack|internal key/i.test(error.message)) {
      return "Could not create questions. Try again.";
    }
    return error.message;
  }
  return "Could not create questions. Try again.";
}

export function humanizeActionError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message && !/\b(502|504|500)\b/i.test(error.message)) {
    return error.message;
  }
  return fallback;
}
