import { NextResponse } from "next/server";

import { dbEnabled } from "@/lib/db";
import { listMessages } from "@/lib/mock-store";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

// Lightweight messages endpoint for dashboard widgets.
// When DB is disabled, we serve from mock-store.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || undefined;
  const partnerId = url.searchParams.get("partnerId") || undefined;
  const limit = Number(url.searchParams.get("limit") || "20");

  if (dbEnabled()) {
    // Messages are not yet modeled in Prisma for Phase 2.
    return json({ ok: true, messages: [] });
  }

  const messages = listMessages({ token, partnerId, limit: Number.isFinite(limit) ? limit : 20 });
  return json({ ok: true, messages });
}
