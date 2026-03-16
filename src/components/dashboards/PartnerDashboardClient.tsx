"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Share2, UserPlus, Zap } from "lucide-react";

import { Button, Card, Chip, EmptyState, Input, Label, StatTile } from "@/components/ui";
import { AIWorkOrderIntakeCard } from "@/components/ai/AIWorkOrderIntakeCard";
import { PortalShell } from "@/components/portal-shell";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { ListRow } from "@/components/dashboard/ListRow";
import { loadPartner, PARTNER_STORAGE_KEY, type PartnerContext } from "@/lib/partner-context";
import { ensureDemoPartnerContext, isDemoMode } from "@/lib/demo";
import { PRO_DEMO_WORK_ORDERS } from "@/lib/demo-data";
import { stageFile } from "@/lib/staged-files";

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
  const router = useRouter();
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
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

  const [inviteExpanded, setInviteExpanded] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFirst, setInviteFirst] = useState("");
  const [inviteLast, setInviteLast] = useState("");
  const [inviteAddress, setInviteAddress] = useState("");
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteResult, setInviteResult] = useState<null | { ok: boolean; message: string }>(null);

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

  const visibleWorkOrders = totalCount === 0 ? PRO_DEMO_WORK_ORDERS : recentWorkOrders;
  const visibleTotalCount = totalCount === 0 ? PRO_DEMO_WORK_ORDERS.length : totalCount;

  const demoPreviewMessages: Array<{ id: string; from: string; address: string; body: string; createdAt: string }> = [
    {
      id: "demo-1",
      from: "Homeowner",
      address: "123 Main St, Chicago, IL",
      body: "Can we get a quote for the repairs before Friday?",
      createdAt: new Date().toISOString(),
    },
    {
      id: "demo-2",
      from: "Homeworke Team",
      address: "98 W Hubbard St, Chicago, IL",
      body: "Inspection window set for tomorrow 10–12. Does that work?",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  const previewRows = messages.length
    ? messages.slice(0, 1).map((m) => ({
        id: m.id,
        from: m.fromRole,
        address: recentWorkOrders?.[0]?.address || "",
        body: m.body,
        createdAt: m.createdAt,
        unread: !m.readAt,
      }))
    : demoPreviewMessages.slice(0, 1).map((m) => ({ ...m, unread: true }));

  const MessagesCard = (
    <Card className="max-w-full overflow-hidden p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          {/* No external section title; keep it inside the card only */}
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Messages</div>
            {unreadCount > 0 ? (
              <span className="inline-flex items-center rounded-full bg-[rgba(229,57,53,.10)] px-2 py-0.5 text-[11px] font-semibold text-[rgb(229,57,53)]">
                {unreadCount} unread
              </span>
            ) : null}
          </div>
        </div>
        <Link href={`${basePath}/messages`} className="shrink-0">
          <Button size="sm" className="px-3">View</Button>
        </Link>
      </div>

      <div className="mt-2 grid gap-2">
        {previewRows.map((m) => (
          <div
            key={m.id}
            className="max-w-full overflow-hidden rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white px-3 py-2"
          >
            <div className="flex min-w-0 items-start gap-2">
              {m.unread ? <span className="mt-[3px] h-2 w-2 shrink-0 rounded-full bg-[rgb(229,57,53)]" /> : null}
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[var(--hw-ink)] truncate">{m.from}</div>
                {m.address ? <div className="mt-0.5 text-[11px] text-[var(--hw-muted)] truncate">{m.address}</div> : null}
                <div className="mt-1 text-xs text-[var(--hw-ink)] truncate">{m.body}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

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
      hideHeading
    >
      <div className="grid gap-6">
        {/* Top row: AI intake (left) + KPIs (right, 2x2) + Messages (under tiles) */}
        <div className="grid items-start gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <AIWorkOrderIntakeCard
              eyebrow="Job Work Order"
              title={partner?.partnerName ? `Hey ${partner.partnerName.split(" ")[0]}, what do you need help with?` : "What do you need help with?"}
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

            {/* Desktop: place Messages card in the right column under the KPI tiles (red square) */}
            <div className="mt-6 hidden lg:block">{MessagesCard}</div>
          </div>

          {/* Mobile: keep Messages card below the KPI tiles */}
          <div className="lg:hidden">{MessagesCard}</div>
        </div>

        {/* Invite (moved up under KPI tiles) */}
        <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[var(--hw-ink)]">Your Client Invite Link</div>
                <div className="mt-1 text-sm text-[var(--hw-muted)]">Share this with clients to connect clients and projects to your dashboard.</div>
              </div>
              <Link href={`${basePath}/clients`} className="shrink-0">
                <Button size="sm" variant="secondary">View clients</Button>
              </Link>
            </div>

            <div className="mt-4 grid gap-4">
              <div className="relative rounded-[var(--hw-radius-lg)] border-2 border-[var(--hw-line)] bg-white px-3 py-3 overflow-hidden">
                {/* Scrollable link text */}
                <div className="pr-[172px]">
                  <div className="text-xs font-semibold text-[var(--hw-ink)] whitespace-nowrap overflow-x-auto">
                    {partnerInviteLink}
                  </div>
                </div>

                {/* Overlay actions (same row) */}
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
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

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      try {
                        const text = `Here’s my Homeworke invite link: ${partnerInviteLink}`;
                        if (navigator.share) {
                          await navigator.share({ text, url: partnerInviteLink });
                        } else {
                          // Fallback: open SMS composer (best-effort) and also copy.
                          await navigator.clipboard.writeText(partnerInviteLink);
                          window.location.href = `sms:&body=${encodeURIComponent(text)}`;
                        }
                      } catch {
                        // ignore
                      }
                    }}
                    disabled={!partnerInviteLink}
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="text-xs font-medium text-[var(--hw-muted)]">Or invite via email here</div>
                <Button
                  size="sm"
                  className="w-auto px-6"
                  onClick={() => {
                    setInviteResult(null);
                    setInviteExpanded((v) => !v);
                  }}
                >
                  <UserPlus className="h-4 w-4" />
                  Invite via email
                  {inviteExpanded ? (
                    <ChevronUp className="h-4 w-4 opacity-70" />
                  ) : (
                    <ChevronDown className="h-4 w-4 opacity-70" />
                  )}
                </Button>
              </div>

              {inviteExpanded ? (
                <div className="grid gap-3 animate-[fadeScaleIn_150ms_ease-out]">
                  <div>
                    <Label htmlFor="invite-email">Client email</Label>
                    <Input
                      id="invite-email"
                      placeholder="email@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      inputMode="email"
                      autoComplete="email"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="invite-first">First name</Label>
                      <Input id="invite-first" placeholder="First name" value={inviteFirst} onChange={(e) => setInviteFirst(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="invite-last">Last name</Label>
                      <Input id="invite-last" placeholder="Last name" value={inviteLast} onChange={(e) => setInviteLast(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="invite-address">Property Address</Label>
                    <Input
                      id="invite-address"
                      placeholder="123 Main St, Chicago, IL"
                      value={inviteAddress}
                      onChange={(e) => setInviteAddress(e.target.value)}
                      autoComplete="street-address"
                    />
                  </div>

                  <div className="flex justify-center sm:justify-end">
                    <Button
                      size="sm"
                      className="w-auto px-8"
                      disabled={inviteSending || !inviteEmail.trim().includes("@") || !partner?.partnerId}
                      onClick={async () => {
                        setInviteResult(null);
                        setInviteSending(true);
                        try {
                          const res = await fetch("/api/partner/invites/request", {
                            method: "POST",
                            headers: { "content-type": "application/json" },
                            body: JSON.stringify({
                              partnerCode: partner?.partnerId,
                              email: inviteEmail,
                              firstName: inviteFirst,
                              lastName: inviteLast,
                              address: inviteAddress,
                            }),
                          });
                          const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
                          if (!res.ok || !data?.ok) {
                            setInviteResult({ ok: false, message: data?.error || `Invite failed (${res.status})` });
                            return;
                          }
                          setInviteResult({ ok: true, message: `Invite sent to ${inviteEmail.trim().toLowerCase()}` });
                          setInviteEmail("");
                          setInviteFirst("");
                          setInviteLast("");
                          setInviteAddress("");
                          // Auto-collapse after success.
                          window.setTimeout(() => setInviteExpanded(false), 600);
                        } catch {
                          setInviteResult({ ok: false, message: "Invite failed (network error)" });
                        } finally {
                          setInviteSending(false);
                        }
                      }}
                    >
                      {inviteSending ? "Sending…" : "Send invite"}
                    </Button>
                  </div>

                  {inviteResult ? (
                    <div
                      className={`rounded-[var(--hw-radius-lg)] border px-4 py-3 text-sm ${
                        inviteResult.ok
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-red-200 bg-red-50 text-red-700"
                      }`}
                    >
                      {inviteResult.message}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {!inviteExpanded && inviteResult ? (
                <div
                  className={`rounded-[var(--hw-radius-lg)] border px-4 py-3 text-sm ${
                    inviteResult.ok
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {inviteResult.message}
                </div>
              ) : null}

              {inviteResult ? (
                <div
                  className={`rounded-[var(--hw-radius-lg)] border px-4 py-3 text-sm ${
                    inviteResult.ok
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {inviteResult.message}
                </div>
              ) : null}
            </div>
        </Card>

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
          {/* Main column */}
          <div className="grid gap-6 lg:col-span-12">
            <DashboardSection
              title="Active projects shared with you"
              count={visibleTotalCount}
              action={
                <Link href={`${basePath}/jobs`}>
                  <Button variant="secondary">View jobs</Button>
                </Link>
              }
            >
              <div className="grid gap-2">
                {visibleWorkOrders.map((wo) => {
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
            </DashboardSection>
            <DashboardSection
              title="Instant Estimate"
              description="Help clients currently buying or selling a Home. Submit a Home Inspection or Appraisal report to get a Free Instant Express Estimate of repair costs."
            >
              <Card
                className="relative overflow-hidden border-[rgba(229,57,53,.35)]"
                style={{ boxShadow: "0 10px 30px rgba(229,57,53,.06)" }}
              >
                <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[var(--hw-red)]/20 blur-[60px]" />
                <div aria-hidden className="pointer-events-none absolute -left-24 bottom-0 h-48 w-48 rounded-full bg-[var(--hw-red)]/10 blur-[70px]" />

                <div className="relative p-6">
                  <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
                    <Zap className="h-3.5 w-3.5 text-[var(--hw-red)]" />
                    Instant estimate
                  </div>
                  <div className="mt-2 text-base font-extrabold tracking-tight text-[var(--hw-ink)]">
                    Express Estimate
                  </div>
                  <div className="mt-1 text-sm leading-relaxed text-[var(--hw-muted)]">
                    Help clients currently buying or selling a Home. Submit a Home Inspection or Appraisal report to get a Free Instant Express Estimate of repair costs.
                  </div>

                  <div className="mt-5">
                    <label className="block cursor-pointer rounded-[var(--hw-radius-lg)] border border-dashed border-[var(--hw-line)] bg-[var(--hw-soft)] p-4 hover:bg-white">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[var(--hw-ink)]">Choose a PDF to upload</div>
                          <div className="mt-1 text-sm text-[var(--hw-muted)]">Drag & drop or click to browse.</div>
                        </div>
                        <div className="shrink-0">
                          <Button
                            size="md"
                            variant="primary"
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              pdfInputRef.current?.click();
                            }}
                          >
                            Upload report
                          </Button>
                        </div>
                      </div>
                      <input
                        ref={pdfInputRef}
                        className="hidden"
                        type="file"
                        accept="application/pdf"
                        onChange={async (e) => {
                          const f = e.target.files?.[0] ?? null;
                          if (!f) return;
                          try {
                            const id = await stageFile(f);
                            router.push(`${basePath}/express-estimate?staged=${encodeURIComponent(id)}`);
                          } catch {
                            router.push(`${basePath}/express-estimate`);
                          }
                        }}
                      />
                    </label>
                  </div>

                  <div className="mt-4">
                    <Link href={`${basePath}/express-estimate`}>
                      <Button variant="secondary" size="sm">Open Express Estimate</Button>
                    </Link>
                  </div>
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
        </div>
      </div>
    </PortalShell>
  );
}
