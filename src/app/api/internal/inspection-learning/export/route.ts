import { NextResponse } from "next/server";

import { db, dbEnabled } from "@/lib/db";

export const runtime = "nodejs";

function unauthorized(msg = "unauthorized") {
  return NextResponse.json({ ok: false, error: msg }, { status: 401 });
}

function toCsvRow(cols: Array<string | number | null | undefined>) {
  return (
    cols
      .map((c) => {
        const s = c === null || c === undefined ? "" : String(c);
        // CSV escape
        if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
        return s;
      })
      .join(",") + "\n"
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const expected = process.env.INTERNAL_ADMIN_TOKEN || "";
  if (!expected || token !== expected) return unauthorized();

  if (!dbEnabled()) {
    return NextResponse.json({ ok: false, error: "db_disabled" }, { status: 503 });
  }

  const format = (url.searchParams.get("format") || "jsonl").toLowerCase();
  const limit = Math.max(1, Math.min(5000, Number(url.searchParams.get("limit") || "500") || 500));

  const rows = await db().inspectionLearningEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  if (format === "csv") {
    let out = "";
    out += toCsvRow([
      "id",
      "createdAt",
      "pdfHash",
      "zip",
      "state",
      "marketMultiplier",
      "summary",
      "findingsCount",
      "lanesCount",
    ]);
    for (const r of rows) {
      const findingsCount = Array.isArray((r as any).findings) ? (r as any).findings.length : "";
      const lanesCount = Array.isArray((r as any).lanes) ? (r as any).lanes.length : "";
      out += toCsvRow([
        r.id,
        r.createdAt.toISOString(),
        r.pdfHash,
        r.zip,
        r.state,
        r.marketMultiplier,
        r.summary,
        findingsCount,
        lanesCount,
      ]);
    }
    return new NextResponse(out, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }

  // Default: JSONL (includes findings/lanes)
  const lines = rows.map((r) => JSON.stringify({
    id: r.id,
    createdAt: r.createdAt,
    pdfHash: r.pdfHash,
    location: r.location,
    zip: r.zip,
    state: r.state,
    marketMultiplier: r.marketMultiplier,
    schemaVersion: r.schemaVersion,
    modelChunk: r.modelChunk,
    modelFinal: r.modelFinal,
    summary: r.summary,
    findings: (r as any).findings,
    lanes: (r as any).lanes,
  }));

  return new NextResponse(lines.join("\n") + "\n", {
    status: 200,
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
