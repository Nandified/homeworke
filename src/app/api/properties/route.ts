import { NextResponse } from "next/server";

import { dbEnabled, db } from "@/lib/db";
import { getSessionTokenFromCookie, getSessionUserId } from "@/lib/session";
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

  if (dbEnabled()) {
    const sessionToken = await getSessionTokenFromCookie();
    if (!sessionToken) return json({ ok: false, error: "unauthorized" }, { status: 401 });
    const userId = await getSessionUserId(sessionToken);
    if (!userId) return json({ ok: false, error: "unauthorized" }, { status: 401 });

    const properties = await db().property.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 });
    return json({ ok: true, properties });
  }

  if (!token) return json({ ok: false, error: "missing_token" }, { status: 400 });

  const properties = listProperties(token);
  return json({ ok: true, properties });
}
