import { NextResponse } from "next/server";
import { getWorkOrder } from "@/lib/mock-store";

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
