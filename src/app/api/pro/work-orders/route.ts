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

  // When DB isn't wired, keep the in-memory mock store seeded so cold starts / new deploys
  // don't show an empty list until the user refreshes.
  if (!dbEnabled() || demo) seedDemoStoreIfEmpty();

  if (!dbEnabled() || demo) {
    const workOrders = listSharedWorkOrdersForPartner(partnerId).map((w) => ({
      id: w.id,
      title: w.serviceSubcategory || w.serviceCategory,
      address: w.propertyAddress,
      status: w.status,
      clientName: w.clientName,
      isMyProperty: !!w.isMyProperty,
      createdAt: w.createdAt,
      updatedAt: w.createdAt,
    }));
    return json({ ok: true, workOrders });
  }

  try {
    const workOrders = await db().workOrder.findMany({
      where: {
        OR: [{ shareWithPartnerId: partnerId }, { originPartnerId: partnerId }],
      },
      orderBy: { createdAt: "desc" },
    });

    return json({ ok: true, workOrders });
  } catch (err) {
    // If DB is configured but temporarily unavailable/mis-migrated, don't hard-fail the dashboard.
    // Fall back to the seeded mock store so the portal stays usable.
    seedDemoStoreIfEmpty();
    const workOrders = listSharedWorkOrdersForPartner(partnerId).map((w) => ({
      id: w.id,
      title: w.serviceSubcategory || w.serviceCategory,
      address: w.propertyAddress,
      status: w.status,
      clientName: w.clientName,
      isMyProperty: !!w.isMyProperty,
      createdAt: w.createdAt,
      updatedAt: w.createdAt,
    }));

    return json({ ok: true, workOrders, warning: "db_unavailable", error: (err as Error)?.message || String(err) });
  }
}
