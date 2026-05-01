"use client";

import * as React from "react";

import { Calendar, CheckCircle2, Clock3, Wrench } from "lucide-react";

import { ListRow } from "@/components/dashboard/ListRow";
import { Chip } from "@/components/ui";

type ApiWorkOrder = {
  id: string;
  title?: string;
  address?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

type Session = { token: string };

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem("hw_session_v1");
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

const STATUS_GROUPS = ["Pending", "Scheduled", "In progress", "Completed"] as const;

type StatusGroup = (typeof STATUS_GROUPS)[number];

const STATUS_CLASS: Record<StatusGroup, string> = {
  Pending: "border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.05)] text-[var(--hw-ink)]",
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

            {i < STATUS_GROUPS.length - 1 ? <div className={"mx-2 h-[2px] w-6 rounded-full " + lineClass} /> : null}
          </div>
        );
      })}
    </div>
  );
}

const STAGE_FILTERS = ["All", ...STATUS_GROUPS] as const;

type StageFilter = (typeof STAGE_FILTERS)[number];

const STAGE_ACTIVE_CLASS: Record<StageFilter, string> = {
  All: "border-[rgba(17,24,39,.22)] bg-[var(--hw-soft)] text-[var(--hw-ink)]",
  Pending: "border-[rgba(229,57,53,.22)] bg-[rgba(229,57,53,.07)] text-[rgb(229,57,53)]",
  Scheduled: "border-[rgba(37,99,235,.22)] bg-[rgba(37,99,235,.07)] text-[rgb(30,64,175)]",
  "In progress": "border-[rgba(147,51,234,.22)] bg-[rgba(147,51,234,.07)] text-[rgb(107,33,168)]",
  Completed: "border-[rgba(16,185,129,.22)] bg-[rgba(16,185,129,.08)] text-[rgb(5,150,105)]",
};

function StageButton(props: { active: boolean; tone: StageFilter; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={
        "rounded-full border px-3 py-1.5 text-[11px] font-semibold transition " +
        (props.active
          ? STAGE_ACTIVE_CLASS[props.tone]
          : "border-[var(--hw-line)] bg-white text-[var(--hw-muted)] hover:bg-[var(--hw-soft)] hover:text-[var(--hw-ink)]")
      }
      aria-pressed={props.active}
    >
      {props.children}
    </button>
  );
}

export function HOJobsClient(props: { emptyJobs: React.ReactNode }) {
  const [stage, setStage] = React.useState<StageFilter>("All");
  const [query, setQuery] = React.useState("");
  const [items, setItems] = React.useState<ApiWorkOrder[] | null>(null);

  React.useEffect(() => {
    const s = loadSession();
    if (!s?.token) {
      setItems([]);
      return;
    }

    const url = `/api/work-orders?token=${encodeURIComponent(s.token)}`;

    fetch(url)
      .then((r) => r.json())
      .then((j) => {
        const list = Array.isArray(j?.workOrders) ? j.workOrders : [];
        const mapped: ApiWorkOrder[] = list
          .map((w: any) => ({
            id: String(w?.id || ""),
            title: (w?.serviceSubcategory ? `${w.serviceCategory} / ${w.serviceSubcategory}` : w?.serviceCategory || w?.title || "Job").toString(),
            address: (w?.propertyAddress || w?.address || "").toString(),
            status: (w?.status || "pending").toString(),
            createdAt: w?.createdAt ? String(w.createdAt) : undefined,
            updatedAt: w?.updatedAt ? String(w.updatedAt) : w?.createdAt ? String(w.createdAt) : undefined,
          }))
          .filter((w: ApiWorkOrder) => !!w.id);
        setItems(mapped);
      })
      .catch(() => setItems([]));
  }, []);

  const rows = React.useMemo(() => {
    const list = [...(items || [])];

    // Most recent first (best-effort)
    list.sort((a, b) => {
      const at = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bt = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bt - at;
    });

    const byStage = stage === "All" ? list : list.filter((w) => normalizeStatus(w.status) === stage);

    const q = query.trim().toLowerCase();
    const byQuery =
      !q
        ? byStage
        : byStage.filter((w) => {
            const hay = [w.title, w.address, w.status]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();
            return hay.includes(q);
          });

    return byQuery;
  }, [items, stage, query]);

  return (
    <div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <input
          className="h-10 w-full rounded-[999px] border border-[var(--hw-line)] bg-[var(--hw-soft)] px-4 text-sm outline-none transition focus:border-[rgba(229,57,53,.35)] focus:ring-4 focus:ring-[rgba(229,57,53,.10)]"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search jobs…"
        />
        <div className="shrink-0 text-xs text-[var(--hw-muted)]">
          {rows.length} result{rows.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {STAGE_FILTERS.map((s) => (
          <StageButton key={s} tone={s} active={stage === s} onClick={() => setStage(s)}>
            {s}
          </StageButton>
        ))}
      </div>

      <div className="mt-4">
        <div className="grid gap-2">
          {items === null ? (
            <div className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-5 text-sm text-[var(--hw-muted)]">Loading jobs…</div>
          ) : null}

          {items !== null && rows.length === 0 ? (
            <>{props.emptyJobs}</>
          ) : (
            rows.map((w) => {
              const status = normalizeStatus(w.status);
              const ts = w.updatedAt || w.createdAt;
              return (
                <ListRow
                  key={w.id}
                  href={`/ho/work-orders/${w.id}`}
                  title={w.title || w.address || `Work Order #${w.id}`}
                  subtitle={w.address && w.title ? w.address : undefined}
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
      </div>
    </div>
  );
}
