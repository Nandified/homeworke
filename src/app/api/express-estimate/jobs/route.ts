import { NextResponse } from "next/server";

import { getJob, listJobs, upsertJob } from "@/lib/express-estimate-jobs-db";

function isAuthorized(req: Request) {
  const secret = process.env.WORKFLOWS_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") || "";
  return auth === `Bearer ${secret}`;
}

// GET: public-ish (for now) list; later we scope by user.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const reportId = url.searchParams.get("reportId") || "";
  if (reportId) {
    const job = await getJob(reportId);
    return NextResponse.json({ ok: true, job });
  }
  const jobs = await listJobs(100);
  return NextResponse.json({ ok: true, jobs });
}

// POST: internal updates from workflow/worker only.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.reportId !== "string") return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });

  const authorized = isAuthorized(req);
  const action = typeof body.action === "string" ? body.action : "update";

  // Allow unauthenticated creation of a PROCESSING row (no error updates) so the UI can show a job immediately.
  // All real progress updates (DONE/ERROR/etc.) require authorization.
  if (!authorized) {
    if (action !== "create") return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    await upsertJob({ reportId: body.reportId, status: "PROCESSING", progressPct: 1, step: "Queued" });
    return NextResponse.json({ ok: true });
  }

  await upsertJob({
    reportId: body.reportId,
    status: body.status,
    progressPct: typeof body.progressPct === "number" ? body.progressPct : undefined,
    step: typeof body.step === "string" ? body.step : null,
    error: typeof body.error === "string" ? body.error : null,
  });

  return NextResponse.json({ ok: true });
}
