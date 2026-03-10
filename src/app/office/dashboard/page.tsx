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
  { href: "/office/dashboard", label: "Dashboard" },
  { href: "/office/partners", label: "Partners" },
  { href: "/office/work-orders", label: "Work Orders" },
  { href: "/office/messages", label: "Messages" },
  { href: "/office/support", label: "Support" },
  { href: "/office/account", label: "Office Settings" },
];

export default function OfficeDashboardPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/work-orders/recent?limit=10");
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

  const activeCount = useMemo(
    () => (workOrders || []).filter((w) => (w.status || "").toLowerCase() !== "completed").length,
    [workOrders]
  );

  return (
    <PortalShell role="OFFICE" title="Office" nav={nav}>
      <div className="grid gap-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <StatTile label="Active projects" value={String(activeCount)} note="Across all partners (Phase 2: mock)." />
          <StatTile label="Partner seats" value="—" note="Coming soon" />
          <StatTile label="Unread threads" value="—" note="Coming soon" />
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold">Recent work orders</div>
            <Pill>{workOrders?.length ?? "—"}</Pill>
          </div>
          <div className="mt-4 grid gap-2">
            {workOrders === null ? (
              <div className="text-sm text-[var(--hw-muted)]">Loading…</div>
            ) : workOrders.length === 0 ? (
              <EmptyState title="No work orders yet" text="Once office members originate projects, they'll show up here." />
            ) : (
              workOrders.slice(0, 6).map((w) => (
                <div key={w.id} className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-3">
                  <div className="text-sm font-semibold text-[var(--hw-ink)]">{w.serviceCategory || "Work order"}</div>
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
