import { NextResponse } from "next/server";

import { dbEnabled } from "@/lib/db";
import { createMessage, listMessages, seedDemoStoreIfEmpty } from "@/lib/mock-store";

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

  const demo = url.searchParams.get("demo") === "1";
  if (demo) seedDemoStoreIfEmpty();

  if (dbEnabled() && !demo) {
    // Messages are not yet modeled in Prisma for Phase 2.
    return json({ ok: true, messages: [] });
  }

  const messages = listMessages({ token, partnerId, limit: Number.isFinite(limit) ? limit : 20 });
  return json({ ok: true, messages });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      partnerId?: string;
      name?: string;
      email?: string;
      message?: string;
    };

    const partnerId = body.partnerId?.trim();
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const message = body.message?.trim();

    if (!partnerId) return json({ ok: false, error: "missing_partner" }, { status: 400 });
    if (!name) return json({ ok: false, error: "missing_name" }, { status: 400 });
    if (!email || !email.includes("@")) return json({ ok: false, error: "invalid_email" }, { status: 400 });
    if (!message) return json({ ok: false, error: "missing_message" }, { status: 400 });

    // DB mode: messages aren't modeled yet. We'll accept and no-op (prevents UI breakage).
    if (dbEnabled()) {
      return json({ ok: true });
    }

    createMessage({
      partnerId,
      fromRole: "HO",
      body: `${name} <${email}>: ${message}`,
      readAt: null,
      threadId: `lead_${partnerId}`,
    });

    return json({ ok: true });
  } catch {
    return json({ ok: false, error: "bad_json" }, { status: 400 });
  }
}
