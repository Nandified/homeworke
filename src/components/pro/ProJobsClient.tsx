"use client";

import * as React from "react";

import { Card, Divider } from "@/components/ui";
import { isDemoMode } from "@/lib/demo";
import { PRO_DEMO_WORK_ORDERS } from "@/lib/demo-data";

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

function TabButton(props: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={
        "rounded-full border px-4 py-2 text-xs font-semibold transition " +
        (props.active
          ? "border-[rgba(229,57,53,.45)] bg-[rgba(229,57,53,.08)] text-[var(--hw-red)]"
          : "border-[var(--hw-line)] bg-white text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]")
      }
      aria-pressed={props.active}
    >
      {props.children}
    </button>
  );
}

export function ProJobsClient(props: { emptyClientJobs: React.ReactNode; emptyMyJobs: React.ReactNode }) {
  const { partnerId } = usePartnerContext();
  const [tab, setTab] = React.useState<"client" | "mine">("client");
  const [items, setItems] = React.useState<ApiWorkOrder[] | null>(null);

  const visibleItems = (items && items.length > 0) ? items : PRO_DEMO_WORK_ORDERS;

  React.useEffect(() => {
    if (!partnerId) return;
    const url = new URL("/api/pro/work-orders", window.location.origin);
    url.searchParams.set("partnerId", partnerId);
    if (isDemoMode()) url.searchParams.set("demo", "1");

    fetch(url)
      .then((r) => r.json())
      .then((j) => setItems(j.workOrders || []))
      .catch(() => setItems([]));
  }, [partnerId]);

  if (!partnerId) {
    return (
      <div className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-4 text-sm text-[var(--hw-muted)]">
        Missing partner context. Open your partner link first (e.g. <span className="font-semibold">/p/frj</span>) or use <span className="font-semibold">?demo=1</span>.
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <TabButton active={tab === "client"} onClick={() => setTab("client")}>
          Client jobs
        </TabButton>
        <TabButton active={tab === "mine"} onClick={() => setTab("mine")}>
          My properties
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "mine" ? (
          <>{props.emptyMyJobs}</>
        ) : items === null ? (
          <div className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-5 text-sm text-[var(--hw-muted)]">Loading jobs…</div>
        ) : (
          <div className="grid gap-3">
            {visibleItems.map((w) => (
              <Card key={w.id} className="p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[var(--hw-ink)]">{w.title || "Job"}</div>
                    {w.address ? <div className="mt-1 truncate text-sm text-[var(--hw-muted)]">{w.address}</div> : null}
                    {w.clientName ? <div className="mt-1 text-xs font-medium text-[var(--hw-muted)]">Client: {w.clientName}</div> : null}
                  </div>
                  <StatusBadge status={w.status} />
                </div>
                <Divider className="my-4" />
                <div className="flex flex-wrap gap-2">
                  <button className="rounded-full border border-[var(--hw-line)] bg-white px-4 py-2 text-xs font-semibold text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]">
                    Open
                  </button>
                  <button className="rounded-full border border-[var(--hw-line)] bg-white px-4 py-2 text-xs font-semibold text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]">
                    Share update
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
