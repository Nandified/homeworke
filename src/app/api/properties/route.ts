import { NextResponse } from "next/server";

import { dbEnabled, db } from "@/lib/db";
import { getSessionTokenFromCookie, getSessionUserId } from "@/lib/session";
import { listProperties, seedDemoStoreIfEmpty } from "@/lib/mock-store";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

// Lightweight properties endpoint for dashboard widgets.
// When DB is disabled, we serve from mock-store.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  const demo = url.searchParams.get("demo") === "1";
  // In serverless, the in-memory mock store is per-invocation.
  // Seed whenever we are in demo mode OR using the demo token.
  if (demo || token === "demo") seedDemoStoreIfEmpty();

  if (dbEnabled() && !demo) {
    const sessionToken = await getSessionTokenFromCookie();
    if (!sessionToken) return json({ ok: false, error: "unauthorized" }, { status: 401 });
    const userId = await getSessionUserId(sessionToken);
    if (!userId) return json({ ok: false, error: "unauthorized" }, { status: 401 });

    const properties = await db().property.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 });
    return json({ ok: true, properties });
  }

  // Mock store mode
  const resolvedToken = token || (demo ? "demo" : null);
  if (!resolvedToken) return json({ ok: false, error: "missing_token" }, { status: 400 });

  const properties = listProperties(resolvedToken);
  return json({ ok: true, properties });
}
