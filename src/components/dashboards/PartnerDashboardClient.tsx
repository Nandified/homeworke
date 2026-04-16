"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, CheckCircle2, ChevronDown, ChevronUp, Clock3, Image as ImageIcon, Share2, UserPlus, Wrench, Zap } from "lucide-react";

import QRCode from "qrcode";


import { Button, Card, Chip, EmptyState, Input, Label, StatTile } from "@/components/ui";
import { AIWorkOrderIntakeCard } from "@/components/ai/AIWorkOrderIntakeCard";
import { PortalShell } from "@/components/portal-shell";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { ListRow } from "@/components/dashboard/ListRow";
import { loadPartner, PARTNER_STORAGE_KEY, type PartnerContext } from "@/lib/partner-context";
import { ensureDemoPartnerContext, isDemoMode, withDemo } from "@/lib/demo";
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

  // Thread metadata (demo + Phase 2)
  threadId?: string;
  threadTitle?: string | null;
  ownerName?: string | null;
  propertyAddress?: string | null;
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

  const iconFor = (s: StatusGroup) => {
    if (s === "Pending") return Clock3;
    if (s === "Scheduled") return Calendar;
    if (s === "In progress") return Wrench;
    return CheckCircle2;
  };

  return (
    <div className="flex items-center gap-1.5" aria-label={`Progress: ${status}`}
      role="group"
    >
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
              <Icon className={"h-3.5 w-3.5 " + (current || done ? "text-white" : "text-[var(--hw-muted)]")} />
              {/* Lightweight tooltip */}
              <div className="pointer-events-none absolute -mt-14 hidden whitespace-nowrap rounded-full border border-[var(--hw-line)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--hw-ink)] shadow-sm group-hover:block">
                {s}
              </div>
            </div>

            {i < STATUS_GROUPS.length - 1 ? <div className={`mx-1 h-[3px] w-7 rounded-full ${lineClass}`} /> : null}
          </div>
        );
      })}
    </div>
  );
}

// (no forced height matching)

function InstantEstimateCard({ basePath }: { basePath: string }) {
  const router = useRouter();
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFile(f: File) {
    try {
      const id = await stageFile(f);
      router.push(`${basePath}/express-estimate?staged=${encodeURIComponent(id)}`);
    } catch {
      router.push(`${basePath}/express-estimate`);
    }
  }

  return (
    <Card
      className="relative overflow-hidden border-[rgba(229,57,53,.35)] p-6 md:p-7"
      style={{ boxShadow: "0 10px 30px rgba(229,57,53,.06)" }}
    >
      {/* Glow accents (kept on mobile but contained so they don't bleed past corners) */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-40 w-40 -translate-y-1/3 translate-x-1/3 rounded-full bg-[var(--hw-red)]/18 blur-[50px] sm:-right-24 sm:-top-24 sm:h-64 sm:w-64 sm:translate-x-0 sm:translate-y-0 sm:bg-[var(--hw-red)]/20 sm:blur-[60px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 bottom-0 h-32 w-32 -translate-x-1/3 translate-y-1/3 rounded-full bg-[var(--hw-red)]/10 blur-[55px] sm:-left-24 sm:h-48 sm:w-48 sm:translate-x-0 sm:translate-y-0 sm:blur-[70px]"
      />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
              <Zap className="h-3.5 w-3.5 text-[var(--hw-red)]" />
              Instant estimate
            </div>
            <div className="mt-2 text-lg font-extrabold tracking-tight text-[var(--hw-ink)]">Instant Estimate</div>
          </div>
          <div className="shrink-0">
            <Link href={`${basePath}/express-estimate`}>
              <Button variant="secondary" size="sm">Open Estimates</Button>
            </Link>
          </div>
        </div>

        <div className="mt-2 text-sm leading-relaxed text-[var(--hw-muted)]">
          Help clients currently buying or selling a Home. Submit a <span className="font-semibold text-[var(--hw-ink)]">Home Inspection</span>, <span className="font-semibold text-[var(--hw-ink)]">Village Inspection</span>, or <span className="font-semibold text-[var(--hw-ink)]">Appraisal</span> report to get a <span className="font-semibold text-[var(--hw-ink)]">Free Instant Express Estimate</span> of repair costs.
        </div>

        <div className="mt-5">
          <label
            className="block cursor-pointer rounded-[var(--hw-radius-lg)] border border-dashed border-[rgba(17,24,39,.22)] bg-[var(--hw-soft)] p-4 hover:bg-white"
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const f = e.dataTransfer.files?.[0] ?? null;
              if (!f) return;
              if (f.type && f.type !== "application/pdf") return;
              void handleFile(f);
            }}
          >
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
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                if (!f) return;
                void handleFile(f);
              }}
            />
          </label>
        </div>
      </div>
    </Card>
  );
}

