import { NextResponse } from "next/server";

import { dbEnabled, db } from "@/lib/db";
import { getWorkOrderById } from "@/lib/mock-store";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

// Home Guide operator read: fetch a work order by id without requiring the owner's token.
// NOTE: This is operator-access; in DB mode we should verify HG role from session.
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
