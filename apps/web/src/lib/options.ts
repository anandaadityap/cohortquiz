export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item));
}

export function letters(index: number): string {
  return String.fromCharCode(65 + index);
}
