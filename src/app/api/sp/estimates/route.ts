import { NextResponse } from "next/server";

import { dbEnabled } from "@/lib/db";
import { seedDemoStoreIfEmpty, store } from "@/lib/mock-store";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as any;
  if (!body || typeof body !== "object") return json({ ok: false, error: "bad_json" }, { status: 400 });

  const demo = body.demo === true;
  if (demo) seedDemoStoreIfEmpty();
  if (dbEnabled() && !demo) return json({ ok: false, error: "db_not_supported" }, { status: 501 });

  const workOrderId = String(body.workOrderId || "");
  if (!workOrderId) return json({ ok: false, error: "missing_workOrderId" }, { status: 400 });

  const items = Array.isArray(body.items) ? body.items : [];
  const totalCents = Number(body.totalCents || 0);

  const wo = store().workOrders.find((w) => w.id === workOrderId) || null;

  const est = {
    id: `spest_${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
    workOrderId,
    startDate: typeof body.startDate === "string" ? String(body.startDate) : undefined,
    expiryDate: typeof body.expiryDate === "string" ? String(body.expiryDate) : undefined,
    items: items
      .filter((x: any) => x && typeof x === "object")
      .map((x: any) => ({
        id: String(x.id || `it_${Math.random().toString(36).slice(2, 9)}`),
        name: String(x.name || "").trim(),
        description: typeof x.description === "string" ? String(x.description) : undefined,
        qty: Math.max(1, Math.min(999, Number(x.qty || 1) || 1)),
        priceCents: Math.max(0, Math.round(Number(x.priceCents || 0) || 0)),
      }))
      .filter((x: any) => x.name && x.priceCents > 0),
    totalCents: Math.max(0, Math.round(Number.isFinite(totalCents) ? totalCents : 0)),
  };

  store().spEstimates.unshift(est);

  // Add to My Jobs
  const title = wo?.serviceSubcategory ? `${wo.serviceCategory} • ${wo.serviceSubcategory}` : wo?.serviceCategory || "Job";
  const job = {
    id: `spjob_${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
    workOrderId,
    status: "active" as const,
    title,
    address: (wo as any)?.propertyAddress || undefined,
  };
  store().spJobs.unshift(job);

  return json({ ok: true, estimate: est, job });
}
