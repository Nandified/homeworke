import { NextResponse } from "next/server";

import { dbEnabled, db } from "@/lib/db";
import { seedDemoStoreIfEmpty, store, type PersonDirectoryEntry } from "@/lib/mock-store";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const kind = (url.searchParams.get("kind") || "") as PersonDirectoryEntry["kind"] | "all";
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const demo = url.searchParams.get("demo") === "1";
  if (demo) seedDemoStoreIfEmpty();

  if (!dbEnabled() || demo) {
    let items = store().people.slice();
    if (kind && kind !== "all") items = items.filter((p) => p.kind === kind);
    if (q) {
      items = items.filter((p) => {
        const hay = [p.fullName, p.email, p.phone, p.primaryAddress].filter(Boolean).join(" | ").toLowerCase();
        return hay.includes(q);
      });
    }
    items = items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return json({ ok: true, people: items });
  }

  try {
    void db();
  } catch {}
  return json({ ok: true, people: [] });
}
