"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Copy, FileDown, Image as ImageIcon, Share2, UserPlus, Zap } from "lucide-react";

import * as htmlToImage from "html-to-image";
import QRCode from "qrcode";

import { Button, Card, Chip, EmptyState, Input, Label, StatTile } from "@/components/ui";
import { AIWorkOrderIntakeCard } from "@/components/ai/AIWorkOrderIntakeCard";
import { PortalShell } from "@/components/portal-shell";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
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

function InstantEstimateCard({ basePath }: { basePath: string }) {
  const router = useRouter();
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <Card
      className="relative overflow-hidden border-[rgba(229,57,53,.35)] p-6 md:p-7"
      style={{ boxShadow: "0 10px 30px rgba(229,57,53,.06)" }}
    >
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[var(--hw-red)]/20 blur-[60px]" />
      <div aria-hidden className="pointer-events-none absolute -left-24 bottom-0 h-48 w-48 rounded-full bg-[var(--hw-red)]/10 blur-[70px]" />

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
          <label className="block cursor-pointer rounded-[var(--hw-radius-lg)] border border-dashed border-[rgba(17,24,39,.22)] bg-[var(--hw-soft)] p-4 hover:bg-white">
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
      </div>
    </Card>
  );
}

function PartnerMarketingToolsSection({
  basePath,
  partner,
  inviteLink,
}: {
  basePath: string;
  partner: PartnerContext | null | undefined;
  inviteLink: string;
}) {
  const proName = partner?.partnerName || "Your Real Estate Pro";
  const proFirst = (partner?.partnerName || "").split(" ")[0] || "";
  const office = partner?.officeName || "";

  const [emailChoice, setEmailChoice] = useState("intro_buy");
  const [smsChoice, setSmsChoice] = useState("sms_intro");
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [downloadingImage, setDownloadingImage] = useState(false);
  const [socialChoice, setSocialChoice] = useState("express_estimate");

  const socialRef = useRef<HTMLDivElement | null>(null);

  const valueProps = "Vetted, licensed, and insured pros — backed by a Project Manager + Home Guide.";

  const emailTemplates = useMemo(
    () =>
      [
        {
          id: "intro_buy",
          label: "Intro (Buyer)",
          subject: "A simple way to handle repairs + upgrades (with me in the loop)",
          body: `Hi {first_name},\n\nIf you need any repairs, upgrades, or prep work during your home journey, I’m using Homeworke to make it easy. ${valueProps}\n\nUse my invite link to connect and start a request:\n${inviteLink}\n\n— ${proName}${office ? `\n${office}` : ""}`,
        },
        {
          id: "listing_repairs",
          label: "Listing repairs (Seller)",
          subject: "Listing prep + repair coordination made simple",
          body: `Hi {first_name},\n\nFor listing prep, the key is speed + clarity. Homeworke helps us coordinate licensed/insured pros, scope, scheduling, and oversight — without the chaos.\n\nGet started here (connects you to my dashboard):\n${inviteLink}\n\n— ${proName}${office ? `\n${office}` : ""}`,
        },
        {
          id: "post_inspection",
          label: "Post-inspection (Upload report)",
          subject: "Next step: upload the inspection for an Express Estimate",
          body: `Hi {first_name},\n\nWant a fast, helpful repair-cost range from the inspection? Homeworke’s Express Estimate makes it easy.\n\nConnect here, then upload the report:\n${inviteLink}\n\n— ${proName}${office ? `\n${office}` : ""}`,
        },
      ],
    [inviteLink, office, proName]
  );

  const smsTemplates = useMemo(
    () =>
      [
        {
          id: "sms_intro",
          label: "Intro",
          body: `Hey! Here’s my Homeworke link — it makes repairs/renovations easy (${valueProps}). Start here: ${inviteLink}`,
        },
        {
          id: "sms_listing",
          label: "Listing prep",
          body: `For listing prep repairs, Homeworke helps us coordinate licensed/insured pros + scheduling. Here’s my link: ${inviteLink}`,
        },
        {
          id: "sms_inspection",
          label: "Upload inspection → estimate",
          body: `Upload the inspection and get an Express Estimate range here: ${inviteLink}`,
        },
      ],
    [inviteLink]
  );

  const chosenEmail = emailTemplates.find((t) => t.id === emailChoice) || emailTemplates[0];
  const chosenSms = smsTemplates.find((t) => t.id === smsChoice) || smsTemplates[0];

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyToast(`${label} copied`);
      window.setTimeout(() => setCopyToast(null), 1200);
    } catch {
      setCopyToast("Copy failed");
      window.setTimeout(() => setCopyToast(null), 1200);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!inviteLink) return;
      try {
        const url = await QRCode.toDataURL(inviteLink, { margin: 1, width: 220 });
        if (!cancelled) setQrDataUrl(url);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [inviteLink]);

  async function downloadSocialImage() {
    if (!socialRef.current) return;
    setDownloadingImage(true);
    try {
      const dataUrl = await htmlToImage.toPng(socialRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `homeworke-social-${proFirst || "pro"}.png`;
      a.click();
    } finally {
      setDownloadingImage(false);
    }
  }

  async function downloadFlyerPdf(kind: "general" | "listing" | "inspection") {
    const path =
      kind === "general" ? "/api/marketing/flyer" : kind === "listing" ? "/api/marketing/flyer-listing" : "/api/marketing/flyer-inspection";

    const url = new URL(path, window.location.origin);
    url.searchParams.set("name", proName);
    if (office) url.searchParams.set("office", office);
    if (inviteLink) url.searchParams.set("invite", inviteLink);
    if (qrDataUrl) url.searchParams.set("qr", qrDataUrl);
    window.open(url.toString(), "_blank");
  }

  return (
    <DashboardSection
      title="Marketing Tools"
      description="Copy/paste outreach + branded assets you can share to drive invites and Express Estimates."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <div className="text-sm font-semibold text-[var(--hw-ink)]">Email templates</div>
          <div className="mt-1 text-sm text-[var(--hw-muted)]">Pick a template, personalize, and send from your email.</div>

          <div className="mt-3 grid gap-2">
            <Label className="text-xs">Template</Label>
            <select
              className="h-10 w-full rounded-[var(--hw-radius-md)] border border-[var(--hw-line)] bg-white px-3 text-sm"
              value={emailChoice}
              onChange={(e) => setEmailChoice(e.target.value)}
            >
              {emailTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>

            <div className="mt-2 rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-3">
              <div className="text-xs font-semibold text-[var(--hw-ink)]">Subject</div>
              <div className="mt-1 text-xs text-[var(--hw-muted)] whitespace-pre-wrap">{chosenEmail.subject}</div>
              <div className="mt-3 text-xs font-semibold text-[var(--hw-ink)]">Body</div>
              <div className="mt-1 text-xs text-[var(--hw-muted)] whitespace-pre-wrap">{chosenEmail.body}</div>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => copy(`${chosenEmail.subject}\n\n${chosenEmail.body}`, "Email" )}
              >
                <Copy className="h-4 w-4" />
                Copy email
              </Button>
              <Link href={`${basePath}/clients`}>
                <Button size="sm" variant="secondary">View clients</Button>
              </Link>
            </div>
            {copyToast ? <div className="text-xs text-[var(--hw-muted)]">{copyToast}</div> : null}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-semibold text-[var(--hw-ink)]">Text / SMS templates</div>
          <div className="mt-1 text-sm text-[var(--hw-muted)]">Quick scripts you can paste into iMessage/SMS.</div>

          <div className="mt-3 grid gap-2">
            <Label className="text-xs">Template</Label>
            <select
              className="h-10 w-full rounded-[var(--hw-radius-md)] border border-[var(--hw-line)] bg-white px-3 text-sm"
              value={smsChoice}
              onChange={(e) => setSmsChoice(e.target.value)}
            >
              {smsTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>

            <div className="mt-2 rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-3">
              <div className="text-xs text-[var(--hw-muted)] whitespace-pre-wrap">{chosenSms.body}</div>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => copy(chosenSms.body, "Text") }>
                <Copy className="h-4 w-4" />
                Copy text
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  try {
                    const text = chosenSms.body;
                    if (navigator.share) {
                      await navigator.share({ text, url: inviteLink || undefined });
                    } else {
                      await navigator.clipboard.writeText(text);
                      window.location.href = `sms:&body=${encodeURIComponent(text)}`;
                    }
                  } catch {
                    // ignore
                  }
                }}
                disabled={!inviteLink}
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-semibold text-[var(--hw-ink)]">Social post image</div>
          <div className="mt-1 text-sm text-[var(--hw-muted)]">Download a branded square image you can post or send.</div>

          <div className="mt-3 grid gap-2">
            <Label className="text-xs">Layout</Label>
            <select
              className="h-10 w-full rounded-[var(--hw-radius-md)] border border-[var(--hw-line)] bg-white px-3 text-sm"
              value={socialChoice}
              onChange={(e) => setSocialChoice(e.target.value)}
            >
              <option value="express_estimate">Express Estimate</option>
              <option value="listing_prep">Listing Prep Repairs</option>
              <option value="partner_cred">Partnered with Homeworke</option>
            </select>

            <div className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-3">
              <div
                ref={socialRef}
                className="relative overflow-hidden rounded-[16px] border border-[rgba(229,57,53,.25)] bg-white"
                style={{ width: 360, height: 360 }}
              >
                <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[var(--hw-red)]/20 blur-[55px]" />
                <div aria-hidden className="pointer-events-none absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-[var(--hw-red)]/10 blur-[70px]" />

                <div className="relative flex h-full flex-col justify-between p-5">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Homeworke • Partner</div>
                    {socialChoice === "express_estimate" ? (
                      <>
                        <div className="mt-2 text-xl font-extrabold tracking-tight text-[var(--hw-ink)]">Instant Express Estimate</div>
                        <div className="mt-2 text-sm text-[var(--hw-muted)]">Fast repair-cost ranges from inspection reports.</div>
                      </>
                    ) : socialChoice === "listing_prep" ? (
                      <>
                        <div className="mt-2 text-xl font-extrabold tracking-tight text-[var(--hw-ink)]">Listing Prep Repairs</div>
                        <div className="mt-2 text-sm text-[var(--hw-muted)]">Coordinate licensed & insured pros — deadline-friendly.</div>
                      </>
                    ) : (
                      <>
                        <div className="mt-2 text-xl font-extrabold tracking-tight text-[var(--hw-ink)]">Partnered with Homeworke</div>
                        <div className="mt-2 text-sm text-[var(--hw-muted)]">All-in-one home services + dedicated support.</div>
                      </>
                    )}
                  </div>

                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[var(--hw-ink)] truncate">{proName}</div>
                      {office ? <div className="mt-0.5 text-xs text-[var(--hw-muted)] truncate">{office}</div> : null}
                      <div className="mt-2 text-xs text-[var(--hw-muted)]">Scan to connect</div>
                    </div>
                    {qrDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="QR" src={qrDataUrl} className="h-[84px] w-[84px] rounded-[12px] border border-[var(--hw-line)] bg-white p-1" />
                    ) : (
                      <div className="h-[84px] w-[84px] rounded-[12px] border border-[var(--hw-line)] bg-[var(--hw-soft)]" />
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={downloadSocialImage} disabled={downloadingImage}>
                  <ImageIcon className="h-4 w-4" />
                  {downloadingImage ? "Generating…" : "Download PNG"}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-semibold text-[var(--hw-ink)]">PDF flyers</div>
          <div className="mt-1 text-sm text-[var(--hw-muted)]">Download one-page PDFs you can email or print.</div>

          <div className="mt-3 grid gap-2">
            <Button size="sm" variant="secondary" onClick={() => downloadFlyerPdf("general")} disabled={!inviteLink}>
              <FileDown className="h-4 w-4" />
              Download: General flyer
            </Button>
            <Button size="sm" variant="secondary" onClick={() => downloadFlyerPdf("listing")} disabled={!inviteLink}>
              <FileDown className="h-4 w-4" />
              Download: Listing repairs
            </Button>
            <Button size="sm" variant="secondary" onClick={() => downloadFlyerPdf("inspection")} disabled={!inviteLink}>
              <FileDown className="h-4 w-4" />
              Download: Inspection → estimate
            </Button>
            <div className="text-xs text-[var(--hw-muted)]">Includes your name, office, invite link, and QR.</div>
          </div>
        </Card>
      </div>
    </DashboardSection>
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

            {/* Mobile: move Instant Estimate directly under Job Work Order */}
            <div className="mt-6 lg:hidden">
              <InstantEstimateCard basePath={basePath} />
            </div>
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

        {/* Desktop: keep Instant Estimate here */}
        <div className="hidden lg:block">
          <InstantEstimateCard basePath={basePath} />
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
            <PartnerMarketingToolsSection basePath={basePath} partner={partner} inviteLink={partnerInviteLink} />
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
