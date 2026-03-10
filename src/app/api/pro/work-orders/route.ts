import { NextResponse } from "next/server";

import { dbEnabled, db } from "@/lib/db";
import { listSharedWorkOrdersForPartner } from "@/lib/mock-store";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const partnerId = url.searchParams.get("partnerId");

  if (!partnerId) return json({ ok: false, error: "missing_partnerId" }, { status: 400 });

  if (!dbEnabled()) {
    const workOrders = listSharedWorkOrdersForPartner(partnerId);
    return json({ ok: true, workOrders });
  }

  const workOrders = await db().workOrder.findMany({
    where: {
      OR: [{ shareWithPartnerId: partnerId }, { originPartnerId: partnerId }],
    },
    orderBy: { createdAt: "desc" },
  });

  return json({ ok: true, workOrders });
}
