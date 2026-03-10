"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button, Card, EmptyState, Pill, StatTile } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";

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
    <PortalShell role="SP" title="Service Provider" nav={nav}>
      <div className="grid gap-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <StatTile label="Open opportunities" value={String(openCount)} note="Phase 2: sourced from WorkOrders." />
          <StatTile label="Active bids" value="—" note="Coming soon" />
          <StatTile label="Availability" value="—" note="Coming soon" />
        </div>

        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold">Latest opportunities</div>
            <Pill>{opportunities?.length ?? "—"}</Pill>
          </div>

          <div className="mt-4 grid gap-2">
            {opportunities === null ? (
              <div className="text-sm text-[var(--hw-muted)]">Loading…</div>
            ) : opportunities.length === 0 ? (
              <EmptyState title="No opportunities yet" text="As work orders are created, they'll show up here for matching." />
            ) : (
              opportunities.slice(0, 6).map((w) => (
                <div key={w.id} className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-4">
                  <div className="text-sm font-semibold text-[var(--hw-ink)]">{w.serviceCategory || "Work order"}</div>
                  <div className="mt-1 text-sm text-[var(--hw-muted)]">{w.propertyAddress || "Address TBD"}</div>
                  {w.issueDescription ? (
                    <div className="mt-2 text-xs text-[var(--hw-muted)] line-clamp-2">{w.issueDescription}</div>
                  ) : null}
                </div>
              ))
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/sp/find-work">
              <Button>Find work</Button>
            </Link>
            <Link href="/sp/my-bids">
              <Button variant="secondary">View bids</Button>
            </Link>
          </div>
        </Card>
      </div>
    </PortalShell>
  );
}
