import { NextResponse } from "next/server";

import { dbEnabled, db } from "@/lib/db";
import { getWorkOrderById, updateWorkOrderSchedule } from "@/lib/mock-store";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

// Home Guide operator read: fetch a work order by id without requiring the owner's token.
// NOTE: In DB mode we should verify HG role from session.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  if (!dbEnabled()) {
    const workOrder = getWorkOrderById(id);
    if (!workOrder) return json({ ok: false, error: "not_found" }, { status: 404 });
    return json({ ok: true, workOrder });
  }

  const workOrder = await db().workOrder.findUnique({ where: { id } });
  if (!workOrder) return json({ ok: false, error: "not_found" }, { status: 404 });
  return json({ ok: true, workOrder });
}

// Demo/operator mutations (non-DB mode)
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const body = (await req.json().catch(() => null)) as any;
  if (!body || typeof body !== "object") return json({ ok: false, error: "bad_json" }, { status: 400 });

  const action = String(body.action || "");

  if (dbEnabled()) {
    return json({ ok: false, error: "db_not_supported" }, { status: 501 });
  }

  if (action === "update_schedule") {
    const preferredDate = typeof body.preferredDate === "string" ? String(body.preferredDate) : "";
    const preferredWindow = typeof body.preferredWindow === "string" ? String(body.preferredWindow) : "";
    const token = typeof body.token === "string" ? String(body.token) : "demo";
    if (!preferredDate || !preferredWindow) return json({ ok: false, error: "missing_fields" }, { status: 400 });
    const updated = updateWorkOrderSchedule(token, id, { preferredDate, preferredWindow });
    if (!updated) return json({ ok: false, error: "not_found" }, { status: 404 });
    return json({ ok: true, workOrder: updated });
  }

  if (action === "set_status") {
    const next = typeof body.status === "string" ? String(body.status) : "";
    const wo = getWorkOrderById(id);
    if (!wo) return json({ ok: false, error: "not_found" }, { status: 404 });
    if (!next) return json({ ok: false, error: "missing_status" }, { status: 400 });
    (wo as any).status = next;
    return json({ ok: true, workOrder: wo });
  }

  if (action === "set_scope") {
    const wo = getWorkOrderById(id);
    if (!wo) return json({ ok: false, error: "not_found" }, { status: 404 });
    (wo as any).scopeText = typeof body.scopeText === "string" ? String(body.scopeText) : "";
    return json({ ok: true, workOrder: wo });
  }

  return json({ ok: false, error: "unsupported_action" }, { status: 400 });
}
