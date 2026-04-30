import { NextResponse } from "next/server";
import { getWorkOrder, updateWorkOrderSchedule } from "@/lib/mock-store";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return json({ ok: false, error: "missing_token" }, { status: 400 });

  const workOrder = getWorkOrder(token, id);
  if (!workOrder) return json({ ok: false, error: "not_found" }, { status: 404 });

  return json({ ok: true, workOrder });
}

// Demo / non-DB schedule updates (request reschedule)
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return json({ ok: false, error: "missing_token" }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return json({ ok: false, error: "invalid_body" }, { status: 400 });

  const action = typeof (body as any).action === "string" ? String((body as any).action) : "";
  if (action !== "update_schedule") return json({ ok: false, error: "unsupported_action" }, { status: 400 });

  const preferredDate = typeof (body as any).preferredDate === "string" ? String((body as any).preferredDate) : "";
  const preferredWindow = typeof (body as any).preferredWindow === "string" ? String((body as any).preferredWindow) : "";
  if (!preferredDate || !preferredWindow) return json({ ok: false, error: "missing_fields" }, { status: 400 });

  const updated = updateWorkOrderSchedule(token, id, { preferredDate, preferredWindow });
  if (!updated) return json({ ok: false, error: "not_found" }, { status: 404 });

  return json({ ok: true, workOrder: updated });
}