export function PartnerDashboardClient(props: PartnerDashboardProps) {
  const basePath = props.basePath;

  const nav = useMemo(
    () => [
      { href: `${basePath}/dashboard`, label: "Dashboard" },
      { href: `${basePath}/express-estimate`, label: "Instant Estimate" },
      { href: `${basePath}/jobs`, label: "Jobs" },
      { href: `${basePath}/clients`, label: "My Clients" },
      { href: `${basePath}/properties`, label: "Properties" },
      { href: `${basePath}/messages`, label: "Messages" },
      { href: `${basePath}/marketing-tools`, label: "Marketing Tools" },
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
  const [marketingQr, setMarketingQr] = useState<string>("");

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

  // If someone opens /pro/* without a partner link, default to demo so they can see the product.
  useEffect(() => {
    if (partner !== null) return;
    if (isDemoMode()) return;
    if (basePath !== "/pro") return;

    try {
      const u = new URL(window.location.href);
      u.searchParams.set("demo", "1");
      window.location.replace(u.toString());
    } catch {}
  }, [partner, basePath]);

  // Fetch work orders + messages
  useEffect(() => {
    if (!partner?.partnerId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const demoQ = isDemoMode() ? "&demo=1" : "";
        const partnerCode = partner.partnerId.replace(/^(pro_|partner_)/, "");
        const [woRes, msgRes] = await Promise.all([
          fetch(`/api/pro/work-orders?partnerId=${encodeURIComponent(partnerCode)}${demoQ}`),
          fetch(`/api/messages?partnerId=${encodeURIComponent(partnerCode)}&limit=20${demoQ}`),
        ]);

        if (!woRes.ok) throw new Error(`Failed to load work orders (${woRes.status})`);
        if (!msgRes.ok) throw new Error(`Failed to load messages (${msgRes.status})`);

        const woJson = (await woRes.json()) as { ok?: boolean; workOrders?: WorkOrder[] };
        const msgJson = (await msgRes.json()) as { ok?: boolean; messages?: Message[] };

        if (!cancelled) {
          setWorkOrders(woJson.workOrders || []);
          setMessages(msgJson.messages || []);
        }

        // If we have no real messages yet, fall back to seeded demo threads so mobile/desktop match.
        if (!cancelled && (!msgJson.messages || msgJson.messages.length === 0)) {
          try {
            const demoRes = await fetch(`/api/messages?partnerId=${encodeURIComponent(partnerCode)}&limit=20&demo=1`);
            if (demoRes.ok) {
              const demoJson = (await demoRes.json()) as { ok?: boolean; messages?: Message[] };
              if (!cancelled && demoJson.messages?.length) setMessages(demoJson.messages);
            }
          } catch {
            // ignore
          }
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

  // KPI tiles should match what the user sees. When there are no real work orders/messages yet,
  // we fall back to the demo list and seeded demo messages.
  const effectiveWorkOrders = useMemo(() => (workOrders.length ? workOrders : PRO_DEMO_WORK_ORDERS), [workOrders]);

  const grouped = useMemo(() => {
    const map: Record<StatusGroup, WorkOrder[]> = {
      Pending: [],
      Scheduled: [],
      "In progress": [],
      Completed: [],
    };
    for (const wo of effectiveWorkOrders) map[normalizeStatus(wo.status)].push(wo);
    return map;
  }, [effectiveWorkOrders]);

  const unreadCount = useMemo(() => {
    if (messages.length) return messages.filter((m) => !m.readAt).length;
    // Keep KPI consistent with the demo preview card.
    return 1;
  }, [messages]);

  const activeCount = useMemo(() => grouped["In progress"].length + grouped["Scheduled"].length, [grouped]);
  const pendingCount = useMemo(() => grouped.Pending.length, [grouped]);
  const completedCount = useMemo(() => grouped.Completed.length, [grouped]);

  const partnerInviteLink = useMemo(() => {
    if (!partner?.partnerId) return "";
    if (typeof window === "undefined") return "";

    // Partner links are currently expected in the format /p/<code> (e.g. /p/frj)
    // Some stored partnerIds may be prefixed (e.g. pro_frj). Normalize for link-sharing.
    const code = partner.partnerId.replace(/^(pro_|partner_)/, "");
    return `${window.location.origin}/p/${code}`;
  }, [partner?.partnerId]);

  const qrUrl = useMemo(() => {
    if (!partnerInviteLink) return "";
    return `/api/marketing/qr?data=${encodeURIComponent(partnerInviteLink)}`;
  }, [partnerInviteLink]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!partnerInviteLink) {
        setMarketingQr("");
        return;
      }
      try {
        const dataUrl = await QRCode.toDataURL(partnerInviteLink, { margin: 1, width: 220 });
        if (!cancelled) setMarketingQr(dataUrl);
      } catch {
        if (!cancelled) setMarketingQr("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [partnerInviteLink]);

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
        threadId: m.threadId || "",
        from: m.fromRole,
        address: m.propertyAddress || recentWorkOrders?.[0]?.address || "",
        body: m.body,
        createdAt: m.createdAt,
        unread: !m.readAt,
      }))
    : demoPreviewMessages.slice(0, 1).map((m) => ({ ...m, threadId: "thread_credits", unread: true }));

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
        <Link href={`${basePath}/messages${messages.length ? "" : "?demo=1"}`} className="shrink-0">
          <Button size="sm" className="px-3">View</Button>
        </Link>
      </div>

      <div className="mt-2 grid gap-2">
        {previewRows.map((m) => {
          const baseHref = m.threadId
            ? `${basePath}/messages?threadId=${encodeURIComponent(m.threadId)}`
            : `${basePath}/messages`;

          const href = messages.length ? baseHref : withDemo(baseHref);

          return (
            <Link
              key={m.id}
              href={href}
              className="block max-w-full overflow-hidden rounded-[var(--hw-radius)] border border-[var(--hw-line)] bg-white px-3 py-2 transition hover:bg-[var(--hw-soft)]"
            >
              <div className="flex min-w-0 items-start gap-2">
                {m.unread ? <span className="mt-[3px] h-2 w-2 shrink-0 rounded-full bg-[rgb(229,57,53)]" /> : null}
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[var(--hw-ink)] truncate">{m.from}</div>
                  {m.address ? <div className="mt-0.5 text-[11px] text-[var(--hw-muted)] truncate">{m.address}</div> : null}
                  <div className="mt-1 text-xs text-[var(--hw-ink)] truncate">{m.body}</div>
                </div>
              </div>
            </Link>
          );
        })}
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
          <Button>Start Instant Estimate</Button>
        </Link>
      }
      hideHeading
    >
      <div className="grid gap-6">
        {/* Top row: AI intake (left) + KPIs (right, 2x2) + Messages (under tiles) */}
        <div className="grid items-start gap-6 lg:grid-cols-12 lg:items-stretch">
          <div className="lg:col-span-8 h-full flex flex-col">
            <div className="h-full">
              <AIWorkOrderIntakeCard
              eyebrow="Job Work Order"
              title={partner?.partnerName ? `Hey ${partner.partnerName.split(" ")[0]}, what do you need help with?` : "What do you need help with?"}
              primaryCta="Schedule a visit"
              secondaryCta="Browse marketplace"
              showServicingPill={false}
              />
            </div>

            {/* Mobile: move Instant Estimate directly under Job Work Order */}
            <div className="mt-6 lg:hidden">
              <InstantEstimateCard basePath={basePath} />
            </div>
          </div>
          <div className="lg:col-span-4">
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

        {/* Desktop: 2-column row (don't stretch left card when invite expands) */}
        <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
          <div className="hidden lg:block lg:col-span-8">
            <InstantEstimateCard basePath={basePath} />
          </div>

          {/* Invite */}
          <Card className="p-5 lg:col-span-4">
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
              <div className="relative flex min-h-[44px] items-center rounded-[var(--hw-radius-lg)] border-2 border-[var(--hw-line)] bg-white px-3 py-3 overflow-hidden">
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
                        <div className="flex flex-col items-center gap-2 sm:items-end">
                          <ProgressRail status={status} />
                          {wo.updatedAt ? (
                            <span className="text-xs text-[var(--hw-muted)]">
                              Updated {new Date(wo.updatedAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                            </span>
                          ) : wo.createdAt ? (
                            <span className="text-xs text-[var(--hw-muted)]">
                              Created {new Date(wo.createdAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                            </span>
                          ) : null}
                        </div>
                      }
                    />
                  );
                })}
              </div>
            </DashboardSection>
                        <Card className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[var(--hw-ink)]">Marketing Tools</div>
                  <div className="mt-1 text-sm text-[var(--hw-muted)]">Templates and branded assets to help you market yourself with Homeworke.</div>
                </div>
                <Link href={`${basePath}/marketing-tools`} className="shrink-0">
                  <Button size="sm" variant="secondary">Open</Button>
                </Link>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Card className="p-4">
                  <div className="text-sm font-semibold text-[var(--hw-ink)]">Your QR Code</div>
                  <div className="mt-1 text-sm text-[var(--hw-muted)]">Clients can scan to connect using your invite link.</div>

                  <div className="mt-3 flex items-center gap-3">
                    {marketingQr ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt="Invite QR"
                        src={marketingQr}
                        className="h-[92px] w-[92px] rounded-[12px] border border-[var(--hw-line)] bg-white p-1"
                      />
                    ) : (
                      <div className="h-[92px] w-[92px] rounded-[12px] border border-[var(--hw-line)] bg-[var(--hw-soft)]" />
                    )}

                    <div className="grid gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          if (!qrUrl) return;
                          window.open(qrUrl, "_blank");
                        }}
                        disabled={!qrUrl}
                      >
                        <ImageIcon className="h-4 w-4" />
                        Download QR
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="text-sm font-semibold text-[var(--hw-ink)]">PDF Flyers</div>
                  <div className="mt-1 text-sm text-[var(--hw-muted)]">Download one-page PDFs you can email or print.</div>

                  <div className="mt-3 grid gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        if (!partnerInviteLink) return;
                        const url = new URL("/api/marketing/flyer", window.location.origin);
                        url.searchParams.set("name", partner?.partnerName || "Real Estate Pro");
                        if (partner?.officeName) url.searchParams.set("office", partner.officeName);
                        url.searchParams.set("invite", partnerInviteLink);
                        if (marketingQr) url.searchParams.set("qr", marketingQr);
                        window.open(url.toString(), "_blank");
                      }}
                      disabled={!partnerInviteLink}
                    >
                      General flyer
                    </Button>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        if (!partnerInviteLink) return;
                        const url = new URL("/api/marketing/flyer-listing", window.location.origin);
                        url.searchParams.set("name", partner?.partnerName || "Real Estate Pro");
                        if (partner?.officeName) url.searchParams.set("office", partner.officeName);
                        url.searchParams.set("invite", partnerInviteLink);
                        if (marketingQr) url.searchParams.set("qr", marketingQr);
                        window.open(url.toString(), "_blank");
                      }}
                      disabled={!partnerInviteLink}
                    >
                      Listing repairs
                    </Button>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        if (!partnerInviteLink) return;
                        const url = new URL("/api/marketing/flyer-inspection", window.location.origin);
                        url.searchParams.set("name", partner?.partnerName || "Real Estate Pro");
                        if (partner?.officeName) url.searchParams.set("office", partner.officeName);
                        url.searchParams.set("invite", partnerInviteLink);
                        if (marketingQr) url.searchParams.set("qr", marketingQr);
                        window.open(url.toString(), "_blank");
                      }}
                      disabled={!partnerInviteLink}
                    >
                      Inspection → estimate
                    </Button>
                  </div>
                </Card>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
