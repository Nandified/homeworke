import { NextResponse } from "next/server";

import { dbEnabled, db } from "@/lib/db";
import { seedDemoStoreIfEmpty, store } from "@/lib/mock-store";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

type ThreadRow = {
  threadId: string;
  threadTitle?: string;
  ownerName?: string;
  propertyAddress?: string;
  lastBody: string;
  lastAt: string;
  unreadCount: number;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const demo = url.searchParams.get("demo") === "1";
  if (demo) seedDemoStoreIfEmpty();

  if (!dbEnabled() || demo) {
    const by = new Map<string, ThreadRow>();
    for (const m of store().messages) {
      const key = m.threadId;
      const prev = by.get(key);
      const createdAt = m.createdAt;
      if (!prev) {
        by.set(key, {
          threadId: m.threadId,
          threadTitle: m.threadTitle,
          ownerName: m.ownerName,
          propertyAddress: m.propertyAddress,
          lastBody: m.body,
          lastAt: createdAt,
          unreadCount: !m.readAt ? 1 : 0,
        });
      } else {
        if (createdAt > prev.lastAt) {
          prev.lastAt = createdAt;
          prev.lastBody = m.body;
          prev.threadTitle = prev.threadTitle || m.threadTitle;
          prev.ownerName = prev.ownerName || m.ownerName;
          prev.propertyAddress = prev.propertyAddress || m.propertyAddress;
        }
        if (!m.readAt) prev.unreadCount += 1;
      }
    }

    let threads = Array.from(by.values()).sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));
    if (q) {
      threads = threads.filter((t) => {
        const hay = [t.threadTitle, t.ownerName, t.propertyAddress, t.lastBody, t.threadId].filter(Boolean).join(" | ").toLowerCase();
        return hay.includes(q);
      });
    }

    return json({ ok: true, threads });
  }

  // DB mode placeholder.
  try {
    void db();
  } catch {}
  return json({ ok: true, threads: [] });
}
