"use client";

import { useEffect, useMemo, useState } from "react";

import { EmptyState, StatTile } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { ListRow, StatusChip } from "@/components/dashboard/ListRow";

type WorkOrder = {
  id: string;
  createdAt: string;
  serviceCategory?: string;
  propertyAddress?: string;
  status?: string;
};

const nav = [
  { href: "/pm/dashboard", label: "Dashboard" },
  { href: "/pm/projects", label: "My Projects" },
  { href: "/pm/calendar", label: "Calendar" },
  { href: "/pm/messages", label: "Messages" },
  { href: "/pm/support", label: "Support" },
  { href: "/pm/account", label: "My Account" },
];

export default function ProjectManagerDashboardPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/work-orders/recent?limit=20");
        const data = (await res.json()) as { ok: boolean; workOrders?: WorkOrder[] };
        if (!res.ok || !data.ok) throw new Error("failed_to_load");
        if (!cancelled) setWorkOrders(data.workOrders || []);
      } catch {
        if (!cancelled) setWorkOrders([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const scheduledCount = useMemo(
    () => (workOrders || []).filter((w) => (w.status || "").toLowerCase() === "scheduled").length,
    [workOrders]
  );

  const inProgressCount = useMemo(
    () => (workOrders || []).filter((w) => (w.status || "").toLowerCase().includes("progress")).length,
    [workOrders]
  );

  return (
    <PortalShell role="PM" title="Project Manager" nav={nav} description="Triage your assigned jobs and keep communication moving." >
      <div className="grid gap-6">
        <KpiGrid>
          <StatTile label="Scheduled" value={String(scheduledCount)} note="Upcoming appointments (Phase 2: derived from status)." />
          <StatTile label="In progress" value={String(inProgressCount)} note="Live jobs." />
          <StatTile label="SLA alerts" value="—" note="Coming soon" />
        </KpiGrid>

        <DashboardSection title="My projects" count={workOrders?.length ?? "—"}>
          <div className="grid gap-2">
            {workOrders === null ? (
              <div className="text-sm text-[var(--hw-muted)]">Loading…</div>
            ) : workOrders.length === 0 ? (
              <EmptyState title="No projects" text="Once work orders are assigned, they'll show here." />
            ) : (
              workOrders.slice(0, 8).map((w) => (
                <ListRow
                  key={w.id}
                  title={w.serviceCategory || "Work Order"}
                  subtitle={w.propertyAddress || w.id}
                  badge={w.status ? <StatusChip>{w.status}</StatusChip> : null}
                />
              ))
            )}
          </div>
        </DashboardSection>
      </div>
    </PortalShell>
  );
}
