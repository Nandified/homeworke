"use client";

import * as React from "react";

import Link from "next/link";

import { Calendar, CalendarClock, CheckCircle2, ClipboardCheck, Clock3, Wrench } from "lucide-react";

import { Card, Chip, EmptyState, Button, Divider } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";
import { PRO_NAV } from "@/components/pro/nav";
import { isDemoMode, withDemo } from "@/lib/demo";
import { PRO_DEMO_WORK_ORDERS } from "@/lib/demo-data";

import { usePartnerContext } from "./usePartnerContext";

type ApiWorkOrder = {
  id: string;
  title?: string;
  address?: string;
  serviceCategory?: string;
  serviceSubcategory?: string;
  issueDescription?: string;
  urgencyLevel?: string;
  status: string;
  clientName?: string;
  createdAt?: string;
  updatedAt?: string;
  preferredDate?: string;
  preferredWindow?: string;
  appointments?: Array<{ id: string; trade: string; preferredDate?: string; preferredWindow?: string; status: string }>;
};

type RawRecord = Record<string, unknown>;
type ApiAppointment = NonNullable<ApiWorkOrder["appointments"]>[number];
type VisitWindow = "" | "Morning" | "Midday" | "Afternoon" | "Evening";

declare global {
  interface Window {
    __hwSessionToken?: () => string | null;
  }
}

const STATUS_GROUPS = ["Pending", "Confirming", "Scheduled", "In progress", "Completed"] as const;
const VISIT_WINDOWS = ["Morning", "Midday", "Afternoon", "Evening"] as const;

type StatusGroup = (typeof STATUS_GROUPS)[number];

