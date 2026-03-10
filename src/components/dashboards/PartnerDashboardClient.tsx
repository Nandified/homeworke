"use client";

import { useEffect, useMemo, useState } from "react";

import { Button, Card, Chip, EmptyState, Pill, StatTile } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";
import { loadPartner, PARTNER_STORAGE_KEY, type PartnerContext } from "@/lib/partner-context";

export type PartnerDashboardProps = {
  basePath: "/partner" | "/pro";
  title?: string;
};

type WorkOrder = {
  id: string;
  title?: string;
  address?: string;
  status: string;
  clientName?: string;
  createdAt?: string;
  updatedAt?: string;
};

type Message = {
  id: string;
  createdAt: string;
  body: string;
  fromRole: string;
  readAt?: string | null;
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

export function PartnerDashboardClient(props: PartnerDashboardProps) {
  const basePath = props.basePath;

  const nav = useMemo(
    () => [
      { href: `${basePath}/dashboard`, label: "Dashboard" },
      { href: `${basePath}/estimates`, label: "Estimates" },
      { href: `${basePath}/clients`, label: "My Clients" },
      { href: `${basePath}/properties`, label: "Properties" },
      { href: `${basePath}/messages`, label: "Messages" },
      { href: `${basePath}/support`, label: "Support" },
      { href: `${basePath}/account`, label: "My Account" },
    ],
    [basePath]
  );

  const [partner, setPartner] = useState<PartnerContext | null | undefined>(undefined);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read partner context from localStorage (robust for older key formats)
  useEffect(() => {
    const fromHelper = loadPartner();
    if (fromHelper?.partnerId) {
      setPartner(fromHelper);
      return;
    }

    try {
      const raw = localStorage.getItem(PARTNER_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PartnerContext;
        if (parsed?.partnerId) {
          setPartner(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }

    setPartner(null);
  }, []);

  // Fetch work orders + messages
  useEffect(() => {
    if (!partner?.partnerId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [woRes, msgRes] = await Promise.all([
          fetch(`/api/pro/work-orders?partnerId=${encodeURIComponent(partner.partnerId)}`),
          fetch(`/api/messages?partnerId=${encodeURIComponent(partner.partnerId)}&limit=20`),
        ]);

        if (!woRes.ok) throw new Error(`Failed to load work orders (${woRes.status})`);
        if (!msgRes.ok) throw new Error(`Failed to load messages (${msgRes.status})`);

        const woJson = (await woRes.json()) as { ok?: boolean; workOrders?: WorkOrder[] };
        const msgJson = (await msgRes.json()) as { ok?: boolean; messages?: Message[] };

        if (!cancelled) {
          setWorkOrders(woJson.workOrders || []);
          setMessages(msgJson.messages || []);
        }
      } catch (err) {
        if (!cancelled) setError((err as Error)?.message ?? "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [partner]);

  const grouped = useMemo(() => {
    const map: Record<StatusGroup, WorkOrder[]> = {
      Pending: [],
      Scheduled: [],
      "In progress": [],
      Completed: [],
    };
    for (const wo of workOrders) {
      map[normalizeStatus(wo.status)].push(wo);
    }
    return map;
  }, [workOrders]);

  const unreadCount = useMemo(() => messages.filter((m) => !m.readAt).length, [messages]);

  // Still reading localStorage
  if (partner === undefined) {
    return (
      <PortalShell role="PARTNER" title={props.title || "Partner"} nav={nav}>
        <div className="flex items-center justify-center py-20">
          <div className="text-sm text-[var(--hw-muted)]">Loading…</div>
        </div>
      </PortalShell>
    );
  }

  if (!partner) {
    return (
      <PortalShell role="PARTNER" title={props.title || "Partner"} nav={nav}>
        <EmptyState
          title="No partner link detected"
          text="Open the app using your unique partner link to attach attribution and see shared client projects."
          action={
            <div className="flex flex-col items-center gap-2">
              <Button onClick={() => (window.location.href = "/p/frj")}>Open example partner link →</Button>
              <span className="text-xs text-[var(--hw-muted)]">e.g. yoursite.com/p/frj</span>
            </div>
          }
        />
      </PortalShell>
    );
  }

  const totalCount = workOrders.length;

  return (
    <PortalShell role="PARTNER" title={props.title || "Partner"} nav={nav}>
      <div className="grid gap-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <StatTile label="Shared projects" value={String(totalCount)} note="Work orders shared with you." />
          <StatTile label="Unread messages" value={String(unreadCount)} note="From homeowner + ops." />
          <StatTile label="Partner type" value={String(partner.partnerType || "REAL_ESTATE")} note={partner.officeName ? `Office: ${partner.officeName}` : ""} />
        </div>

        {/* Loading / error */}
        {loading && (
          <Card className="p-6">
            <div className="text-sm text-[var(--hw-muted)]">Loading dashboard…</div>
          </Card>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
            <div className="text-sm font-medium text-red-700 dark:text-red-300">{error}</div>
          </Card>
        )}

        {!loading && !error && totalCount === 0 && (
          <EmptyState
            title="No shared projects yet"
            text="When clients share work orders with you, they'll appear here grouped by status."
          />
        )}

        {!loading && !error && totalCount > 0 && (
          <div className="grid gap-5">
            {STATUS_GROUPS.map((status) => {
              const items = grouped[status];
              if (items.length === 0) return null;

              return (
                <section key={status}>
                  <div className="mb-3 flex items-center gap-2">
                    <h2 className="text-sm font-semibold">{status}</h2>
                    <Pill>{items.length}</Pill>
                  </div>
                  <div className="grid gap-3">
                    {items.slice(0, 6).map((wo) => (
                      <Card
                        key={wo.id}
                        className="flex flex-col gap-2 p-4 transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{wo.title || wo.address || `Work Order #${wo.id}`}</span>
                            <Chip className={STATUS_CLASS[status]}>{status}</Chip>
                          </div>
                          {wo.clientName && <span className="text-xs text-[var(--hw-muted)]">Client: {wo.clientName}</span>}
                          {wo.address && wo.title && <span className="text-xs text-[var(--hw-muted)]">{wo.address}</span>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[var(--hw-muted)]">
                          {wo.updatedAt ? (
                            <span>
                              Updated{" "}
                              {new Date(wo.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                          ) : wo.createdAt ? (
                            <span>
                              Created{" "}
                              {new Date(wo.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                          ) : null}
                        </div>
                      </Card>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* Messages preview */}
        {!loading && !error && (
          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Recent messages</div>
                <div className="mt-1 text-xs text-[var(--hw-muted)]">Phase 2: minimal thread preview</div>
              </div>
              <Pill>{messages.length}</Pill>
            </div>
            <div className="mt-4 grid gap-2">
              {messages.length === 0 ? (
                <EmptyState title="No messages" text="Messages will appear here once a homeowner starts a thread." />
              ) : (
                messages.slice(0, 5).map((m) => (
                  <div key={m.id} className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs font-semibold text-[var(--hw-ink)]">{m.fromRole}</div>
                      <div className="text-[11px] text-[var(--hw-muted)]">
                        {new Date(m.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </div>
                    </div>
                    <div className="mt-1 text-sm text-[var(--hw-ink)] line-clamp-2">{m.body}</div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}
      </div>
    </PortalShell>
  );
}
