"use client";
import { HG_NAV } from "@/components/hg/nav";

import { useEffect, useMemo, useState } from "react";

import { Container, EmptyState, Input, Pill } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { ListRow, StatusChip } from "@/components/dashboard/ListRow";

type Person = {
  id: string;
  createdAt: string;
  kind: "customer" | "rep";
  fullName: string;
  email?: string;
  phone?: string;
  primaryAddress?: string;
  activeWorkOrders?: number;
};

export default function HomeGuideCustomersPage() {
  const [items, setItems] = useState<Person[] | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/hg/people?kind=customer&q=${encodeURIComponent(q)}&demo=1`);
        const j = (await res.json().catch(() => null)) as any;
        if (!cancelled) setItems(Array.isArray(j?.people) ? (j.people as Person[]) : []);
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
    <PortalShell role="HG" title="Home Guide" nav={HG_NAV} description="Customer directory (read-only in v1)." >
      <Container>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">Customers</div>
            <div className="mt-1 text-sm text-[var(--hw-muted)]">Search customers and jump into related work.</div>
          </div>
          <div className="w-full sm:w-auto sm:min-w-[320px]">
            <Input value={q} onChange={(e) => setQ(e.currentTarget.value)} placeholder="Search name, email, address…" />
          </div>
        </div>

        <div className="mt-6">
          <DashboardSection title="Directory" count={items === null ? "—" : list.length}>
            <div className="grid gap-2">
              {items === null ? (
                <div className="text-sm text-[var(--hw-muted)]">Loading…</div>
              ) : list.length === 0 ? (
                <EmptyState title="No customers" text="No directory entries yet." />
              ) : (
                list.map((p) => (
                  <ListRow
                    key={p.id}
                    title={
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{p.fullName}</span>
                        {typeof p.activeWorkOrders === "number" ? <Pill>{p.activeWorkOrders} active</Pill> : null}
                      </div>
                    }
                    subtitle={[p.email, p.phone].filter(Boolean).join(" • ")}
                    footnote={p.primaryAddress}
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
