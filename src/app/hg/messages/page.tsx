"use client";
import { HG_NAV } from "@/components/hg/nav";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Container, EmptyState, Input, Pill } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { ListRow, StatusChip } from "@/components/dashboard/ListRow";

type Msg = {
  id: string;
  createdAt: string;
  threadId: string;
  threadTitle?: string | null;
  ownerName?: string | null;
  propertyAddress?: string | null;
  workOrderId?: string | null;
  fromRole?: string;
  body: string;
  readAt?: string | null;
};

function fmtDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function HomeGuideMessagesPage() {
  const [items, setItems] = useState<Msg[] | null>(null);
  const [q, setQ] = useState("");
  const [onlyUnread, setOnlyUnread] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/messages?limit=200&demo=1");
        const j = (await res.json()) as { ok: boolean; messages?: Msg[] };
        if (!res.ok || !j.ok) throw new Error("failed");
        if (!cancelled) setItems(j.messages || []);
      } catch {
        if (!cancelled) setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return (items || []).filter((m) => {
      if (onlyUnread && m.readAt) return false;
      if (!query) return true;
      const hay = [m.threadTitle, m.ownerName, m.propertyAddress, m.body, m.threadId, m.workOrderId]
        .filter(Boolean)
        .map((x) => String(x).toLowerCase())
        .join(" | ");
      return hay.includes(query);
    });
  }, [items, q, onlyUnread]);

  return (
    <PortalShell role="HG" title="Home Guide" nav={HG_NAV} description="Inbox across the platform. (v1: thread list; per-thread view next)." >
      <Container>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">Messages</div>
            <div className="mt-1 text-sm text-[var(--hw-muted)]">Search threads by address, owner, or content.</div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Input value={q} onChange={(e) => setQ(e.currentTarget.value)} placeholder="Search messages…" className="sm:w-[320px]" />
            <button
              type="button"
              onClick={() => setOnlyUnread((v) => !v)}
              className="h-11 rounded-[var(--hw-radius-sm)] border border-[var(--hw-line)] bg-white px-3 text-sm"
            >
              {onlyUnread ? "Unread only" : "All"}
            </button>
          </div>
        </div>

        <div className="mt-6">
          <DashboardSection title="Recent" count={items === null ? "—" : filtered.length}>
            <div className="grid gap-2">
              {items === null ? (
                <div className="text-sm text-[var(--hw-muted)]">Loading…</div>
              ) : filtered.length === 0 ? (
                <EmptyState title="No messages" text="Once a user starts a thread, it will appear here." />
              ) : (
                filtered.slice(0, 100).map((m) => (
                  <ListRow
                    key={m.id}
                    href={m.workOrderId ? `/hg/projects/${m.workOrderId}` : undefined}
                    title={
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{m.threadTitle || "Thread"}</span>
                        {m.ownerName ? <Pill>{m.ownerName}</Pill> : null}
                      </div>
                    }
                    subtitle={m.propertyAddress || m.threadId}
                    footnote={m.body}
                    badge={!m.readAt ? <StatusChip className="border-[rgba(229,57,53,.25)] bg-[rgba(229,57,53,.06)] text-[var(--hw-red)]">Unread</StatusChip> : null}
                    meta={fmtDate(m.createdAt)}
                  />
                ))
              )}
            </div>
          </DashboardSection>

          <div className="mt-4 text-xs text-[var(--hw-muted)]">
            Tip: clicking a row routes to the linked project/work order when available. Next step is a dedicated thread view + reply composer.
          </div>
        </div>
      </Container>
    </PortalShell>
  );
}
