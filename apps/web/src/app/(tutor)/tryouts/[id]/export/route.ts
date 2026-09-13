import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const tryout = await prisma.tryout.findFirst({
    where: { id, quiz: { userId: session.user.id } },
    include: {
      quiz: true,
      attempts: { where: { submittedAt: { not: null } }, orderBy: { submittedAt: "desc" } },
    },
  });
  if (!tryout) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const rows = [["student_label", "score_correct", "score_total", "percent", "timed_out", "submitted_at"]];
  for (const attempt of tryout.attempts) {
    rows.push([
      attempt.studentLabel,
      String(attempt.scoreCorrect ?? ""),
      String(attempt.scoreTotal ?? ""),
      String(attempt.percent ?? ""),
      attempt.timedOut ? "true" : "false",
      attempt.submittedAt?.toISOString() ?? "",
    ]);
  }
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${tryout.id}-scores.csv"`,
    },
  });
}

function csvCell(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}
