import { NextResponse } from "next/server";

import { dbEnabled, db } from "@/lib/db";
import { seedDemoStoreIfEmpty, store, type ProviderApprovalStatus } from "@/lib/mock-store";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const status = (url.searchParams.get("status") || "") as ProviderApprovalStatus | "all";
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const limit = Number(url.searchParams.get("limit") || "200");
  const take = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 500) : 200;

  const demo = url.searchParams.get("demo") === "1";
  if (demo) seedDemoStoreIfEmpty();

  if (!dbEnabled() || demo) {
    let items = store().providers.slice();
    if (status && status !== "all") items = items.filter((p) => p.approvalStatus === status);
    if (q) {
      items = items.filter((p) => {
        const hay = [p.fullName, p.email, p.phone, ...(p.trades || [])].filter(Boolean).join(" | ").toLowerCase();
        return hay.includes(q);
      });
    }
    items = items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return json({ ok: true, providers: items.slice(0, take) });
  }

  try {
    void db();
  } catch {}
  return json({ ok: true, providers: [] });
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
    const p = store().providers.find((x) => x.id === id);
    if (!p) return json({ ok: false, error: "not_found" }, { status: 404 });

    if (action === "approve") {
      p.approvalStatus = "approved";
      return json({ ok: true, provider: p });
    }
    if (action === "reject") {
      p.approvalStatus = "rejected";
      return json({ ok: true, provider: p });
    }

    return json({ ok: false, error: "unsupported_action" }, { status: 400 });
  }

  return json({ ok: false, error: "db_not_supported" }, { status: 501 });
}
