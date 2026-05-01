"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { PortalShell } from "@/components/portal-shell";
import { HO_NAV } from "@/components/ho/nav";
import { Button, Card, CardHeader, EmptyState } from "@/components/ui";
import { ListRow, StatusChip } from "@/components/dashboard/ListRow";

type Session = { token: string };

type WorkOrder = {
  id: string;
  createdAt: string;
  serviceCategory: string;
  serviceSubcategory?: string;
  propertyAddress?: string;
  status: string;
};

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem("hw_session_v1");
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export default function Page() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[] | null>(null);

  useEffect(() => {
    const s = loadSession();
    if (!s?.token) {
      setWorkOrders([]);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/work-orders?token=${encodeURIComponent(s.token)}`);
        const j = (await res.json()) as { ok?: boolean; workOrders?: WorkOrder[] };
        if (!res.ok || !j.ok) throw new Error("failed_work_orders");
        setWorkOrders(j.workOrders || []);
      } catch {
        setWorkOrders([]);
      }
    })();
  }, []);

  const sorted = useMemo(() => {
    const list = Array.isArray(workOrders) ? [...workOrders] : [];
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [workOrders]);

  return (
    <PortalShell role="HO" title="Homeowner" nav={HO_NAV as any} hideHeading>
      <Card className="p-6">
        <CardHeader
          title="Jobs"
          subtitle="Track your work orders and status updates."
          action={
            <Link href="/marketplace/intake" className="inline-flex">
              <Button>Request service</Button>
            </Link>
          }
        />

        <div className="mt-5">
          {workOrders === null ? (
            <div className="text-sm text-[var(--hw-muted)]">Loading…</div>
          ) : sorted.length ? (
            <div className="grid gap-2">
              {sorted.map((w) => (
                <ListRow
                  key={w.id}
                  href={`/ho/work-orders/${w.id}`}
                  title={w.serviceSubcategory ? `${w.serviceCategory} / ${w.serviceSubcategory}` : w.serviceCategory}
                  subtitle={w.propertyAddress}
                  badge={<StatusChip>Status: {w.status}</StatusChip>}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No jobs yet"
              text="Start by requesting a service. Your work orders will show up here."
              action={
                <Link href="/marketplace/intake">
                  <Button>Request service</Button>
                </Link>
              }
            />
          )}
        </div>
      </Card>
    </PortalShell>
  );
}
