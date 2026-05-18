"use client";
import { HG_NAV } from "@/components/hg/nav";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button, Container, EmptyState, Pill, StatTile } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { ListRow, StatusChip } from "@/components/dashboard/ListRow";

type WorkOrder = {
  id: string;
  createdAt: string;
  serviceCategory?: string;
  serviceSubcategory?: string;
  propertyAddress?: string;
  status?: string;
};

type Ticket = {
  id: string;
  createdAt: string;
  status: string;
  userName: string;
  userRole: string;
  message: string;
};

type Provider = {
  id: string;
  createdAt: string;
  approvalStatus: string;
  fullName: string;
  email: string;
  completionPct: number;
  trades: string[];
};

type ThreadRow = {
  threadId: string;
  threadTitle?: string;
  ownerName?: string;
  propertyAddress?: string;
  lastBody: string;
  lastAt: string;
  unreadCount: number;
};

export default function HomeGuideDashboardPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[] | null>(null);
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [providers, setProviders] = useState<Provider[] | null>(null);
  const [threads, setThreads] = useState<ThreadRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [woRes, tRes, pRes, thRes] = await Promise.all([
          fetch("/api/hg/work-orders/recent?limit=30"),
          fetch("/api/hg/help-desk?status=pending&demo=1"),
          fetch("/api/hg/providers?status=join_request&demo=1"),
          fetch("/api/hg/messages/threads?demo=1"),
        ]);

        const woJson = (await woRes.json()) as { ok: boolean; workOrders?: WorkOrder[] };
        const tJson = (await tRes.json()) as { ok: boolean; tickets?: Ticket[] };
        const pJson = (await pRes.json()) as { ok: boolean; providers?: Provider[] };
        const thJson = (await thRes.json()) as { ok: boolean; threads?: ThreadRow[] };

        if (!cancelled) {
          setWorkOrders(woJson.workOrders || []);
          setTickets(tJson.tickets || []);
          setProviders(pJson.providers || []);
          setThreads(thJson.threads || []);
        }
      } catch {
        if (!cancelled) {
          setWorkOrders([]);
          setTickets([]);
          setProviders([]);
          setThreads([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const pendingWorkOrders = useMemo(
    () => (workOrders || []).filter((w) => (w.status || "").toLowerCase() === "pending"),
    [workOrders]
  );

  const activeCount = useMemo(
    () => (workOrders || []).filter((w) => {
      const s = (w.status || "").toLowerCase();
      return s !== "completed" && s !== "cancelled";
    }).length,
    [workOrders]
  );

  const unreadThreadCount = useMemo(() => (threads || []).filter((t) => (t.unreadCount || 0) > 0).length, [threads]);

  return (
    <PortalShell
      role="HG"
      title="Home Guide"
      nav={HG_NAV}
      description="Monitor queues, keep threads moving, and route work to the right team."
    >
      <Container>
        <div className="grid gap-6">
          <KpiGrid>
            <StatTile label="Work orders pending" value={String(pendingWorkOrders.length)} note="Triage queue" />
            <StatTile label="Pending tickets" value={String(tickets?.length ?? 0)} note="Help Desk" />
            <StatTile label="Join requests" value={String(providers?.length ?? 0)} note="Service Providers" />
            <StatTile label="Unread threads" value={String(unreadThreadCount)} note="Messages" />
            <StatTile label="Active projects" value={String(activeCount)} note="Non-completed" />
          </KpiGrid>

          <div className="grid gap-6 lg:grid-cols-3">
            <DashboardSection title="Triage queue" count={workOrders === null ? "—" : pendingWorkOrders.length}>
              <div className="grid gap-2">
                {workOrders === null ? (
                  <div className="text-sm text-[var(--hw-muted)]">Loading…</div>
                ) : pendingWorkOrders.length === 0 ? (
                  <EmptyState title="No pending work orders" text="You're caught up." />
                ) : (
                  pendingWorkOrders.slice(0, 6).map((w) => (
                    <ListRow
                      key={w.id}
                      href={`/hg/projects/${w.id}`}
                      title={w.serviceSubcategory ? `${w.serviceCategory || "Work Order"} • ${w.serviceSubcategory}` : w.serviceCategory || "Work Order"}
                      subtitle={w.propertyAddress || w.id}
                      badge={w.status ? <StatusChip>{w.status}</StatusChip> : null}
                    />
                  ))
                )}
                <Link href="/hg/projects" className="no-underline">
                  <Button variant="secondary" size="sm">View all projects</Button>
                </Link>
              </div>
            </DashboardSection>

            <DashboardSection title="Help Desk" count={tickets === null ? "—" : tickets?.length ?? 0}>
              <div className="grid gap-2">
                {tickets === null ? (
                  <div className="text-sm text-[var(--hw-muted)]">Loading…</div>
                ) : (tickets || []).length === 0 ? (
                  <EmptyState title="No pending tickets" text="Nothing needs attention." />
                ) : (
                  (tickets || []).slice(0, 6).map((t) => (
                    <ListRow
                      key={t.id}
                      href="/hg/help-desk"
                      title={<span>{t.userName} <span className="text-xs text-[var(--hw-muted)]">({t.userRole})</span></span>}
                      subtitle={t.message}
                      badge={<StatusChip>{t.status}</StatusChip>}
                    />
                  ))
                )}
                <Link href="/hg/help-desk" className="no-underline">
                  <Button variant="secondary" size="sm">Open Help Desk</Button>
                </Link>
              </div>
            </DashboardSection>

            <DashboardSection title="Service Providers" count={providers === null ? "—" : providers?.length ?? 0}>
              <div className="grid gap-2">
                {providers === null ? (
                  <div className="text-sm text-[var(--hw-muted)]">Loading…</div>
                ) : (providers || []).length === 0 ? (
                  <EmptyState title="No join requests" text="All caught up." />
                ) : (
                  (providers || []).slice(0, 6).map((p) => (
                    <ListRow
                      key={p.id}
                      href="/hg/service-providers"
                      title={p.fullName}
                      subtitle={p.email}
                      footnote={Array.isArray(p.trades) && p.trades.length ? p.trades.slice(0, 2).join(" • ") : undefined}
                      badge={<StatusChip>{p.approvalStatus}</StatusChip>}
                      meta={<Pill>{p.completionPct}%</Pill>}
                    />
                  ))
                )}
                <Link href="/hg/service-providers" className="no-underline">
                  <Button variant="secondary" size="sm">Review providers</Button>
                </Link>
              </div>
            </DashboardSection>
          </div>
        </div>
      </Container>
    </PortalShell>
  );
}
