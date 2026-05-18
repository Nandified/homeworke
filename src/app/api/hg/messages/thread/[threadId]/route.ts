import { NextResponse } from "next/server";

import { dbEnabled, db } from "@/lib/db";
import { createMessage, seedDemoStoreIfEmpty, store } from "@/lib/mock-store";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

export async function GET(req: Request, ctx: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await ctx.params;
  const url = new URL(req.url);
  const demo = url.searchParams.get("demo") === "1";
  if (demo) seedDemoStoreIfEmpty();

  if (!dbEnabled() || demo) {
    const messages = store().messages
      .filter((m) => m.threadId === threadId)
      .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
    return json({ ok: true, messages });
  }

  try {
    void db();
  } catch {}
  return json({ ok: true, messages: [] });
}

export async function POST(req: Request, ctx: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await ctx.params;
  const body = (await req.json().catch(() => null)) as any;
  if (!body || typeof body !== "object") return json({ ok: false, error: "bad_json" }, { status: 400 });

  const demo = body.demo === true;
  if (demo) seedDemoStoreIfEmpty();

  if (!dbEnabled() || demo) {
    const text = String(body.text || "").trim();
    if (!text) return json({ ok: false, error: "missing_text" }, { status: 400 });

    // Best-effort copy metadata from latest message in the thread.
    const last = store().messages.find((m) => m.threadId === threadId) || null;

    const m = createMessage({
      threadId,
      token: last?.token,
      partnerId: last?.partnerId,
      threadTitle: last?.threadTitle,
      ownerName: last?.ownerName,
      propertyAddress: last?.propertyAddress,
      fromRole: "HG",
      body: text,
      readAt: new Date().toISOString(),
    });

    return json({ ok: true, message: m });
  }

  return json({ ok: false, error: "db_not_supported" }, { status: 501 });
}
