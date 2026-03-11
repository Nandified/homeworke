import { NextResponse } from "next/server";

import { dbEnabled, db } from "@/lib/db";
import { listSharedWorkOrdersForPartner, seedDemoStoreIfEmpty } from "@/lib/mock-store";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const partnerId = url.searchParams.get("partnerId");

  if (!partnerId) return json({ ok: false, error: "missing_partnerId" }, { status: 400 });

  const demo = url.searchParams.get("demo") === "1";
  if (demo) seedDemoStoreIfEmpty();

  if (!dbEnabled() || demo) {
    const workOrders = listSharedWorkOrdersForPartner(partnerId).map((w) => ({
      id: w.id,
      title: w.serviceSubcategory || w.serviceCategory,
      address: w.propertyAddress,
      status: w.status,
      clientName: w.token === "demo" ? "Fernando Rocha Jr" : undefined,
      createdAt: w.createdAt,
      updatedAt: w.createdAt,
    }));
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
