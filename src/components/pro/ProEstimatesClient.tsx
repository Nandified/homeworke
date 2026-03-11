"use client";

import * as React from "react";

import { Card, Chip, Divider } from "@/components/ui";
import { isDemoMode } from "@/lib/demo";

import { StatusBadge } from "./StatusBadge";
import { usePartnerContext } from "./usePartnerContext";

type ApiWorkOrder = {
  id: string;
  title?: string;
  address?: string;
  status: string;
  clientName?: string;
  createdAt?: string;
};

export function ProEstimatesClient(props: { empty: React.ReactNode }) {
  const { partnerId } = usePartnerContext();
  const [items, setItems] = React.useState<ApiWorkOrder[] | null>(null);

  React.useEffect(() => {
    if (!partnerId) return;

    const url = new URL("/api/pro/work-orders", window.location.origin);
    url.searchParams.set("partnerId", partnerId);
    if (isDemoMode()) url.searchParams.set("demo", "1");

    fetch(url)
      .then((r) => r.json())
      .then((j) => {
        const all: ApiWorkOrder[] = j.workOrders || [];
        // Treat Express Estimate category as “estimate-like” until a real estimate model exists.
        const filtered = all.filter((w) => (w.title || "").toLowerCase().includes("estimate"));
        setItems(filtered);
      })
      .catch(() => setItems([]));
  }, [partnerId]);

  if (!partnerId) {
    return (
      <div className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-4 text-sm text-[var(--hw-muted)]">
        Missing partner context. Open your partner link first (e.g. <span className="font-semibold">/p/frj</span>) or use <span className="font-semibold">?demo=1</span>.
      </div>
    );
  }

  if (items === null) {
    return (
      <div className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-5 text-sm text-[var(--hw-muted)]">
        Loading estimates…
      </div>
    );
  }

  if (!items.length) return <>{props.empty}</>;

  return (
    <div className="grid gap-3">
      {items.map((w) => (
        <Card key={w.id} className="p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[var(--hw-ink)]">{w.title || "Estimate"}</div>
              {w.address ? <div className="mt-1 truncate text-sm text-[var(--hw-muted)]">{w.address}</div> : null}
              {w.clientName ? <div className="mt-2"><Chip>Client: {w.clientName}</Chip></div> : null}
            </div>
            <StatusBadge status={w.status} />
          </div>
          <Divider className="my-4" />
          <div className="flex flex-wrap gap-2">
            <button className="rounded-full border border-[var(--hw-line)] bg-white px-4 py-2 text-xs font-semibold text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]">
              Open
            </button>
            <button className="rounded-full border border-[var(--hw-line)] bg-white px-4 py-2 text-xs font-semibold text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]">
              Export PDF (stub)
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}
