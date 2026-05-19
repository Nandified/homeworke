import { NextResponse } from "next/server";

import { dbEnabled } from "@/lib/db";
import { seedDemoStoreIfEmpty, store, type SpJobStatus } from "@/lib/mock-store";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const status = (url.searchParams.get("status") || "all") as SpJobStatus | "all";
  const demo = url.searchParams.get("demo") === "1";
  if (demo) seedDemoStoreIfEmpty();

  if (dbEnabled() && !demo) return json({ ok: true, jobs: [] });

  const jobs = store().spJobs
    .filter((j) => (status === "all" ? true : j.status === status))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return json({ ok: true, jobs });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as any;
  if (!body || typeof body !== "object") return json({ ok: false, error: "bad_json" }, { status: 400 });

  const demo = body.demo === true;
  if (demo) seedDemoStoreIfEmpty();
  if (dbEnabled() && !demo) return json({ ok: false, error: "db_not_supported" }, { status: 501 });

  const action = String(body.action || "");
  const id = String(body.id || "");
  if (!id) return json({ ok: false, error: "missing_id" }, { status: 400 });

  const job = store().spJobs.find((j) => j.id === id);
  if (!job) return json({ ok: false, error: "not_found" }, { status: 404 });

  if (action === "complete") {
    job.status = "completed";
    return json({ ok: true, job });
  }

  return json({ ok: false, error: "unsupported_action" }, { status: 400 });
}
