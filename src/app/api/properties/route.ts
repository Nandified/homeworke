import { NextResponse } from "next/server";

import { dbEnabled } from "@/lib/db";
import { listProperties } from "@/lib/mock-store";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

// Lightweight properties endpoint for dashboard widgets.
// When DB is disabled, we serve from mock-store.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) return json({ ok: false, error: "missing_token" }, { status: 400 });

  if (dbEnabled()) {
    // Properties are not yet modeled in Prisma for Phase 2.
    return json({ ok: true, properties: [] });
  }

  const properties = listProperties(token);
  return json({ ok: true, properties });
}
