"use client";

import * as React from "react";

import { ListRow } from "@/components/dashboard/ListRow";
import { Card, Chip } from "@/components/ui";
import { isDemoMode } from "@/lib/demo";
import { PRO_DEMO_WORK_ORDERS } from "@/lib/demo-data";

import { usePartnerContext } from "./usePartnerContext";

type ApiWorkOrder = {
  id: string;
  title?: string;
  address?: string;
  status: string;
  clientName?: string;
  createdAt?: string;
  updatedAt?: string;
};

const STATUS_GROUPS = ["Pending", "Scheduled", "In progress", "Completed"] as const;

type StatusGroup = (typeof STATUS_GROUPS)[number];

const STATUS_CLASS: Record<StatusGroup, string> = {
  Pending: "border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.05)] text-[var(--hw-ink)]",
  Scheduled: "border-[var(--hw-line)] bg-white text-[var(--hw-ink)]",
  "In progress": "border-[var(--hw-line)] bg-[var(--hw-soft)] text-[var(--hw-ink)]",
  Completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

function normalizeStatus(raw: string): StatusGroup {
  const lower = raw.toLowerCase().trim();
  if (lower === "pending") return "Pending";
  if (lower === "scheduled") return "Scheduled";
  if (lower === "in progress" || lower === "in_progress" || lower === "inprogress") return "In progress";
  if (lower === "completed" || lower === "complete" || lower === "done") return "Completed";
  return "Pending";
}

function statusIndex(status: StatusGroup) {
  return STATUS_GROUPS.indexOf(status);
}

function ProgressRail({ status }: { status: StatusGroup }) {
  const idx = statusIndex(status);
  return (
    <div className="flex items-center gap-2" aria-label={`Progress: ${status}`}>
      {STATUS_GROUPS.map((s, i) => {
        const done = i <= idx;
        return (
          <div key={s} className="flex items-center">
            <div
              className={`h-2.5 w-2.5 rounded-full border ${done ? "border-[var(--hw-ink)] bg-[var(--hw-ink)]" : "border-[var(--hw-line)] bg-white"}`}
            />
            {i < STATUS_GROUPS.length - 1 ? (
              <div className={`mx-1 h-[2px] w-6 ${i < idx ? "bg-[var(--hw-ink)]" : "bg-[var(--hw-line)]"}`} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

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

  const rows = React.useMemo(() => {
    const list = [...visibleItems];
    // Most recent first (best-effort)
    list.sort((a, b) => {
      const at = new Date((a as ApiWorkOrder).updatedAt || (a as ApiWorkOrder).createdAt || 0).getTime();
      const bt = new Date((b as ApiWorkOrder).updatedAt || (b as ApiWorkOrder).createdAt || 0).getTime();
      return bt - at;
    });
    return list;
  }, [visibleItems]);

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
          <div className="grid gap-2">
            {rows.map((w) => {
              const status = normalizeStatus(w.status);
              const ts = (w as ApiWorkOrder).updatedAt || (w as ApiWorkOrder).createdAt;
              return (
                <ListRow
                  key={w.id}
                  title={w.title || w.address || `Work Order #${w.id}`}
                  subtitle={w.address && w.title ? w.address : undefined}
                  footnote={w.clientName ? `Client: ${w.clientName}` : undefined}
                  badge={<Chip className={STATUS_CLASS[status]}>{status}</Chip>}
                  meta={
                    <div className="flex flex-col items-end gap-2">
                      <ProgressRail status={status} />
                      {ts ? (
                        <span className="text-xs text-[var(--hw-muted)]">
                          Updated {new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      ) : null}
                    </div>
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
