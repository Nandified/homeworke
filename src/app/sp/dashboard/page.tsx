"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button, EmptyState, StatTile } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { ListRow, StatusChip } from "@/components/dashboard/ListRow";

type WorkOrder = {
  id: string;
  createdAt: string;
  serviceCategory?: string;
  issueDescription?: string;
  propertyAddress?: string;
  status?: string;
};

const nav = [
  { href: "/sp/dashboard", label: "Dashboard" },
  { href: "/sp/find-work", label: "Find Work" },
  { href: "/sp/messages", label: "Messages" },
  { href: "/sp/my-qtrs", label: "My Qtrs" },
  { href: "/sp/my-bids", label: "My Bid(s)" },
  { href: "/sp/support", label: "Support" },
  { href: "/sp/account", label: "My Account" },
];

export default function ServiceProviderDashboardPage() {
  const [opportunities, setOpportunities] = useState<WorkOrder[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/work-orders/recent?limit=12");
        const data = (await res.json()) as { ok: boolean; workOrders?: WorkOrder[] };
        if (!res.ok || !data.ok) throw new Error("failed_to_load");
        if (!cancelled) setOpportunities(data.workOrders || []);
      } catch {
        if (!cancelled) setOpportunities([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openCount = useMemo(
    () => (opportunities || []).filter((w) => (w.status || "").toLowerCase() !== "completed").length,
    [opportunities]
  );

  return (
    <PortalShell
      role="SP"
      title="Service Provider"
      nav={nav}
      description="Browse matching opportunities and manage your bids."
      primaryAction={
        <Link href="/sp/find-work">
          <Button>Find work</Button>
        </Link>
      }
    >
      <div className="grid gap-6">
        <KpiGrid>
          <StatTile label="Open opportunities" value={String(openCount)} note="Phase 2: sourced from WorkOrders." />
          <StatTile label="Active bids" value="—" note="Coming soon" />
          <StatTile label="Availability" value="—" note="Coming soon" />
        </KpiGrid>

        <DashboardSection
          title="Latest opportunities"
          count={opportunities?.length ?? "—"}
          action={
            <Link href="/sp/my-bids">
              <Button variant="secondary">View bids</Button>
            </Link>
          }
        >
          <div className="grid gap-2">
            {opportunities === null ? (
              <div className="text-sm text-[var(--hw-muted)]">Loading…</div>
            ) : opportunities.length === 0 ? (
              <EmptyState title="No opportunities yet" text="As work orders are created, they'll show up here for matching." />
            ) : (
              opportunities.slice(0, 6).map((w) => (
                <ListRow
                  key={w.id}
                  title={w.serviceCategory || "Work order"}
                  subtitle={w.propertyAddress || "Address TBD"}
                  footnote={w.issueDescription}
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
