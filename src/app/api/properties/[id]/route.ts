import { NextResponse } from "next/server";

import { dbEnabled, db } from "@/lib/db";
import { getSessionTokenFromCookie, getSessionUserId } from "@/lib/session";
import { listProperties, seedDemoStoreIfEmpty } from "@/lib/mock-store";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const demo = url.searchParams.get("demo") === "1";

  const { id } = await ctx.params;

  if (demo || token === "demo") seedDemoStoreIfEmpty();

  if (dbEnabled() && !demo) {
    const sessionToken = await getSessionTokenFromCookie();
    if (!sessionToken) return json({ ok: false, error: "unauthorized" }, { status: 401 });
    const userId = await getSessionUserId(sessionToken);
    if (!userId) return json({ ok: false, error: "unauthorized" }, { status: 401 });

    const property = await db().property.findFirst({ where: { id, userId } });
    if (!property) return json({ ok: false, error: "not_found" }, { status: 404 });
    return json({ ok: true, property });
  }

  const resolvedToken = token || (demo ? "demo" : null);
  if (!resolvedToken) return json({ ok: false, error: "missing_token" }, { status: 400 });

  const property = listProperties(resolvedToken).find((p) => p.id === id) || null;
  if (!property) return json({ ok: false, error: "not_found" }, { status: 404 });

  return json({ ok: true, property });
}
