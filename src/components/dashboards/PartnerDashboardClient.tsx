"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { Button, Card, Chip, EmptyState, StatTile } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { ListRow } from "@/components/dashboard/ListRow";
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

export function PartnerDashboardClient(props: PartnerDashboardProps) {
  const basePath = props.basePath;

  const nav = useMemo(
    () => [
      { href: `${basePath}/dashboard`, label: "Dashboard" },
      { href: `${basePath}/express-estimate`, label: "Express Estimate" },
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

  const [copied, setCopied] = useState(false);

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
    for (const wo of workOrders) map[normalizeStatus(wo.status)].push(wo);
    return map;
  }, [workOrders]);

  const unreadCount = useMemo(() => messages.filter((m) => !m.readAt).length, [messages]);
  const activeCount = useMemo(() => grouped["In progress"].length + grouped["Scheduled"].length, [grouped]);
  const pendingCount = useMemo(() => grouped.Pending.length, [grouped]);
  const completedCount = useMemo(() => grouped.Completed.length, [grouped]);

  const partnerInviteLink = useMemo(() => {
    if (!partner?.partnerId) return "";
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/p/${partner.partnerId}`;
  }, [partner?.partnerId]);

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

  const recentWorkOrders = [...workOrders]
    .sort((a, b) => {
      const at = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bt = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bt - at;
    })
    .slice(0, 8);

  return (
    <PortalShell
      role="PARTNER"
      title={props.title || "Partner"}
      nav={nav}
      description="Shared projects, quick invites, and the next touchpoint—without hunting through threads."
      primaryAction={
        <Link href={`${basePath}/express-estimate`}>
          <Button>Start Express Estimate</Button>
        </Link>
      }
    >
      <div className="grid gap-6">
        <KpiGrid>
          <StatTile label="Active projects" value={String(activeCount)} note="Scheduled + in progress" />
          <StatTile label="Pending" value={String(pendingCount)} note="Awaiting scheduling / kickoff" />
          <StatTile label="Completed" value={String(completedCount)} note="Closed work orders" />
          <StatTile label="Unread messages" value={String(unreadCount)} note="From homeowner + ops" />
        </KpiGrid>

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

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left column */}
          <div className="grid gap-6">
            <DashboardSection
              title="Active projects shared with you"
              count={totalCount}
              description="Lightweight status rail + last updated to scan fast."
              action={
                <Link href={`${basePath}/clients`}>
                  <Button variant="secondary">View clients</Button>
                </Link>
              }
            >
              {(!loading && !error && totalCount === 0) ? (
                <EmptyState
                  title="No shared projects yet"
                  text="When clients share work orders with you, they’ll appear here."
                />
              ) : (
                <div className="grid gap-2">
                  {recentWorkOrders.map((wo) => {
                    const status = normalizeStatus(wo.status);
                    return (
                      <ListRow
                        key={wo.id}
                        title={wo.title || wo.address || `Work Order #${wo.id}`}
                        subtitle={wo.address && wo.title ? wo.address : undefined}
                        footnote={wo.clientName ? `Client: ${wo.clientName}` : undefined}
                        badge={<Chip className={STATUS_CLASS[status]}>{status}</Chip>}
                        meta={
                          <div className="flex flex-col items-end gap-2">
                            <ProgressRail status={status} />
                            {wo.updatedAt ? (
                              <span className="text-xs text-[var(--hw-muted)]">
                                Updated {new Date(wo.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                              </span>
                            ) : wo.createdAt ? (
                              <span className="text-xs text-[var(--hw-muted)]">
                                Created {new Date(wo.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                              </span>
                            ) : null}
                          </div>
                        }
                      />
                    );
                  })}
                </div>
              )}
            </DashboardSection>

            <DashboardSection
              title="Express Estimate"
              description="Drop an inspection PDF → pick line-items → export a fast estimate."
              action={
                <Link href={`${basePath}/express-estimate`}>
                  <Button>Open</Button>
                </Link>
              }
            >
              <Card className="border-[var(--hw-line)] bg-[var(--hw-soft)] p-5">
                <div className="grid gap-1">
                  <div className="text-sm font-semibold text-[var(--hw-ink)]">New: PDF-to-estimate flow (stub)</div>
                  <div className="text-sm text-[var(--hw-muted)]">
                    Best for pre-list inspections, appraisal repair requests, and quick negotiation packets.
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Link href={`${basePath}/express-estimate`} className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto">Start an Express Estimate</Button>
                  </Link>
                  <Link href={`${basePath}/messages`} className="w-full sm:w-auto">
                    <Button variant="secondary" className="w-full sm:w-auto">
                      Pull PDF from a thread
                    </Button>
                  </Link>
                </div>
              </Card>
            </DashboardSection>

            <DashboardSection
              title="Touchpoints"
              description="Suggested next actions to keep deals moving."
            >
              <div className="grid gap-2 sm:grid-cols-2">
                <Card className="p-4">
                  <div className="text-sm font-semibold">Send a 48-hour check‑in</div>
                  <div className="mt-1 text-sm text-[var(--hw-muted)]">Nudge homeowners with active scopes to confirm schedule + access.</div>
                  <div className="mt-3">
                    <Link href={`${basePath}/messages`}>
                      <Button variant="secondary">Draft message</Button>
                    </Link>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm font-semibold">Request missing photos</div>
                  <div className="mt-1 text-sm text-[var(--hw-muted)]">Fastest way to price “Need more info” items accurately.</div>
                  <div className="mt-3">
                    <Link href={`${basePath}/messages`}>
                      <Button variant="secondary">Request info</Button>
                    </Link>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm font-semibold">Create a scope summary</div>
                  <div className="mt-1 text-sm text-[var(--hw-muted)]">Turn line-items into a clean, shareable PDF for negotiations.</div>
                  <div className="mt-3">
                    <Link href={`${basePath}/express-estimate`}>
                      <Button variant="secondary">Start summary</Button>
                    </Link>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm font-semibold">Introduce BOSSCAT concierge</div>
                  <div className="mt-1 text-sm text-[var(--hw-muted)]">Set expectations + explain how we coordinate vendors and scheduling.</div>
                  <div className="mt-3">
                    <Link href={`${basePath}/support`}>
                      <Button variant="secondary">View script</Button>
                    </Link>
                  </div>
                </Card>
              </div>
            </DashboardSection>
          </div>

          {/* Right column */}
          <div className="grid gap-6">
            <DashboardSection title="Invite clients" description="Share your invite link to attribute referrals and unlock shared projects.">
              <Card className="p-5">
                <div className="text-sm font-semibold">Your partner link</div>
                <div className="mt-1 text-sm text-[var(--hw-muted)]">Send this to homeowners to attach your office.</div>
                <div className="mt-3 grid gap-2">
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                    <input
                      className="w-full rounded-[var(--radius)] border border-[var(--hw-line)] bg-white px-3 py-2 text-sm text-[var(--hw-ink)] shadow-sm outline-none"
                      value={partnerInviteLink}
                      readOnly
                    />
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(partnerInviteLink);
                          setCopied(true);
                          window.setTimeout(() => setCopied(false), 1300);
                        } catch {
                          // ignore
                        }
                      }}
                      disabled={!partnerInviteLink}
                    >
                      {copied ? "Copied" : "Copy link"}
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Link href={`${basePath}/clients`} className="w-full sm:w-auto">
                      <Button className="w-full sm:w-auto">Invite a client</Button>
                    </Link>
                    <Link href={`${basePath}/messages`} className="w-full sm:w-auto">
                      <Button variant="secondary" className="w-full sm:w-auto">
                        Send intro message
                      </Button>
                    </Link>
                  </div>
                  <div className="text-xs text-[var(--hw-muted)]">Partner: {partner.partnerName} • {partner.partnerType}</div>
                </div>
              </Card>
            </DashboardSection>

            <DashboardSection
              title="Messages"
              description="Quick preview of the latest threads."
              count={messages.length}
              action={
                <Link href={`${basePath}/messages`}>
                  <Button variant="secondary">View all</Button>
                </Link>
              }
            >
              <div className="grid gap-2">
                {messages.length === 0 ? (
                  <EmptyState title="No messages" text="Messages will appear once a homeowner starts a thread." />
                ) : (
                  messages.slice(0, 6).map((m) => (
                    <ListRow
                      key={m.id}
                      title={m.fromRole}
                      subtitle={m.body}
                      meta={new Date(m.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    />
                  ))
                )}
              </div>
            </DashboardSection>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
