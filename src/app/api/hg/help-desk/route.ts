import { NextResponse } from "next/server";

import { dbEnabled, db } from "@/lib/db";
import { seedDemoStoreIfEmpty, store, type HelpDeskStatus } from "@/lib/mock-store";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const status = (url.searchParams.get("status") || "") as HelpDeskStatus | "all";
  const limit = Number(url.searchParams.get("limit") || "200");
  const take = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 500) : 200;

  const demo = url.searchParams.get("demo") === "1";
  if (demo) seedDemoStoreIfEmpty();

  if (!dbEnabled() || demo) {
    const items = store().helpDesk
      .filter((t) => (status === "all" || !status ? true : t.status === status))
      .slice(0, take);
    return json({ ok: true, tickets: items });
  }

  // DB mode: placeholder until HelpDesk tables exist.
  // Return empty list rather than throwing.
  try {
    void db();
  } catch {}
  return json({ ok: true, tickets: [] });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as any;
  if (!body || typeof body !== "object") return json({ ok: false, error: "bad_json" }, { status: 400 });

  const demo = body.demo === true;
  if (demo) seedDemoStoreIfEmpty();

  const action = String(body.action || "");
  const id = String(body.id || "");
  if (!id) return json({ ok: false, error: "missing_id" }, { status: 400 });

  if (!dbEnabled() || demo) {
    const t = store().helpDesk.find((x) => x.id === id);
    if (!t) return json({ ok: false, error: "not_found" }, { status: 404 });

    if (action === "accept") {
      t.status = "accepted";
      t.assignedAt = new Date().toISOString();
      t.homeGuideName = String(body.homeGuideName || t.homeGuideName || "Home Guide");
      return json({ ok: true, ticket: t });
    }

    if (action === "solve") {
      t.status = "solved";
      return json({ ok: true, ticket: t });
    }

    if (action === "add_note") {
      const text = String(body.text || "").trim();
      if (!text) return json({ ok: false, error: "missing_text" }, { status: 400 });
      if (!Array.isArray(t.notes)) t.notes = [];
      t.notes.unshift({ id: `note_${Math.random().toString(36).slice(2, 9)}`, body: text, createdAt: new Date().toISOString() });
      return json({ ok: true, ticket: t });
    }

    return json({ ok: false, error: "unsupported_action" }, { status: 400 });
  }

  return json({ ok: false, error: "db_not_supported" }, { status: 501 });
}
