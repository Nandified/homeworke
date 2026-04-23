import { NextResponse } from "next/server";

export const runtime = "nodejs";

import crypto from "node:crypto";

import { db, dbEnabled } from "@/lib/db";

export async function POST(req: Request) {
  if (!dbEnabled()) {
    return NextResponse.json({ ok: false, error: "DB disabled" }, { status: 503 });
  }

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const pdfUrl = typeof body?.pdfUrl === "string" ? body.pdfUrl.trim() : "";
  if (!pdfUrl) {
    return NextResponse.json({ ok: false, error: "Missing pdfUrl" }, { status: 400 });
  }

  const pdfBytes = Number.isFinite(Number(body?.pdfBytes)) ? Number(body.pdfBytes) : undefined;
  const ownerName = typeof body?.ownerName === "string" ? body.ownerName.trim() : undefined;
  const address = typeof body?.address === "string" ? body.address.trim() : undefined;
  const inspector = typeof body?.inspector === "string" ? body.inspector.trim() : undefined;

  const pdfSha256 = typeof body?.pdfSha256 === "string" && body.pdfSha256.length >= 32 ? body.pdfSha256 : undefined;

  // Basic sanity: ensure it's an https URL.
  if (!/^https:\/\//i.test(pdfUrl)) {
    return NextResponse.json({ ok: false, error: "pdfUrl must be https" }, { status: 400 });
  }

  // If sha not provided, derive a stable-ish idempotency key from URL.
  const urlHash = crypto.createHash("sha1").update(pdfUrl).digest("hex").slice(0, 10);

  const report = await db().inspectionReport.create({
    data: {
      status: "QUEUED",
      pdfUrl,
      pdfBytes: typeof pdfBytes === "number" ? Math.max(0, Math.floor(pdfBytes)) : undefined,
      pdfSha256,
      ownerName,
      address,
      inspector,
    },
  });

  return NextResponse.json({ ok: true, reportId: report.id, urlHash });
}
