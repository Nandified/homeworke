"use client";
import { HG_NAV } from "@/components/hg/nav";

import { useEffect, useMemo, useState } from "react";

import { Button, Container, EmptyState, Input, Pill } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { ListRow, StatusChip } from "@/components/dashboard/ListRow";

type Provider = {
  id: string;
  createdAt: string;
  fullName: string;
  email: string;
  phone?: string;
  approvalStatus: "join_request" | "approved" | "rejected";
  completionPct: number;
  trades: string[];
  rating?: number;
};

function fmtDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

export default function HomeGuideServiceProvidersPage() {
  const [items, setItems] = useState<Provider[] | null>(null);
  const [tab, setTab] = useState<"join_request" | "approved" | "rejected" | "all">("join_request");
  const [q, setQ] = useState("");

  async function reload(nextTab = tab) {
    setItems(null);
    const res = await fetch(`/api/hg/providers?status=${encodeURIComponent(nextTab)}&q=${encodeURIComponent(q)}&demo=1`);
    const j = (await res.json().catch(() => null)) as any;
    setItems(Array.isArray(j?.providers) ? (j.providers as Provider[]) : []);
  }

  useEffect(() => {
    reload(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    const id = window.setTimeout(() => reload(tab), 120);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const counts = useMemo(() => {
    const c = { join_request: 0, approved: 0, rejected: 0, all: 0 };
    for (const p of items || []) {
      c.all++;
      if (p.approvalStatus in c) (c as any)[p.approvalStatus]++;
    }
    return c;
  }, [items]);

  async function act(action: "approve" | "reject", id: string) {
    await fetch("/api/hg/providers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ demo: true, action, id }),
    });
    await reload(tab);
  }

  const visible = useMemo(() => {
    if (!items) return [] as Provider[];
    if (tab === "all") return items;
    return items.filter((p) => p.approvalStatus === tab);
  }, [items, tab]);

  return (
    <PortalShell role="HG" title="Home Guide" nav={HG_NAV} description="Manage service provider join requests, approvals, and directory." >
      <Container>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">Service Providers</div>
            <div className="mt-1 text-sm text-[var(--hw-muted)]">Approve join requests and maintain the provider directory.</div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Input value={q} onChange={(e) => setQ(e.currentTarget.value)} placeholder="Search name, email, trade…" className="sm:w-[320px]" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {([
            ["join_request", "Join Requests"],
            ["approved", "Directory"],
            ["rejected", "Rejected"],
            ["all", "All"],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={
                "h-10 rounded-full border px-4 text-sm font-semibold transition " +
                (tab === k
                  ? "border-[rgba(229,57,53,.35)] bg-[rgba(229,57,53,.06)] text-[var(--hw-red)]"
                  : "border-[var(--hw-line)] bg-white text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]")
              }
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          <DashboardSection title={tab === "join_request" ? "Join Requests" : tab === "approved" ? "Directory" : "Providers"} count={items === null ? "—" : visible.length}>
            <div className="grid gap-2">
              {items === null ? (
                <div className="text-sm text-[var(--hw-muted)]">Loading…</div>
              ) : visible.length === 0 ? (
                <EmptyState title="No providers" text="Nothing to show for this tab." />
              ) : (
                visible.map((p) => (
                  <div key={p.id} className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="truncate text-sm font-semibold text-[var(--hw-ink)]">{p.fullName}</div>
                          <StatusChip>{p.approvalStatus}</StatusChip>
                          {typeof p.rating === "number" ? <Pill>{p.rating.toFixed(1)}★</Pill> : null}
                        </div>
                        <div className="mt-1 text-sm text-[var(--hw-muted)]">{p.email}{p.phone ? ` • ${p.phone}` : ""}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(p.trades || []).slice(0, 3).map((t) => (
                            <Pill key={t}>{t}</Pill>
                          ))}
                          {(p.trades || []).length > 3 ? <Pill>+{(p.trades || []).length - 3}</Pill> : null}
                        </div>
                        <div className="mt-2 text-xs text-[var(--hw-muted)]">Completion: {p.completionPct}% • Added: {fmtDate(p.createdAt)}</div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {p.approvalStatus === "join_request" ? (
                          <>
                            <Button size="sm" onClick={() => act("approve", p.id)}>Approve</Button>
                            <Button size="sm" variant="destructive" onClick={() => act("reject", p.id)}>Reject</Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DashboardSection>
        </div>
      </Container>
    </PortalShell>
  );
}
