"use client";

import { useEffect, useMemo, useState } from "react";

import { Card, EmptyState, Pill, StatTile } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";

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
    <PortalShell role="PM" title="Project Manager" nav={nav}>
      <div className="grid gap-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <StatTile label="Scheduled" value={String(scheduledCount)} note="Upcoming appointments (Phase 2: derived from status)." />
          <StatTile label="In progress" value={String(inProgressCount)} note="Live jobs." />
          <StatTile label="SLA alerts" value="—" note="Coming soon" />
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold">My projects</div>
            <Pill>{workOrders?.length ?? "—"}</Pill>
          </div>
          <div className="mt-4 grid gap-2">
            {workOrders === null ? (
              <div className="text-sm text-[var(--hw-muted)]">Loading…</div>
            ) : workOrders.length === 0 ? (
              <EmptyState title="No projects" text="Once work orders are assigned, they'll show here." />
            ) : (
              workOrders.slice(0, 8).map((w) => (
                <div key={w.id} className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[var(--hw-ink)]">{w.serviceCategory || "Work order"}</div>
                    <Pill>{w.status || "—"}</Pill>
                  </div>
                  <div className="mt-1 text-xs text-[var(--hw-muted)]">{w.propertyAddress || w.id}</div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </PortalShell>
  );
}