const STATUS_CLASS: Record<StatusGroup, string> = {
  Pending: "border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.05)] text-[var(--hw-ink)]",
  Confirming: "border-[rgba(245,158,11,.22)] bg-[rgba(245,158,11,.10)] text-[rgb(146,64,14)]",
  // Make Scheduled vs In progress unmistakable.
  Scheduled: "border-[rgba(37,99,235,.22)] bg-[rgba(37,99,235,.07)] text-[rgb(30,64,175)]",
  "In progress": "border-[rgba(147,51,234,.22)] bg-[rgba(147,51,234,.07)] text-[rgb(107,33,168)]",
  Completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

function normalizeStatus(raw: string): StatusGroup {
  const lower = raw.toLowerCase().trim();
  if (lower === "pending") return "Pending";
  if (lower === "confirming" || lower === "hg_confirm" || lower === "pending_hg_confirm") return "Confirming";
  if (lower === "scheduled") return "Scheduled";
  if (lower === "in progress" || lower === "in_progress" || lower === "inprogress") return "In progress";
  if (lower === "completed" || lower === "complete" || lower === "done") return "Completed";
  return "Pending";
}

function statusIndex(status: StatusGroup) {
  return STATUS_GROUPS.indexOf(status);
}

function asRecord(value: unknown): RawRecord | null {
  return value && typeof value === "object" ? (value as RawRecord) : null;
}

function toOptionalString(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function asVisitWindow(value: unknown): VisitWindow {
  return VISIT_WINDOWS.includes(value as (typeof VISIT_WINDOWS)[number]) ? (value as VisitWindow) : "";
}

function normalizeAppointments(value: unknown): ApiWorkOrder["appointments"] {
  if (!Array.isArray(value)) return undefined;

  const appointments: ApiAppointment[] = [];

  value.forEach((raw, idx) => {
    const rec = asRecord(raw);
    if (!rec) return;

    const preferredDate = toOptionalString(rec.preferredDate);
    const preferredWindow = toOptionalString(rec.preferredWindow);
    const appointment: ApiAppointment = {
      id: toOptionalString(rec.id) || `apt_${idx}`,
      trade: toOptionalString(rec.trade) || "Home repairs",
      status: toOptionalString(rec.status) || "PROPOSED",
    };

    if (preferredDate) appointment.preferredDate = preferredDate;
    if (preferredWindow) appointment.preferredWindow = preferredWindow;
    appointments.push(appointment);
  });

  return appointments.length ? appointments : undefined;
}

function isInstantEstimateWorkOrder(item: ApiWorkOrder | null) {
  if (!item) return false;
  const haystack = [
    item.title,
    item.serviceCategory,
    item.serviceSubcategory,
    item.issueDescription,
    item.urgencyLevel,
  ]
    .filter(Boolean)
    .join(" ");
  return /instant estimate/i.test(haystack);
}

function formatAppointmentDate(date?: string) {
  if (!date) return "";
  return new Date(date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function appointmentStatusLabel(status: string, instantEstimateJob: boolean) {
  if (instantEstimateJob) {
    if (status === "PROPOSED" || status === "PENDING_HG_CONFIRM") return "Home Guide review";
  }
  if (status === "PENDING_HG_CONFIRM") return "Awaiting HG confirm";
  return status;
}

function appointmentStatusClass(status: string, instantEstimateJob: boolean) {
  if (instantEstimateJob || status === "PENDING_HG_CONFIRM") {
    return "border-[rgba(245,158,11,.22)] bg-[rgba(245,158,11,.10)] text-[rgb(146,64,14)]";
  }
  return "border-[var(--hw-line)] bg-[var(--hw-soft)] text-[var(--hw-ink)]";
}

function updateLocalWorkOrder(id: string, patch: Record<string, unknown>) {
  try {
    const key = "hw_local_work_orders_v1";
    const raw = window.localStorage.getItem(key) || "[]";
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return;

    const next = arr.map((w) => {
      if (!w || typeof w !== "object" || String((w as Record<string, unknown>).id || "") !== id) return w;
      return { ...(w as Record<string, unknown>), ...patch };
    });

    window.localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // Local-only convenience. If it fails, the visible state still updates.
  }
}

function ProgressRail({ status }: { status: StatusGroup }) {
  const idx = statusIndex(status);

  const iconFor = (s: StatusGroup) => {
    if (s === "Pending") return Clock3;
    if (s === "Confirming") return Clock3;
    if (s === "Scheduled") return Calendar;
    if (s === "In progress") return Wrench;
    return CheckCircle2;
  };

  const ringFor: Record<StatusGroup, string> = {
    Pending: "ring-[rgba(229,57,53,.22)]",
    Confirming: "ring-[rgba(245,158,11,.22)]",
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

export function ProJobDetailClient(props: { id: string }) {
  const { partnerId } = usePartnerContext();

  const [item, setItem] = React.useState<ApiWorkOrder | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [rescheduleOpen, setRescheduleOpen] = React.useState(false);
  const [visitDate, setVisitDate] = React.useState<string>("");
  const [visitWindow, setVisitWindow] = React.useState<VisitWindow>("");
  const [timingPreference, setTimingPreference] = React.useState<string>("Flexible");
  const [savingSchedule, setSavingSchedule] = React.useState(false);
  const [scheduleError, setScheduleError] = React.useState<string>("");

  React.useEffect(() => {
    let cancelled = false;

    const loadSessionToken = () => {
      // Prefer localStorage session token.
      try {
        const raw = window.localStorage.getItem("hw_session_v1");
        const j = raw ? JSON.parse(raw) : null;
        if (j?.token) return String(j.token);
      } catch {}

      // Fallback: allow token to be passed via query string (useful in embedded/webview contexts).
      try {
        const params = new URLSearchParams(window.location.search);
        const t = params.get("token");
        return t ? String(t) : null;
      } catch {
        return null;
      }
    };

    // Export for schedule updates.
    window.__hwSessionToken = loadSessionToken;

    const normalizeAddress = (s: string) =>
      (s || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/\s*,\s*/g, ", ")
        .trim();

    const resolveOwnerName = async (token: string, addr: string): Promise<string | null> => {
      const target = normalizeAddress(addr);
      if (!target) return null;
      try {
        const url = new URL("/api/properties", window.location.origin);
        url.searchParams.set("token", token);
        if (isDemoMode()) url.searchParams.set("demo", "1");

        const res = await fetch(url);
        const json = (await res.json().catch(() => null)) as { properties?: unknown[] } | null;
        const properties = Array.isArray(json?.properties) ? json.properties : [];

        const match = properties
          .map(asRecord)
          .find((p) => p && normalizeAddress(toOptionalString(p.address)) === target) || null;
        const owner = match?.ownerName ? String(match.ownerName) : null;
        return owner && owner.trim() ? owner.trim() : null;
      } catch {
        return null;
      }
    };

    const mapWorkOrderToApi = (wo: RawRecord, ownerName?: string | null): ApiWorkOrder => {
      const title = toOptionalString(wo.serviceSubcategory) || toOptionalString(wo.serviceCategory) || toOptionalString(wo.title) || "Job";
      const address = toOptionalString(wo.propertyAddress) || toOptionalString(wo.address);
      const status = toOptionalString(wo.status) || "pending";
      const clientName = ownerName || toOptionalString(wo.clientName);

      return {
        id: toOptionalString(wo.id) || props.id,
        title,
        address,
        serviceCategory: toOptionalString(wo.serviceCategory) || undefined,
        serviceSubcategory: toOptionalString(wo.serviceSubcategory) || undefined,
        issueDescription: toOptionalString(wo.issueDescription) || undefined,
        urgencyLevel: toOptionalString(wo.urgencyLevel) || undefined,
        status,
        clientName: clientName || undefined,
        createdAt: toOptionalString(wo.createdAt) || undefined,
        updatedAt: toOptionalString(wo.updatedAt) || undefined,
        preferredDate: toOptionalString(wo.preferredDate) || undefined,
        preferredWindow: toOptionalString(wo.preferredWindow) || undefined,
        appointments: normalizeAppointments(wo.appointments),
      };
    };

    (async () => {
      setLoading(true);

      // First: if we have a session token, try to load the exact work order by id.
      // This prevents the detail page from showing an unrelated demo row.
      const token = loadSessionToken();
      if (token) {
        try {
          const url = new URL(`/api/work-orders/${encodeURIComponent(props.id)}`, window.location.origin);
          url.searchParams.set("token", token);
          const res = await fetch(url);
          const json = (await res.json().catch(() => null)) as { ok?: boolean; workOrder?: unknown } | null;
          const wo = asRecord(json?.workOrder);
          if (res.ok && json?.ok && wo) {
            const addr = toOptionalString(wo.propertyAddress) || toOptionalString(wo.address);
            const owner = addr ? await resolveOwnerName(token, addr) : null;
            if (!cancelled) {
              setItem(mapWorkOrderToApi(wo, owner));
              setLoading(false);
            }
            return;
          }
        } catch {
          // ignore and continue to local/partner/demo fallbacks
        }
      }

      // Next: check client-side persisted work orders (for demo/non-DB serverless deployments).
      try {
        const raw = window.localStorage.getItem("hw_local_work_orders_v1") || "[]";
        const arr = JSON.parse(raw);
        const list = Array.isArray(arr) ? arr : [];
        const foundLocal = list.map(asRecord).find((w) => w && toOptionalString(w.id) === String(props.id)) || null;
        if (foundLocal) {
          const addr = toOptionalString(foundLocal.propertyAddress) || toOptionalString(foundLocal.address);
          const owner = token && addr ? await resolveOwnerName(token, addr) : null;
          if (!cancelled) {
            setItem(mapWorkOrderToApi(foundLocal, owner));
            setLoading(false);
          }
          return;
        }
      } catch {}

      // In demo mode (or without partner context), still show a detail page.
      if (!partnerId || isDemoMode()) {
        const demo = PRO_DEMO_WORK_ORDERS.find((w) => w.id === props.id) || PRO_DEMO_WORK_ORDERS[0];
        if (!cancelled) {
          setItem(demo as unknown as ApiWorkOrder);
          setLoading(false);
        }
        return;
      }

      try {
        const url = new URL("/api/pro/work-orders", window.location.origin);
        url.searchParams.set("partnerId", partnerId);
        // If the user entered demo flows elsewhere, keep it consistent here too.
        if (isDemoMode()) url.searchParams.set("demo", "1");

        const res = await fetch(url);
        const json = (await res.json().catch(() => null)) as { workOrders?: ApiWorkOrder[] } | null;
        const found = json?.workOrders?.find((w) => w.id === props.id) || null;

        // If API doesn't have it (common for our shared demo rows), fall back to demo set.
        const fallback = PRO_DEMO_WORK_ORDERS.find((w) => w.id === props.id) || null;

        if (!cancelled) setItem(found || (fallback as unknown as ApiWorkOrder) || null);
      } catch {
        if (!cancelled) {
          const fallback = PRO_DEMO_WORK_ORDERS.find((w) => w.id === props.id) || null;
          setItem((fallback as unknown as ApiWorkOrder) || null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [partnerId, props.id]);

  const status = item ? normalizeStatus(item.status) : "Pending";
  const ts = item?.updatedAt || item?.createdAt;
  const instantEstimateJob = isInstantEstimateWorkOrder(item);
  const itemId = item?.id;
  const itemPreferredWindow = item?.preferredWindow;
  const appointments = Array.isArray(item?.appointments) ? item.appointments : [];
  const timingOptions = ["ASAP", "This week", "Next week", "Flexible"] as const;

  React.useEffect(() => {
    if (!itemId || !instantEstimateJob) return;
    const stored = typeof itemPreferredWindow === "string" && itemPreferredWindow.trim() ? itemPreferredWindow.trim() : "Flexible";
    setTimingPreference(stored);
  }, [instantEstimateJob, itemId, itemPreferredWindow]);

  return (
    <PortalShell
      role="PRO"
      title="Job"
      portalTitle="Real Estate Pro"
      nav={PRO_NAV as unknown as { href: string; label: string }[]}
      description="Job details, status, and next steps — all in one place."
      primaryAction={
        <Link href={withDemo("/pro/jobs")}>
          <Button variant="secondary">Back to jobs</Button>
        </Link>
      }
    >
      {loading ? (
        <Card className="p-6">
          <div className="text-sm text-[var(--hw-muted)]">Loading job…</div>
        </Card>
      ) : !item ? (
        <EmptyState
          title="Job not found"
          text="This job may have been removed, or your portal doesn’t have access."
          action={
            <Link href={withDemo("/pro/jobs")}>
              <Button variant="secondary">Back to jobs</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6">
          {/* Header */}
          <Card className="p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-xl font-extrabold tracking-tight text-[var(--hw-ink)]">
                    {item.title || "Job"}
                  </h1>
                  <Chip className={STATUS_CLASS[status]}>{status}</Chip>
                </div>
                {item.address ? <div className="mt-2 text-sm text-[var(--hw-muted)]">{item.address}</div> : null}
                {item.clientName ? <div className="mt-1 text-xs font-medium text-[var(--hw-muted)]">Client: {item.clientName}</div> : null}
              </div>
              <div className="shrink-0">
                <ProgressRail status={status} />
                {ts ? (
                  <div className="mt-2 text-right text-xs text-[var(--hw-muted)]">
                    Updated {new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                ) : null}
              </div>
            </div>
          </Card>

          {/* Team + Customer + Estimates (stubbed, but styled like live) */}
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="grid gap-6 lg:col-span-8">
              <Card className="p-6">
                <div className="text-sm font-semibold text-[var(--hw-ink)]">{instantEstimateJob ? "Repair request" : "Service details"}</div>
                <div className="mt-1 text-sm text-[var(--hw-muted)]">
                  {instantEstimateJob ? "Selected Instant Estimate items are grouped for Home Guide review." : "High-level overview of what's being requested."}
                </div>
                <Divider className="my-4" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Work Order</div>
                    <div className="mt-1 text-sm font-semibold text-[var(--hw-ink)]">#{item.id}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Status</div>
                    <div className="mt-1 text-sm font-semibold text-[var(--hw-ink)]">{status}</div>
                  </div>
                  {instantEstimateJob ? (
                    <>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Request type</div>
                        <div className="mt-1 text-sm font-semibold text-[var(--hw-ink)]">Preliminary booking</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Pricing</div>
                        <div className="mt-1 text-sm font-semibold text-[var(--hw-ink)]">Estimate only until verified</div>
                      </div>
                    </>
                  ) : null}
                </div>
                {instantEstimateJob ? (
                  <div className="mt-4 rounded-[var(--hw-radius-lg)] border border-[rgba(229,57,53,.14)] bg-[rgba(229,57,53,.04)] p-4">
                    <div className="flex gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[var(--hw-red)] shadow-sm">
                        <ClipboardCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[var(--hw-ink)]">Home Guide confirmation comes next</div>
                        <div className="mt-1 text-sm text-[var(--hw-muted)]">
                          The Instant Estimate is a planning number. A Home Guide will confirm scope, access, materials, and final pricing before any appointment is locked in.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </Card>

              <Card className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[var(--hw-ink)]">
                      {instantEstimateJob ? "Home Guide scheduling" : "Appointments"}
                    </div>
                    <div className="mt-1 text-sm text-[var(--hw-muted)]">
                      {instantEstimateJob
                        ? "Preliminary request received. Home Guide will propose the simplest visit plan."
                        : "Scheduling requests and Home Guide confirmation."}
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => {
                    setScheduleError("");
                    setRescheduleOpen((v) => !v);
                    if (instantEstimateJob) {
                      setTimingPreference(item.preferredWindow || "Flexible");
                    } else {
                      setVisitDate(item.preferredDate || "");
                      setVisitWindow(asVisitWindow(item.preferredWindow));
                    }
                  }}>
                    {rescheduleOpen ? "Close" : instantEstimateJob ? "Timing preference" : "Request reschedule"}
                  </Button>
                </div>
                <Divider className="my-4" />

                {instantEstimateJob ? (
                  <div className="grid gap-3">
                    <div className="rounded-[var(--hw-radius-lg)] border border-[rgba(17,24,39,.08)] bg-[var(--hw-soft)] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 gap-3">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[var(--hw-red)] shadow-sm">
                            <CalendarClock className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-[var(--hw-ink)]">No appointment is confirmed yet</div>
                            <div className="mt-1 text-sm text-[var(--hw-muted)]">
                              Home Guide reviews the selected scopes first, bundles related work where possible, then confirms the actual date and time.
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Chip className="border-[var(--hw-line)] bg-white text-[var(--hw-ink)]">Preference: {item.preferredWindow || timingPreference}</Chip>
                              <Chip className="border-[rgba(245,158,11,.22)] bg-[rgba(245,158,11,.10)] text-[rgb(146,64,14)]">Preliminary</Chip>
                            </div>
                          </div>
                        </div>
                        <Chip className="border-[rgba(245,158,11,.22)] bg-[rgba(245,158,11,.10)] text-[rgb(146,64,14)]">Home Guide review</Chip>
                      </div>
                    </div>

                    {appointments.length ? (
                      appointments.map((a, idx) => (
                        <div key={a.id || `${a.trade}_${idx}`} className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Scope group</div>
                              <div className="mt-1 text-sm font-semibold text-[var(--hw-ink)]">{a.trade || "Home repairs"}</div>
                              <div className="mt-1 text-sm text-[var(--hw-muted)]">
                                Selected from the Instant Estimate. Home Guide will confirm who should handle it and whether it should be bundled with another visit.
                              </div>
                            </div>
                            <Chip className={appointmentStatusClass(a.status, true)}>{appointmentStatusLabel(a.status, true)}</Chip>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-4 text-sm text-[var(--hw-muted)]">
                        Home Guide will create the service groups from the selected Instant Estimate repairs.
                      </div>
                    )}
                  </div>
                ) : Array.isArray(item.appointments) && item.appointments.length ? (
                  <div className="grid gap-3">
                    {item.appointments.map((a) => {
                      const appointmentTime = [formatAppointmentDate(a.preferredDate), a.preferredWindow].filter(Boolean).join(" • ");
                      return (
                        <div key={a.id} className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">{a.trade}</div>
                              <div className="mt-1 text-sm font-semibold text-[var(--hw-ink)]">{appointmentTime || "Scheduling in progress"}</div>
                            </div>
                            <Chip className={appointmentStatusClass(a.status, false)}>{appointmentStatusLabel(a.status, false)}</Chip>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-[var(--hw-muted)]">No appointments yet.</div>
                )}

                {rescheduleOpen ? (
                  <div className="mt-4 rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-4">
                    {instantEstimateJob ? (
                      <>
                        <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Timing preference</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {timingOptions.map((w) => (
                            <button
                              key={w}
                              type="button"
                              onClick={() => setTimingPreference(w)}
                              className={
                                "h-10 rounded-full border px-4 text-sm font-semibold transition " +
                                (timingPreference === w
                                  ? "border-[rgba(229,57,53,.35)] bg-white text-[var(--hw-ink)] ring-4 ring-[rgba(229,57,53,.10)]"
                                  : "border-[var(--hw-line)] bg-white text-[var(--hw-muted)] hover:bg-[rgba(17,24,39,.03)]")
                              }
                            >
                              {w}
                            </button>
                          ))}
                        </div>
                        <div className="mt-2 text-xs text-[var(--hw-muted)]">
                          This does not confirm an appointment. It gives Home Guide a starting point for coordination.
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Preferred time</div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <label className="grid gap-1">
                            <span className="text-xs font-semibold text-[var(--hw-ink)]">Date</span>
                            <input
                              type="date"
                              className="h-10 rounded-[999px] border border-[var(--hw-line)] bg-white px-4 text-sm outline-none focus:border-[rgba(229,57,53,.35)] focus:ring-4 focus:ring-[rgba(229,57,53,.10)]"
                              value={visitDate}
                              onChange={(e) => setVisitDate(e.target.value)}
                            />
                          </label>
                          <div className="grid gap-1">
                            <div className="text-xs font-semibold text-[var(--hw-ink)]">Time window</div>
                            <div className="flex flex-wrap gap-2">
                              {VISIT_WINDOWS.map((w) => (
                                <button
                                  key={w}
                                  type="button"
                                  onClick={() => setVisitWindow(w)}
                                  className={
                                    "h-10 rounded-full border px-4 text-sm font-semibold transition " +
                                    (visitWindow === w
                                      ? "border-[rgba(229,57,53,.35)] bg-white text-[var(--hw-ink)] ring-4 ring-[rgba(229,57,53,.10)]"
                                      : "border-[var(--hw-line)] bg-white text-[var(--hw-muted)] hover:bg-[rgba(17,24,39,.03)]")
                                  }
                                >
                                  {w}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    {scheduleError ? <div className="mt-3 text-xs font-semibold text-[var(--hw-red)]">{scheduleError}</div> : null}
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        disabled={instantEstimateJob ? !timingPreference || savingSchedule : !visitDate || !visitWindow || savingSchedule}
                        onClick={async () => {
                          setScheduleError("");
                          setSavingSchedule(true);
                          try {
                            if (instantEstimateJob) {
                              const now = new Date().toISOString();
                              const patch = { preferredDate: "", preferredWindow: timingPreference, updatedAt: now };
                              updateLocalWorkOrder(item.id, patch);
                              setItem((prev) => (prev ? { ...prev, ...patch } : prev));
                              setRescheduleOpen(false);
                              return;
                            }

                            const token = window.__hwSessionToken ? window.__hwSessionToken() : null;
                            if (!token) throw new Error("Missing session");

                            const url = new URL(`/api/work-orders/${encodeURIComponent(item.id)}`, window.location.origin);
                            url.searchParams.set("token", token);
                            const res = await fetch(url, {
                              method: "POST",
                              headers: { "content-type": "application/json" },
                              body: JSON.stringify({ action: "update_schedule", preferredDate: visitDate, preferredWindow: visitWindow }),
                            });
                            const j = await res.json().catch(() => null);
                            if (!res.ok || !j?.ok || !j?.workOrder) throw new Error("Update failed");
                            setItem((prev) => (prev ? { ...prev, ...j.workOrder } : prev));
                            setRescheduleOpen(false);
                          } catch {
                            setScheduleError("Couldn’t save. Please try again.");
                          } finally {
                            setSavingSchedule(false);
                          }
                        }}
                      >
                        {savingSchedule ? "Saving…" : instantEstimateJob ? "Save preference" : "Submit request"}
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setRescheduleOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                    <div className="mt-2 text-[11px] text-[var(--hw-muted)]">
                      {instantEstimateJob
                        ? "Home Guide will use this as a preference, not a confirmed appointment."
                        : "A Home Guide will confirm and coordinate with the Project Manager schedule."}
                    </div>
                  </div>
                ) : null}
              </Card>

              <Card className="p-6">
                <div className="text-sm font-semibold text-[var(--hw-ink)]">{instantEstimateJob ? "Actual pricing" : "Estimates"}</div>
                <div className="mt-1 text-sm text-[var(--hw-muted)]">
                  {instantEstimateJob ? "Final pricing appears after scope is verified." : "Compare bids and pick the best option."}
                </div>
                <Divider className="my-4" />
                {instantEstimateJob ? (
                  <div className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-4">
                    <div className="flex gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--hw-soft)] text-[var(--hw-ink)]">
                        <Wrench className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[var(--hw-ink)]">Waiting on scope confirmation</div>
                        <div className="mt-1 text-sm text-[var(--hw-muted)]">
                          The Instant Estimate is still useful for planning. The actual repair price will be attached here after Home Guide reviews the grouped scopes.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { vendor: "Javier Rojas", company: "WEL Construction INC", total: "$30,000", updated: "Aug 5, 2025" },
                      { vendor: "Christian Krol", company: "Krozak Development Corp", total: "$82,000", updated: "Aug 5, 2025" },
                    ].map((e) => (
                      <div key={e.vendor} className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-4">
                        <div className="text-sm font-semibold text-[var(--hw-ink)]">{e.vendor}</div>
                        <div className="mt-0.5 text-xs text-[var(--hw-muted)]">{e.company}</div>
                        <div className="mt-3 grid gap-1 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--hw-muted)]">Total</span>
                            <span className="font-semibold text-[var(--hw-ink)]">{e.total}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[var(--hw-muted)]">Updated</span>
                            <span className="text-[var(--hw-ink)]">{e.updated}</span>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button size="sm">Select</Button>
                          <Button size="sm" variant="secondary">Download</Button>
                          <Button size="sm" variant="secondary">View profile</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <div className="grid gap-6 lg:col-span-4">
              <Card className="p-6">
                <div className="text-sm font-semibold text-[var(--hw-ink)]">Customer details</div>
                <div className="mt-1 text-sm text-[var(--hw-muted)]">Key contact info for this job.</div>
                <Divider className="my-4" />
                <div className="grid gap-3 text-sm">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Customer</div>
                    <div className="mt-1 font-semibold text-[var(--hw-ink)]">{item.clientName || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Address</div>
                    <div className="mt-1 text-[var(--hw-ink)]">{item.address || "—"}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <Button size="sm" variant="secondary">Contact</Button>
                </div>
              </Card>

              <Card className="p-6">
                <div className="text-sm font-semibold text-[var(--hw-ink)]">Team assigned</div>
                <div className="mt-1 text-sm text-[var(--hw-muted)]">People helping move this to close.</div>
                <Divider className="my-4" />
                <div className="grid gap-3">
                  {[
                    { name: "Home Guide", person: "Sarahi Banuelos" },
                    { name: "Project Manager", person: "Alberto Anaya" },
                  ].map((t) => (
                    <div key={t.name} className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-4">
                      <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">{t.name}</div>
                      <div className="mt-1 text-sm font-semibold text-[var(--hw-ink)]">{t.person}</div>
                      <div className="mt-3">
                        <Button size="sm" variant="secondary">Contact</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </PortalShell>
  );
}
