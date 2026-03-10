import { NextResponse } from "next/server";

import { dbEnabled, db } from "@/lib/db";
import { listRecentWorkOrders } from "@/lib/mock-store";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") || "10");
  const take = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 50) : 10;

  if (!dbEnabled()) {
    return json({ ok: true, workOrders: listRecentWorkOrders(take) });
  }

  const workOrders = await db().workOrder.findMany({
    orderBy: { createdAt: "desc" },
    take,
  });

  return json({ ok: true, workOrders });
}
