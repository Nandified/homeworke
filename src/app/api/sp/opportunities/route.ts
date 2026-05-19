import { NextResponse } from "next/server";

import { dbEnabled, db } from "@/lib/db";
import { seedDemoStoreIfEmpty, store } from "@/lib/mock-store";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

// Service Provider opportunity feed.
// Demo mode: reuse recent work orders as opportunities.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") || "30");
  const take = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 200) : 30;

  const demo = url.searchParams.get("demo") === "1";
  if (demo) seedDemoStoreIfEmpty();

  if (!dbEnabled() || demo) {
    const items = store().workOrders
      .filter((w) => (w.status || "").toLowerCase() !== "completed")
      .slice(0, take)
      .map((w) => {
        // Derive zip (best-effort)
        const addr = String((w as any).propertyAddress || "");
        const zip = (addr.match(/\b\d{5}\b/) || [""])[0] || "—";
        const orderNo = (w.id || "").replace(/^wo_/, "").toUpperCase();
        const slotsTotal = 6;
        const slotsAvailable = 3 + ((w.id.length * 7) % 4); // 3..6 deterministic-ish
        const minCents = 25000 + ((w.id.length * 113) % 300000);
        const maxCents = minCents + 150000 + ((w.id.length * 97) % 350000);

        return {
          id: w.id,
          zip,
          orderNo,
          tags: [String(w.serviceSubcategory || w.serviceCategory || "General")].filter(Boolean),
          minCents,
          maxCents,
          possibleStartDate: (w as any).preferredDate || "",
          slotsAvailable,
          slotsTotal,
        };
      });
    return json({ ok: true, opportunities: items });
  }

  // DB mode placeholder: wire to matching pipeline later.
  try {
    void db();
  } catch {}
  return json({ ok: true, opportunities: [] });
}
