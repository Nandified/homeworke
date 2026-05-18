import { NextResponse } from "next/server";

import { dbEnabled } from "@/lib/db";
import { seedDemoStoreIfEmpty, store } from "@/lib/mock-store";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const demo = url.searchParams.get("demo") === "1";
  if (demo) seedDemoStoreIfEmpty();

  if (dbEnabled() && !demo) return json({ ok: true, estimates: [] });

  const estimates = store().estimates.filter((e) => e.workOrderId === id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return json({ ok: true, estimates });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as any;
  if (!body || typeof body !== "object") return json({ ok: false, error: "bad_json" }, { status: 400 });

  const demo = body.demo === true;
  if (demo) seedDemoStoreIfEmpty();
  if (dbEnabled() && !demo) return json({ ok: false, error: "db_not_supported" }, { status: 501 });

  const action = String(body.action || "");

  if (action === "select") {
    const estimateId = String(body.estimateId || "");
    if (!estimateId) return json({ ok: false, error: "missing_estimateId" }, { status: 400 });
    const wo = store().workOrders.find((w) => w.id === id);
    if (!wo) return json({ ok: false, error: "not_found" }, { status: 404 });
    wo.selectedEstimateId = estimateId;
    return json({ ok: true, workOrder: wo });
  }

  if (action === "replace") {
    const estimateId = String(body.estimateId || "");
    const est = store().estimates.find((e) => e.id === estimateId && e.workOrderId === id);
    if (!est) return json({ ok: false, error: "not_found" }, { status: 404 });
    est.status = "replaced";
    return json({ ok: true, estimate: est });
  }

  if (action === "create") {
    const providerName = String(body.providerName || "").trim();
    const totalCents = Number(body.totalCents || 0);
    if (!providerName || !Number.isFinite(totalCents) || totalCents <= 0) {
      return json({ ok: false, error: "missing_fields" }, { status: 400 });
    }

    const est = {
      id: `est_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString(),
      workOrderId: id,
      providerName,
      totalCents: Math.round(totalCents),
      status: "sent" as const,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    };
    store().estimates.unshift(est);
    return json({ ok: true, estimate: est });
  }

  return json({ ok: false, error: "unsupported_action" }, { status: 400 });
}
