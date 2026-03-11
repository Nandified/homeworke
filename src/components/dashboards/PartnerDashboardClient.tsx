"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { Button, Card, Chip, EmptyState, StatTile } from "@/components/ui";
import { AIWorkOrderIntakeCard } from "@/components/ai/AIWorkOrderIntakeCard";
import { PortalShell } from "@/components/portal-shell";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { ListRow } from "@/components/dashboard/ListRow";
import { loadPartner, PARTNER_STORAGE_KEY, type PartnerContext } from "@/lib/partner-context";
import { ensureDemoPartnerContext, isDemoMode } from "@/lib/demo";

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
      { href: `${basePath}/jobs`, label: "Jobs" },
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
    ensureDemoPartnerContext();

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
        const demoQ = isDemoMode() ? "&demo=1" : "";
        const [woRes, msgRes] = await Promise.all([
          fetch(`/api/pro/work-orders?partnerId=${encodeURIComponent(partner.partnerId)}${demoQ}`),
          fetch(`/api/messages?partnerId=${encodeURIComponent(partner.partnerId)}&limit=20${demoQ}`),
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
      role="PRO"
      title={props.title || "Real Estate Pro"}
      nav={nav}
      description="Shared projects, quick invites, and the next touchpoint—without hunting through threads."
      primaryAction={
        <Link href={`${basePath}/express-estimate`}>
          <Button>Start Express Estimate</Button>
        </Link>
      }
    >
      <div className="grid gap-6">
        {/* Top row: AI intake (left) + KPIs (right, 2x2) */}
        <div className="grid items-start gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <AIWorkOrderIntakeCard
              eyebrow="AI work order"
              title="What’s going on with your client’s property?"
              primaryCta="Start a job request"
              secondaryCta="Browse marketplace"
              showServicingPill={false}
            />
          </div>
          <div className="lg:col-span-5">
            <div className="grid grid-cols-2 gap-4 auto-rows-fr">
              <StatTile label="Active" value={String(activeCount)} note="In progress" className="h-full" />
              <StatTile label="Pending" value={String(pendingCount)} note="Not started" className="h-full" />
              <StatTile label="Completed" value={String(completedCount)} note="Closed" className="h-full" />
              <StatTile label="Unread" value={String(unreadCount)} note="New messages" className="h-full" />
            </div>
          </div>
        </div>

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

        <div className="grid items-start gap-6 lg:grid-cols-12">
          {/* Left column */}
          <div className="grid gap-6 lg:col-span-8">
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
              description="AI-generated quick estimate for inspection items, seller credits, and repair requests."
              action={
                <Link href={`${basePath}/express-estimate`}>
                  <Button size="sm">Open</Button>
                </Link>
              }
            >
              <Card className="border-[var(--hw-line)] bg-[var(--hw-soft)] p-5">
                <div className="grid gap-1">
                  <div className="text-sm font-semibold text-[var(--hw-ink)]">New: PDF-to-estimate (MVP)</div>
                  <div className="text-sm text-[var(--hw-muted)]">Drop an inspection PDF → pick line-items → export a clean estimate.</div>
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Link href={`${basePath}/express-estimate`} className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto">Start Express Estimate</Button>
                  </Link>
                  <Link href={`${basePath}/messages`} className="w-full sm:w-auto">
                    <Button size="sm" variant="secondary" className="w-full sm:w-auto">
                      Pull from messages
                    </Button>
                  </Link>
                </div>
              </Card>
            </DashboardSection>

            <DashboardSection
              title="Elevated Client Care"
              description="White-glove follow-ups that make your clients feel looked after — and keep you top of mind."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Card className="p-4">
                  <div className="text-sm font-semibold text-[var(--hw-ink)]">Anticipate before they ask</div>
                  <div className="mt-1 text-sm text-[var(--hw-muted)]">Set timely, personal outreach that keeps you one step ahead of your client’s needs.</div>
                  <div className="mt-3">
                    <Link href={`${basePath}/messages`}>
                      <Button size="sm" variant="secondary">Schedule outreach</Button>
                    </Link>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm font-semibold text-[var(--hw-ink)]">Manage repairs with ease</div>
                  <div className="mt-1 text-sm text-[var(--hw-muted)]">Coordinate inspections, bids, and scheduling so your client gets a hands‑free repair experience.</div>
                  <div className="mt-3">
                    <Link href={`${basePath}/jobs`}>
                      <Button size="sm" variant="secondary">Coordinate now</Button>
                    </Link>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm font-semibold text-[var(--hw-ink)]">Ensure a flawless closing</div>
                  <div className="mt-1 text-sm text-[var(--hw-muted)]">Surface and resolve open items early so nothing stands between your client and the keys.</div>
                  <div className="mt-3">
                    <Link href={`${basePath}/jobs`}>
                      <Button size="sm" variant="secondary">Resolve items</Button>
                    </Link>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm font-semibold text-[var(--hw-ink)]">Nurture beyond the transaction</div>
                  <div className="mt-1 text-sm text-[var(--hw-muted)]">Send seasonal home‑care reminders that keep your name at the top of every referral list.</div>
                  <div className="mt-3">
                    <Link href={`${basePath}/messages`}>
                      <Button size="sm" variant="secondary">Send reminder</Button>
                    </Link>
                  </div>
                </Card>
              </div>
            </DashboardSection>
          </div>

          {/* Right column */}
          <div className="grid gap-6 lg:col-span-4">
            <DashboardSection title="Invite" card={false}>
              <Card className="p-5">
                <div className="text-sm font-semibold text-[var(--hw-ink)]">Your Client Invite Link</div>
                <div className="mt-1 text-sm text-[var(--hw-muted)]">Share this with clients to connect projects to your dashboard.</div>

                <div className="mt-3 grid gap-2">
                  <div className="flex items-center gap-2 rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white px-3 py-2">
                    <div className="min-w-0 flex-1 truncate text-xs font-semibold text-[var(--hw-ink)]">{partnerInviteLink}</div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(partnerInviteLink);
                          setCopied(true);
                          window.setTimeout(() => setCopied(false), 1300);
                        } catch {}
                      }}
                      disabled={!partnerInviteLink}
                    >
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Link href={`${basePath}/clients`} className="w-full sm:w-auto">
                      <Button size="sm" className="w-full sm:w-auto">Invite client</Button>
                    </Link>
                    <Link href={`${basePath}/messages`} className="w-full sm:w-auto">
                      <Button size="sm" variant="secondary" className="w-full sm:w-auto">
                        Send intro
                      </Button>
                    </Link>
                  </div>

                </div>
              </Card>
            </DashboardSection>

            <DashboardSection title="Messages" card={false}>
              <Card className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[var(--hw-ink)]">Messages</div>
                    <div className="mt-1 text-sm text-[var(--hw-muted)]">Quick preview of the latest threads.</div>
                  </div>
                  <Link href={`${basePath}/messages`}>
                    <Button size="sm" variant="secondary">View all</Button>
                  </Link>
                </div>

                <div className="mt-4">
                  {messages.length === 0 ? (
                    <div className="rounded-[var(--hw-radius-lg)] border border-dashed border-[var(--hw-line)] bg-[var(--hw-soft)] p-4 text-center">
                      <div className="text-sm font-semibold text-[var(--hw-ink)]">No messages</div>
                      <div className="mx-auto mt-2 max-w-md text-sm leading-7 text-[var(--hw-muted)]">
                        Messages will appear once a homeowner starts a thread.
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {messages.slice(0, 3).map((m) => (
                        <ListRow
                          key={m.id}
                          title={m.fromRole}
                          subtitle={m.body}
                          meta={new Date(m.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </DashboardSection>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
