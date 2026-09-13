import { BloomTag, Difficulty, QuizStatus } from "@prisma/client";

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item));
}

export function letters(index: number): string {
  return String.fromCharCode(65 + index);
}

export const difficulties: Difficulty[] = ["mixed", "easy", "medium", "hard"];
export const bloomTags: BloomTag[] = ["remember", "understand", "apply", "analyze"];

export function parseDifficulty(value: string | undefined): Difficulty {
  return difficulties.includes(value as Difficulty) ? (value as Difficulty) : "mixed";
}

export function parseBloom(value: string | undefined): BloomTag {
  return bloomTags.includes(value as BloomTag) ? (value as BloomTag) : "understand";
}

export function quizStatusLabel(status: QuizStatus) {
  return status;
}
