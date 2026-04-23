import { NextResponse } from "next/server";

export const runtime = "nodejs";

import { db, dbEnabled } from "@/lib/db";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!dbEnabled()) {
    return NextResponse.json({ ok: false, error: "DB disabled" }, { status: 503 });
  }
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

  const report = await db().inspectionReport.findUnique({
    where: { id },
    include: {
      evidence: { take: 50, orderBy: { createdAt: "asc" } },
    },
  });

  if (!report) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    report: {
      id: report.id,
      status: report.status,
      error: report.error,
      pdfUrl: report.pdfUrl,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      evidenceCount: report.evidence.length,
    },
  });
}
