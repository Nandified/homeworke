"use client";

import * as React from "react";

import { Calendar, CheckCircle2, Clock3, Wrench } from "lucide-react";

import { ListRow } from "@/components/dashboard/ListRow";
import { Card, Chip } from "@/components/ui";
import { isDemoMode, withDemo } from "@/lib/demo";
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
  // Make Scheduled vs In progress unmistakable.
  Scheduled: "border-[rgba(37,99,235,.22)] bg-[rgba(37,99,235,.07)] text-[rgb(30,64,175)]",
  "In progress": "border-[rgba(147,51,234,.22)] bg-[rgba(147,51,234,.07)] text-[rgb(107,33,168)]",
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

  const iconFor = (s: StatusGroup) => {
    if (s === "Pending") return Clock3;
    if (s === "Scheduled") return Calendar;
    if (s === "In progress") return Wrench;
    return CheckCircle2;
  };

  const ringFor: Record<StatusGroup, string> = {
    Pending: "ring-[rgba(229,57,53,.22)]",
    Scheduled: "ring-[rgba(37,99,235,.22)]",
    "In progress": "ring-[rgba(147,51,234,.22)]",
    Completed: "ring-[rgba(16,185,129,.22)]",
  };

  return (
    <div className="flex items-center gap-1.5" aria-label={`Progress: ${status}`} role="group">
      {STATUS_GROUPS.map((s, i) => {
        const done = i < idx;
        const current = i === idx;

        const Icon = iconFor(s);

        const nodeClass = current
          ? "border-[var(--hw-ink)] bg-[var(--hw-ink)] text-white ring-4 " + ringFor[status]
          : done
            ? "border-[var(--hw-ink)] bg-[var(--hw-ink)] text-white"
            : "border-[var(--hw-line)] bg-white text-[var(--hw-muted)]";

        const lineClass = done
          ? "bg-[linear-gradient(90deg,rgba(17,24,39,.95),rgba(17,24,39,.55))]"
          : "bg-[var(--hw-line)]";

        return (
          <div key={s} className="flex items-center">
            <div
              className={
                "group relative grid h-7 w-7 place-items-center rounded-full border shadow-[0_1px_0_rgba(17,24,39,.08)] transition " +
                nodeClass
              }
              aria-label={s}
            >
              <Icon className={"h-3.5 w-3.5 " + (current || done ? "text-white" : "text-[var(--hw-muted)]")} />
              <div className="pointer-events-none absolute -mt-14 hidden whitespace-nowrap rounded-full border border-[var(--hw-line)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--hw-ink)] shadow-sm group-hover:block">
                {s}
              </div>
            </div>

            {i < STATUS_GROUPS.length - 1 ? (
              <div className={"mx-2 h-[2px] w-6 rounded-full " + lineClass} />
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
  const [localItems, setLocalItems] = React.useState<ApiWorkOrder[]>([]);

  const loadLocalItems = React.useCallback(() => {
    try {
      const raw = window.localStorage.getItem("hw_local_work_orders_v1") || "[]";
      const arr = JSON.parse(raw);
      const list = Array.isArray(arr) ? arr : [];
      const mapped = list
        .map((w: any) => ({
          id: String(w?.id || ""),
          title: (w?.serviceSubcategory || w?.serviceCategory || w?.title || "Job").toString(),
          address: (w?.propertyAddress || w?.address || "").toString(),
          status: (w?.status || "pending").toString(),
          clientName: w?.clientName ? String(w.clientName) : undefined,
          createdAt: w?.createdAt ? String(w.createdAt) : undefined,
          updatedAt: w?.updatedAt ? String(w.updatedAt) : w?.createdAt ? String(w.createdAt) : undefined,
        }))
        .filter((w: ApiWorkOrder) => !!w.id);

      setLocalItems(mapped);
    } catch {
      setLocalItems([]);
    }
  }, []);

  // Keep localStorage-backed work orders fresh across navigation/back/refresh.
  React.useEffect(() => {
    loadLocalItems();

    const onStorage = (e: StorageEvent) => {
      if (e.key === "hw_local_work_orders_v1") loadLocalItems();
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") loadLocalItems();
    };

    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", loadLocalItems);

    return () => {
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", loadLocalItems);
    };
  }, [loadLocalItems]);

  const visibleItems = items && items.length > 0 ? [...localItems, ...items] : [...localItems, ...PRO_DEMO_WORK_ORDERS];

  const rows = React.useMemo(() => {
    const list = [...visibleItems];
    // De-dupe by id
    const seen = new Set<string>();
    const deduped: ApiWorkOrder[] = [];
    for (const w of list) {
      const id = String((w as ApiWorkOrder).id || "");
      if (!id || seen.has(id)) continue;
      seen.add(id);
      deduped.push(w as ApiWorkOrder);
    }

    // Most recent first (best-effort)
    deduped.sort((a, b) => {
      const at = new Date((a as ApiWorkOrder).updatedAt || (a as ApiWorkOrder).createdAt || 0).getTime();
      const bt = new Date((b as ApiWorkOrder).updatedAt || (b as ApiWorkOrder).createdAt || 0).getTime();
      return bt - at;
    });
    return deduped;
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
        ) : (
          <div className="grid gap-2">
            {items === null ? (
              <div className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-5 text-sm text-[var(--hw-muted)]">Loading jobs…</div>
            ) : null}
            {items !== null && rows.length === 0 ? (
              <>{props.emptyClientJobs}</>
            ) : (
              rows.map((w) => {
                const status = normalizeStatus(w.status);
                const ts = (w as ApiWorkOrder).updatedAt || (w as ApiWorkOrder).createdAt;
                return (
                  <ListRow
                    key={w.id}
                    href={withDemo(`/pro/jobs/${w.id}`)}
                    title={w.title || w.address || `Work Order #${w.id}`}
                    subtitle={w.address && w.title ? w.address : undefined}
                    footnote={w.clientName ? `Client: ${w.clientName}` : undefined}
                    badge={<Chip className={STATUS_CLASS[status]}>{status}</Chip>}
                    meta={
                      <div className="flex flex-col items-center gap-2 sm:items-end">
                        <ProgressRail status={status} />
                        {ts ? (
                          <span className="text-xs text-[var(--hw-muted)]">
                            Updated {new Date(ts).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                          </span>
                        ) : null}
                      </div>
                    }
                  />
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
