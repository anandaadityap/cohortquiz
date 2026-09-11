const baseUrl = () => process.env.API_GO_URL?.replace(/\/$/, "") || "http://localhost:8080";

export type GeneratedQuestion = {
  stem: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type GenerateQuizResponse = {
  generator: string;
  questions: GeneratedQuestion[];
};

export type GradeItem = {
  questionId: string;
  selectedIndex: number | null;
  correctIndex: number;
};

export type GradeResponse = {
  correct: number;
  total: number;
  score: number;
  percentage: number;
  items: Array<{
    questionId: string;
    selectedIndex: number | null;
    correctIndex: number;
    correct: boolean;
  }>;
};

async function goFetch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Go API ${path} failed (${res.status}): ${text}`);
  }
  return (await res.json()) as T;
}

export async function generateQuizFromGo(input: {
  materialTitle: string;
  materialContent: string;
  count: number;
}): Promise<GenerateQuizResponse> {
  return goFetch<GenerateQuizResponse>("/v1/generate-quiz", input);
}

export async function gradeAttemptWithGo(items: GradeItem[]): Promise<GradeResponse> {
  return goFetch<GradeResponse>("/v1/grade-attempt", { items });
}
