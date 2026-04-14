"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { Button, EmptyState, StatTile } from "@/components/ui";
import { AIWorkOrderIntakeCard } from "@/components/ai/AIWorkOrderIntakeCard";
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
    <PortalShell
      role="OFFICE"
      title="Office"
      nav={nav}
      description="Oversee partner activity and the office-level pipeline."
      primaryAction={
        <Link href="/office/work-orders">
          <Button>View work orders</Button>
        </Link>
      }
    >
      <div className="grid gap-6">
        <AIWorkOrderIntakeCard eyebrow="AI work order" title="What’s going on with the property?" primaryCta="Schedule a visit" />

        <KpiGrid>
          <StatTile label="Active projects" value={String(activeCount)} note="Across all partners (Phase 2: mock)." />
          <StatTile label="Partner seats" value="—" note="Coming soon" />
          <StatTile label="Unread threads" value="—" note="Coming soon" />
        </KpiGrid>

        <DashboardSection title="Recent work orders" count={workOrders?.length ?? "—"}>
          <div className="grid gap-2">
            {workOrders === null ? (
              <div className="text-sm text-[var(--hw-muted)]">Loading…</div>
            ) : workOrders.length === 0 ? (
              <EmptyState title="No work orders yet" text="Once office members originate projects, they'll show up here." />
            ) : (
              workOrders.slice(0, 6).map((w) => (
                <ListRow
                  key={w.id}
                  title={w.serviceCategory || "Work order"}
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
