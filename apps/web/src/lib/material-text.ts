import { z } from "zod";
import { BODY_MAX_CHARS, BODY_MIN_CHARS } from "@/lib/constants";

export const materialSchema = z.object({
  title: z.string().trim().min(3).max(160),
  subject: z.string().trim().max(80).default(""),
  bodyText: z.string().trim().min(BODY_MIN_CHARS).max(BODY_MAX_CHARS),
});

export function materialParseError() {
  return `Title needs 3+ characters and notes need ${BODY_MIN_CHARS}–${BODY_MAX_CHARS} characters.`;
}

export async function textFromUpload(file: File | null, fallback: string) {
  if (!file || file.size === 0) return fallback;
  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());
  if (name.endsWith(".pdf")) {
    const { extractText } = await import("unpdf");
    const extracted = await extractText(new Uint8Array(buffer), { mergePages: true });
    if (!extracted.text.trim()) throw new Error("Could not read text from that PDF.");
    return extracted.text.trim();
  }
  if (name.endsWith(".txt") || name.endsWith(".md")) {
    return buffer.toString("utf8").trim();
  }
  throw new Error("Upload a .pdf, .txt, or .md file.");
}
