import { Difficulty } from "@prisma/client";
import type { GenerateQuizResponse } from "@/lib/go-client";
import { parseBloom, parseDifficulty } from "@/lib/options";
import { prisma } from "@/lib/prisma";

export function questionCreatesFromGenerated(result: GenerateQuizResponse, fallbackDifficulty: Difficulty) {
  return result.items.map((item, position) => ({
    position,
    stem: item.stem,
    options: item.options,
    correctIndex: item.correct_index,
    explanation: item.explanation,
    sourceExcerpt: item.source_excerpt,
    difficulty: parseDifficulty(item.difficulty) === "mixed" ? fallbackDifficulty : parseDifficulty(item.difficulty),
    bloomTag: parseBloom(item.bloom_tag),
  }));
}

export async function persistGeneratedQuiz(input: {
  userId: string;
  materialId: string;
  title: string;
  result: GenerateQuizResponse;
  difficulty: Difficulty;
}) {
  return prisma.quiz.create({
    data: {
      userId: input.userId,
      materialId: input.materialId,
      title: input.title,
      status: "draft",
      itemCount: input.result.items.length,
      model: input.result.model,
      promptVersion: input.result.prompt_version,
      questions: {
        create: questionCreatesFromGenerated(input.result, input.difficulty),
      },
    },
  });
}
