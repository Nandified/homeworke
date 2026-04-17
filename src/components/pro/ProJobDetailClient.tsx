"use client";

import * as React from "react";

import Link from "next/link";

import { Calendar, CheckCircle2, Clock3, Wrench } from "lucide-react";

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

  const accentFor: Record<StatusGroup, string> = {
    Pending: "text-[rgb(229,57,53)]",
    Scheduled: "text-[rgb(37,99,235)]",
    "In progress": "text-[rgb(147,51,234)]",
    Completed: "text-emerald-500",
  };

  return (
    <div className="flex items-center gap-1.5" aria-label={`Progress: ${status}`} role="group">
      {STATUS_GROUPS.map((s, i) => {
        const done = i < idx;
        const current = i === idx;

        const Icon = iconFor(s);

        const nodeClass = current
          ? "border-[var(--hw-ink)] bg-[var(--hw-ink)] text-white ring-4 ring-[rgba(17,24,39,.10)]"
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
              <Icon
                className={
                  "h-3.5 w-3.5 " +
                  (current ? accentFor[s] : done ? "text-white" : "text-[var(--hw-muted)]")
                }
              />
              <div className="pointer-events-none absolute -mt-14 hidden whitespace-nowrap rounded-full border border-[var(--hw-line)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--hw-ink)] shadow-sm group-hover:block">
                {s}
              </div>
            </div>

            {i < STATUS_GROUPS.length - 1 ? (
              <div className={"mx-1 h-[2px] w-7 rounded-full " + lineClass} />
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
        const json = (await res.json().catch(() => null)) as any;
        const props = Array.isArray(json?.properties) ? json.properties : [];

        const match = props.find((p: any) => normalizeAddress(String(p?.address || "")) === target) || null;
        const owner = match?.ownerName ? String(match.ownerName) : null;
        return owner && owner.trim() ? owner.trim() : null;
      } catch {
        return null;
      }
    };

    const mapWorkOrderToApi = (wo: any, ownerName?: string | null): ApiWorkOrder => {
      const title = (wo?.serviceSubcategory || wo?.serviceCategory || wo?.title || "Job").toString();
      const address = (wo?.propertyAddress || wo?.address || "").toString();
      const status = (wo?.status || "pending").toString();
      const clientName = ownerName || (wo?.clientName ? String(wo.clientName) : "");

      return {
        id: String(wo?.id || props.id),
        title,
        address,
        status,
        clientName: clientName || undefined,
        createdAt: wo?.createdAt ? String(wo.createdAt) : undefined,
        updatedAt: wo?.updatedAt ? String(wo.updatedAt) : undefined,
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
          const json = (await res.json().catch(() => null)) as any;
          if (res.ok && json?.ok && json?.workOrder) {
            const wo = json.workOrder;
            const addr = String(wo?.propertyAddress || wo?.address || "");
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
        const foundLocal = list.find((w: any) => String(w?.id || "") === String(props.id));
        if (foundLocal) {
          const addr = String(foundLocal?.propertyAddress || foundLocal?.address || "");
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
                <div className="text-sm font-semibold text-[var(--hw-ink)]">Service details</div>
                <div className="mt-1 text-sm text-[var(--hw-muted)]">High-level overview of what’s being requested.</div>
                <Divider className="my-4" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Work order</div>
                    <div className="mt-1 text-sm font-semibold text-[var(--hw-ink)]">#{item.id}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Status</div>
                    <div className="mt-1 text-sm font-semibold text-[var(--hw-ink)]">{status}</div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="text-sm font-semibold text-[var(--hw-ink)]">Estimates</div>
                <div className="mt-1 text-sm text-[var(--hw-muted)]">Compare bids and pick the best option.</div>
                <Divider className="my-4" />
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
