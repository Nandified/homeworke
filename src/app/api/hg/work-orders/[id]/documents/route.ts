import { NextResponse } from "next/server";

import { dbEnabled } from "@/lib/db";
import { seedDemoStoreIfEmpty, store } from "@/lib/mock-store";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const demo = url.searchParams.get("demo") === "1";
  if (demo) seedDemoStoreIfEmpty();

  if (dbEnabled() && !demo) return json({ ok: true, documents: [] });

  const documents = store().documents.filter((d) => d.workOrderId === id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return json({ ok: true, documents });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as any;
  if (!body || typeof body !== "object") return json({ ok: false, error: "bad_json" }, { status: 400 });

  const demo = body.demo === true;
  if (demo) seedDemoStoreIfEmpty();
  if (dbEnabled() && !demo) return json({ ok: false, error: "db_not_supported" }, { status: 501 });

  const action = String(body.action || "");
  if (action === "add") {
    const title = String(body.title || "").trim();
    const url = String(body.url || "").trim();
    if (!title || !url) return json({ ok: false, error: "missing_fields" }, { status: 400 });

    const doc = {
      id: `doc_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString(),
      workOrderId: id,
      title,
      url,
    };
    store().documents.unshift(doc);
    return json({ ok: true, document: doc });
  }

  return json({ ok: false, error: "unsupported_action" }, { status: 400 });
}
