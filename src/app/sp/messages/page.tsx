"use client";
import { SP_NAV } from "@/components/sp/nav";

import { useEffect, useMemo, useState } from "react";

import { Container, EmptyState, Input, Pill } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { ListRow, StatusChip } from "@/components/dashboard/ListRow";

type ThreadRow = {
  threadId: string;
  threadTitle?: string;
  ownerName?: string;
  propertyAddress?: string;
  lastBody: string;
  lastAt: string;
  unreadCount: number;
};

function fmtDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function ServiceProviderMessagesPage() {
  const [items, setItems] = useState<ThreadRow[] | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/hg/messages/threads?q=${encodeURIComponent(q)}&demo=1`);
        const j = (await res.json().catch(() => null)) as any;
        if (!cancelled) setItems(Array.isArray(j?.threads) ? (j.threads as ThreadRow[]) : []);
      } catch {
        if (!cancelled) setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [q]);

  const list = useMemo(() => items || [], [items]);

  return (
    <PortalShell role="SP" title="Service Provider" nav={SP_NAV} description="Messages across your jobs." >
      <Container>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">Messages</div>
            <div className="mt-1 text-sm text-[var(--hw-muted)]">Search threads by address, owner, or last message.</div>
          </div>
          <div className="w-full sm:w-auto sm:min-w-[320px]">
            <Input value={q} onChange={(e) => setQ(e.currentTarget.value)} placeholder="Search threads…" />
          </div>
        </div>

        <div className="mt-6">
          <DashboardSection title="Threads" count={items === null ? "—" : list.length}>
            <div className="grid gap-2">
              {items === null ? (
                <div className="text-sm text-[var(--hw-muted)]">Loading…</div>
              ) : list.length === 0 ? (
                <EmptyState title="No threads" text="Once a job has a thread, it will appear here." />
              ) : (
                list.map((t) => (
                  <ListRow
                    key={t.threadId}
                    href={`/sp/messages/${encodeURIComponent(t.threadId)}`}
                    title={
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{t.threadTitle || "Thread"}</span>
                        {t.ownerName ? <Pill>{t.ownerName}</Pill> : null}
                      </div>
                    }
                    subtitle={t.propertyAddress || t.threadId}
                    footnote={t.lastBody}
                    badge={t.unreadCount ? (
                      <StatusChip className="border-[rgba(229,57,53,.25)] bg-[rgba(229,57,53,.06)] text-[var(--hw-red)]">
                        {t.unreadCount} unread
                      </StatusChip>
                    ) : null}
                    meta={fmtDate(t.lastAt)}
                  />
                ))
              )}
            </div>
          </DashboardSection>
        </div>
      </Container>
    </PortalShell>
  );
}
