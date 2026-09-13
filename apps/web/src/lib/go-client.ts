const baseUrl = () => process.env.API_GO_URL?.replace(/\/$/, "") || "http://127.0.0.1:8080";

export type GeneratedItem = {
  stem: string;
  options: string[];
  correct_index: number;
  explanation: string;
  source_excerpt: string;
  difficulty?: string;
  bloom_tag?: string;
};

export type GenerateQuizResponse = {
  items: GeneratedItem[];
  model: string;
  prompt_version: string;
};

export type GradeAnswer = {
  question_id: string;
  selected_index: number | null;
};

export type GradeResponse = {
  score_correct: number;
  score_total: number;
  percent: number;
  timed_out: boolean;
  per_item: Array<{
    question_id: string;
    correct: boolean;
    correct_index: number;
    selected_index: number | null;
  }>;
  error?: string;
};

class GoApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

function headers() {
  const key = process.env.INTERNAL_API_KEY;
  if (!key) {
    throw new Error("INTERNAL_API_KEY is not configured.");
  }
  return {
    "Content-Type": "application/json",
    "X-Internal-Key": key,
  };
}

async function goFetch<T>(path: string, body: unknown): Promise<{ data: T; status: number }> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const text = await res.text();
  let payload: unknown = text;
  try {
    payload = JSON.parse(text) as unknown;
  } catch {
    payload = { error: text };
  }
  if (!res.ok) {
    const message =
      typeof payload === "object" && payload && "error" in payload
        ? String((payload as { error: string }).error)
        : `Go API ${path} failed (${res.status})`;
    throw new GoApiError(message, res.status, payload);
  }
  return { data: payload as T, status: res.status };
}

export async function generateQuizFromGo(input: {
  material_title: string;
  material_text: string;
  item_count: number;
  options_per_item?: number;
  difficulty?: string;
  locale?: string;
}): Promise<GenerateQuizResponse> {
  const { data } = await goFetch<GenerateQuizResponse>("/api/v1/generate-quiz", {
    material_title: input.material_title,
    material_text: input.material_text,
    item_count: input.item_count,
    options_per_item: input.options_per_item ?? 4,
    difficulty: input.difficulty ?? "mixed",
    locale: input.locale ?? "en",
  });
  return data;
}

export async function gradeAttemptWithGo(input: {
  quiz_id: string;
  answers: GradeAnswer[];
  started_at: string;
  submitted_at: string;
  time_limit_seconds: number;
}): Promise<GradeResponse> {
  try {
    const { data } = await goFetch<GradeResponse>("/api/v1/grade-attempt", input);
    return data;
  } catch (err) {
    if (err instanceof GoApiError && err.status === 400 && err.payload && typeof err.payload === "object") {
      const payload = err.payload as GradeResponse;
      if (payload.timed_out && typeof payload.score_total === "number") {
        return payload;
      }
    }
    throw err;
  }
}

export { GoApiError };
