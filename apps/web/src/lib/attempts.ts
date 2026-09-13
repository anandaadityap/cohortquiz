export function tryoutHeadcountLabel(scored: number, inProgress: number) {
  const scorePart = scored === 0 ? "no scores yet" : `${scored} ${scored === 1 ? "score" : "scores"}`;
  if (inProgress === 0) return scorePart;
  return `${scorePart} · ${inProgress} in progress`;
}

export function attemptScoreLabel(row: { submittedAt: Date | string | null; percent: number | null }) {
  if (!row.submittedAt) return "in progress";
  return row.percent == null ? "scored" : `${row.percent.toFixed(0)}%`;
}
