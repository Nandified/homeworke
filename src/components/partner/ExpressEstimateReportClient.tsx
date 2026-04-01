"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";

import { Button, Card, Chip, EmptyState, Input, Picker } from "@/components/ui";
import { Camera, ChevronDown, Copy, Download, Hammer, Share2 } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { buildProNav } from "@/components/partner/portal-nav";
import { deleteStagedFile, getStagedFile } from "@/lib/staged-files";

type EvidenceThumb = { src: string; caption?: string };

type ExtractedLane = {
  title: string;
  items: Array<{ id: string; label: string; note?: string; range?: string; price?: number; evidence?: EvidenceThumb[] }>;
};

type AnalyzeResponse =
  | { ok: true; summary?: string; lanes: ExtractedLane[]; used?: "openai" | "demo" | string }
  | { ok: false; error: string; detail?: string };

type Report = {
  id: string;
  address: string;
  type: "Inspection" | "Appraisal";
  createdAt: string;
  status: "Draft" | "Ready";
};

export function ExpressEstimateReportClient(props: {
  basePath: "/partner" | "/pro";
  role: "PARTNER" | "PRO";
  reportId: string;
  stagedId?: string;
}) {
  function svgThumb(label: string, bg = "#fdecec", fg = "#b91c1c") {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">\n  <rect x="0" y="0" width="96" height="96" rx="18" fill="${bg}"/>\n  <text x="48" y="52" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Inter,Arial" font-size="12" font-weight="700" fill="${fg}">${label}</text>\n</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
  const nav = useMemo(() => buildProNav(props.basePath), [props.basePath]);

  const demoReports = useMemo<Report[]>(() => {
    const now = Date.now();
    return [
      {
        id: "rpt_4240_mozart",
        address: "4240 S Mozart St, Chicago, IL 60632",
        type: "Inspection",
        createdAt: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
        status: "Ready",
      },
      {
        id: "rpt_8950_52nd",
        address: "8950 S 52nd Ave, Oak Lawn, IL",
        type: "Appraisal",
        createdAt: new Date(now - 1000 * 60 * 60 * 24 * 6).toISOString(),
        status: "Draft",
      },
    ];
  }, []);

  const report = useMemo(() => demoReports.find((r) => r.id === props.reportId) || null, [demoReports, props.reportId]);

  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState<string>("");

  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string>("");
  const [analysisSummary, setAnalysisSummary] = useState<string>("");

  const [downloading, setDownloading] = useState<"" | "full" | "selected">("");
  const [toast, setToast] = useState<string>("");
  const demoExtracted = useMemo<ExtractedLane[]>(() => {
    return [
      {
        title: "Exterior",
        items: [
          {
            id: "roof",
            label: "Roofing patch / replace",
            note: "shingles + underlayment",
            range: "$4.8k–$8.2k",
            price: 6500,
            evidence: [
              { src: svgThumb("Roof"), caption: "Roof photo" },
              { src: svgThumb("Shingle"), caption: "Shingles" },
              { src: svgThumb("Flashing"), caption: "Flashing" },
            ],
          },
          {
            id: "gutters",
            label: "Gutters + downspouts",
            range: "$1.1k–$1.9k",
            price: 1500,
            evidence: [{ src: svgThumb("Gutter"), caption: "Gutters" }],
          },
          { id: "siding", label: "Siding repair", note: "loose panels", range: "$900–$2.2k", price: 1500, evidence: [{ src: svgThumb("Siding") }] },
          { id: "deck", label: "Deck board replacement", note: "rot / splintering", range: "$600–$1.6k", price: 1100, evidence: [{ src: svgThumb("Deck") }] },
          { id: "chimney", label: "Chimney cap / flashing", range: "$450–$1.4k", price: 850 },
        ],
      },
      {
        title: "Interior",
        items: [
          {
            id: "paint",
            label: "Interior paint refresh",
            note: "living + hall",
            range: "$1.3k–$2.5k",
            price: 1900,
            evidence: [{ src: svgThumb("Paint"), caption: "Wall" }, { src: svgThumb("Trim"), caption: "Trim" }],
          },
          { id: "floor", label: "Floor repair / refinish", range: "$900–$2.1k", price: 1500 },
          { id: "drywall", label: "Drywall patch + texture", note: "water stain", range: "$250–$900", price: 550 },
          { id: "window", label: "Window seal / sash repair", range: "$180–$650", price: 420 },
          { id: "door", label: "Door alignment + weatherstrip", range: "$120–$420", price: 260 },
        ],
      },
      {
        title: "Systems",
        items: [
          { id: "hvac", label: "HVAC tune-up / diagnostic", range: "$180–$450", price: 300 },
          { id: "plumbing", label: "Plumbing leak locate", range: "$250–$650", price: 450 },
          { id: "water_heater", label: "Water heater inspection", range: "$150–$400", price: 260 },
          { id: "electrical", label: "Electrical panel evaluation", range: "$250–$850", price: 520 },
          { id: "sump", label: "Sump pump test / replace", range: "$220–$950", price: 520 },
        ],
      },
      {
        title: "Need more info",
        items: [
          { id: "foundation", label: "Foundation crack severity", note: "photos needed", price: 0 },
          { id: "mold", label: "Mold / moisture source", note: "inspection recommended", price: 0 },
          { id: "attic", label: "Attic ventilation", note: "needs photos", price: 0 },
          { id: "crawl", label: "Crawlspace moisture", note: "needs inspection", price: 0 },
        ],
      },
    ];
  }, []);

  const [extracted, setExtracted] = useState<ExtractedLane[]>(demoExtracted);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [repairIds, setRepairIds] = useState<Set<string>>(new Set());
  const [openItemId, setOpenItemId] = useState<string>("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [repairsOpen, setRepairsOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [shareMode, _setShareMode] = useState<"full" | "selected">("full");
  const [shareTab, setShareTab] = useState<"new" | "contacts" | "link">("new");
  const [shareFirstName, setShareFirstName] = useState("");
  const [shareLastName, setShareLastName] = useState("");
  const [shareEmail, setShareEmail] = useState("");
  const [sharePhone, setSharePhone] = useState("");
  const [shareRole, setShareRole] = useState("");
  const [contactId, setContactId] = useState("");
  const [shareBusy, setShareBusy] = useState(false);

  function setShareMode(next: "full" | "selected") {
    _setShareMode(next);
    // Changing share mode changes what the token represents.
    setShareUrl("");
  }
  const [lightboxSrc, setLightboxSrc] = useState<string>("");

  const allItems = useMemo(() => extracted.flatMap((lane) => lane.items), [extracted]);
  const selected = useMemo(() => allItems.filter((item) => selectedIds.has(item.id)), [allItems, selectedIds]);
  const repairs = useMemo(() => allItems.filter((item) => repairIds.has(item.id)), [allItems, repairIds]);

  const savedContacts = useMemo(() => {
    if (typeof window === "undefined") return [] as Array<{ id: string; name: string; email?: string; phone?: string }>;
    try {
      const raw = window.localStorage.getItem("hw_props_client_v1") || "[]";
      const arr = JSON.parse(raw) as unknown[];
      const out: Array<{ id: string; name: string; email?: string; phone?: string }> = [];
      const seen = new Set<string>();
      for (const p of Array.isArray(arr) ? arr : []) {
        const rec = p && typeof p === "object" ? (p as Record<string, unknown>) : null;
        const name = typeof rec?.clientName === "string" ? rec.clientName.trim() : "";
        const email = typeof rec?.clientEmail === "string" ? rec.clientEmail.trim() : "";
        const phone = typeof rec?.clientPhone === "string" ? rec.clientPhone.trim() : "";
        const key = (email || phone || name).toLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push({ id: key, name: name || email || phone || "Client", email: email || undefined, phone: phone || undefined });
      }
      return out.slice(0, 50);
    } catch {
      return [];
    }
  }, []);

  function parseMoneyToNumber(raw: string): number | null {
    const s = (raw || "").toLowerCase().replace(/\s+/g, " ").trim();
    if (!s) return null;

    // Extract first numeric token and optional suffix.
    const m = s.match(/\$?([0-9]+(?:\.[0-9]+)?)(k|m)?/i);
    if (!m) return null;
    const n = Number(m[1]);
    if (!Number.isFinite(n)) return null;
    const suf = (m[2] || "").toLowerCase();
    const mult = suf === "k" ? 1000 : suf === "m" ? 1_000_000 : 1;
    return n * mult;
  }

  function estimateItemValue(item: { range?: string; price?: number }): number | null {
    if (typeof item.price === "number" && Number.isFinite(item.price)) return item.price;
    const r = (item.range || "").replace(/–/g, "-");
    const parts = r.split("-").map((p) => p.trim());
    if (parts.length >= 2) {
      const a = parseMoneyToNumber(parts[0]);
      const b = parseMoneyToNumber(parts[1]);
      if (a !== null && b !== null) return (a + b) / 2;
      return a ?? b;
    }
    return parseMoneyToNumber(r);
  }

  function formatUSD(n: number): string {
    return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  }

  const totals = useMemo(() => {
    const fullNums = allItems.map(estimateItemValue).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    const selNums = selected.map(estimateItemValue).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    const repNums = repairs.map(estimateItemValue).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    const full = fullNums.reduce((a, b) => a + b, 0);
    const sel = selNums.reduce((a, b) => a + b, 0);
    const rep = repNums.reduce((a, b) => a + b, 0);
    return { full, selected: sel, repairs: rep };
  }, [allItems, repairs, selected]);

  // Load staged file (if present) when arriving from list.
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const n = window.sessionStorage.getItem("hw.expressEstimate.notes") || "";
      if (n) setNotes(n);
    } catch {}

    const stagedId = props.stagedId;
    if (!stagedId) return;

    (async () => {
      try {
        const f = await getStagedFile(stagedId);
        if (f) setFile(f);
      } finally {
        try {
          await deleteStagedFile(stagedId);
        } catch {}
      }
    })();
  }, [props.stagedId]);

  // Analysis is triggered during the upload/submit step (list page).
  // This page focuses on viewing results and downloading.

  async function download(mode: "full" | "selected") {
    if (!report) return;

    try {
      setDownloading(mode);
      setToast(mode === "full" ? "Preparing full report…" : "Preparing selected report…");

      const ids = mode === "selected" ? selected.map((s) => s.id) : null;

      const r = await fetch("/api/express-estimate/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: report.id,
          address: report.address,
          reportType: report.type,
          mode,
          selectedIds: ids,
          lanes: extracted,
        }),
      });

      if (!r.ok) {
        setAnalysisError("Download failed.");
        setToast("Download failed.");
        return;
      }

      const blob = await r.blob();
      setToast("Downloading…");

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.address.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}-${mode}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setToast("Downloaded.");
      window.setTimeout(() => setToast(""), 2200);
    } finally {
      setDownloading("");
    }
  }

  return (
    <PortalShell
      role={props.role}
      title="Instant Estimate"
      portalTitle={props.role === "PRO" ? "Real Estate Pro" : undefined}
      nav={nav}
      description={
        <>
          Download the <span className="font-semibold text-[var(--hw-ink)]">full report</span> or{" "}
          <span className="font-semibold text-[var(--hw-ink)]">select</span> the items you want included. You can also book{" "}
          <span className="font-semibold text-[var(--hw-ink)]">repairs</span> from here.
        </>
      }
      primaryAction={
        <Link href={`${props.basePath}/express-estimate`}>
          <Button variant="secondary">Back to reports</Button>
        </Link>
      }
    >
      <div className="grid gap-6">
        {toast ? (
          <div className="fixed bottom-5 left-1/2 z-[70] w-[min(520px,calc(100vw-32px))] -translate-x-1/2 rounded-full border border-[rgba(229,57,53,.18)] bg-white px-4 py-2.5 text-center text-sm font-semibold text-[var(--hw-ink)] shadow-[0_16px_40px_rgba(17,24,39,.16)]">
            {toast}
          </div>
        ) : null}
        <Card className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Instant Estimates</div>
              <div className="mt-1 text-xs font-semibold text-[var(--hw-muted)]">
                Prepared For: <span className="font-semibold text-[var(--hw-ink)]">Owner Name</span>
              </div>
              <div className="mt-1 text-xs font-semibold text-[var(--hw-muted)]">
                Property Address: <span className="font-semibold text-[var(--hw-ink)]">{report ? report.address : "Report"}</span>
              </div>
              {report ? null : (
                <div className="mt-1 text-sm text-[var(--hw-muted)]">This report does not exist in demo data.</div>
              )}
              {analysisError ? <div className="mt-2 text-xs font-semibold text-[var(--hw-red)]">{analysisError}</div> : null}
              {analysisSummary ? <div className="mt-2 text-xs text-[var(--hw-muted)]">{analysisSummary}</div> : null}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-6 sm:flex-nowrap">
              <Button
                size="sm"
                disabled={!report || extracted.length === 0 || downloading !== ""}
                onClick={() => setDownloadOpen(true)}
                className="gap-2 whitespace-nowrap px-3"
              >
                <Download className="h-4 w-4" />
                {downloading ? "Preparing…" : "Download report"}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={!report}
                onClick={() => {
                  setShareMode(selected.length ? "selected" : "full");
                  setShareUrl("");
                  setShareOpen(true);
                }}
                className="gap-2 whitespace-nowrap px-3"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={repairs.length === 0}
                onClick={() => setRepairsOpen(true)}
                className="gap-2 whitespace-nowrap px-3"
              >
                <Hammer className="h-4 w-4" />
                Repair Cart
                <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-[var(--hw-line)] bg-white px-1 text-[11px] font-semibold text-[var(--hw-ink)]">
                  {repairs.length}
                </span>
              </Button>
            </div>
          </div>

          {extracted.length === 0 ? (
            <div className="mt-5">
              <EmptyState title="No demo data" text="No items available yet." />
            </div>
          ) : (
            <div className="mt-5 grid gap-6">
              {/* Lanes */}
              <div className="grid gap-4">
                {extracted.map((lane) => (
                  <div key={lane.title} className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white">
                    <div className="flex items-center justify-between gap-3 border-b border-[var(--hw-line)] px-4 py-3">
                      <div className="text-xs font-semibold tracking-wide uppercase text-[var(--hw-muted)]">{lane.title}</div>
                      <Chip className="border-[var(--hw-line)] bg-[var(--hw-soft)] text-[var(--hw-ink)]">{lane.items.length}</Chip>
                    </div>
                    <div className="grid gap-1 p-2">
                      {lane.items.map((item) => {
                        const on = selectedIds.has(item.id);
                        const open = openItemId === item.id;
                        const hasEvidence = !!item.evidence?.length;
                        return (
                          <div
                            key={item.id}
                            className={
                              "overflow-hidden rounded-[calc(var(--hw-radius-lg)-8px)] border transition " +
                              (open
                                ? "border-[rgba(229,57,53,.20)] bg-[rgba(229,57,53,.04)]"
                                : on
                                  ? "border-[rgba(229,57,53,.18)] bg-white"
                                  : "border-[var(--hw-line)] bg-white")
                            }
                          >
                            <button
                              type="button"
                              className={
                                "flex w-full items-start justify-between gap-3 px-3 py-3 text-left transition hover:bg-[var(--hw-soft)]"
                              }
                              onClick={() => {
                                setOpenItemId((prev) => (prev === item.id ? "" : item.id));
                              }}
                              aria-expanded={open}
                            >
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-[var(--hw-ink)]">{item.label}</div>
                                {/* Keep the row clean; show the full narrative inside the accordion */}
                                {item.note ? (
                                  <div className="mt-0.5 text-xs text-[var(--hw-muted)] whitespace-normal break-words line-clamp-2">
                                    {item.note}
                                  </div>
                                ) : null}
                              </div>

                              <div className="shrink-0">
                                <div className="flex items-start gap-3">
                                  <div className="w-[110px] text-right tabular-nums">
                                    <div className="text-sm font-semibold text-[var(--hw-ink)]">{formatUSD(estimateItemValue(item) || 0)}</div>
                                    <div className="text-[11px] text-[var(--hw-muted)]">{item.range || "—"}</div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <div
                                      className={
                                        "inline-flex w-[98px] items-center justify-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-semibold " +
                                        (open
                                          ? "border-[rgba(229,57,53,.22)] bg-white text-[var(--hw-red)]"
                                          : "border-[var(--hw-line)] bg-[var(--hw-soft)] text-[var(--hw-muted)]")
                                      }
                                      title="Expand to view details"
                                    >
                                      <Camera className={"h-3.5 w-3.5 " + (hasEvidence ? "opacity-100" : "opacity-0")} />
                                      <span>Details</span>
                                      <ChevronDown className={"h-3.5 w-3.5 transition " + (open ? "rotate-180" : "") } />
                                    </div>

                                    <Button
                                      size="sm"
                                      variant={on ? "secondary" : "primary"}
                                      className="rounded-full px-3"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setSelectedIds((prev) => {
                                          const next = new Set(prev);
                                          if (next.has(item.id)) next.delete(item.id);
                                          else next.add(item.id);
                                          return next;
                                        });
                                      }}
                                    >
                                      {on ? "Selected" : "Select"}
                                    </Button>

                                    <Button
                                      size="sm"
                                      variant={repairIds.has(item.id) ? "secondary" : "ghost"}
                                      className="rounded-full px-3"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setRepairIds((prev) => {
                                          const next = new Set(prev);
                                          if (next.has(item.id)) next.delete(item.id);
                                          else next.add(item.id);
                                          return next;
                                        });
                                      }}
                                    >
                                      {repairIds.has(item.id) ? "Repair ✓" : "Book repair"}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </button>

                            {open ? (
                              <div className="border-t border-[rgba(17,24,39,.08)] bg-white px-3 pb-3 pt-3">
                                {item.note ? (
                                  <div className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--hw-ink)]/80">
                                    {item.note}
                                  </div>
                                ) : null}

                                {hasEvidence ? (
                                  <div className="grid gap-2 sm:grid-cols-3">
                                    {item.evidence!.slice(0, 6).map((ev) => (
                                      <button
                                        key={ev.src}
                                        type="button"
                                        className="aspect-square w-full overflow-hidden rounded-[14px] border border-[var(--hw-line)] bg-[var(--hw-soft)]"
                                        onClick={() => setLightboxSrc(ev.src)}
                                        title={ev.caption || "Evidence"}
                                      >
                                        <img src={ev.src} alt={ev.caption || "Evidence"} className="h-full w-full object-cover" />
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs text-[var(--hw-muted)]">No evidence photos available for this item.</div>
                                )}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile mid-page Repair Cart CTA (between list and totals) */}
              <div className="lg:hidden">
                <div className="flex justify-center">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={repairs.length === 0}
                    onClick={() => setRepairsOpen(true)}
                    className="gap-2"
                  >
                    <Hammer className="h-4 w-4" />
                    Repair Cart
                    <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-[var(--hw-line)] bg-white px-1 text-[11px] font-semibold text-[var(--hw-ink)]">
                      {repairs.length}
                    </span>
                  </Button>
                </div>
              </div>

              {/* Sticky bottom Instant Estimate bar (content width) */}
              <div className="sticky bottom-4 mt-2">
                <div className="rounded-[var(--hw-radius-lg)] border border-[rgba(229,57,53,.18)] bg-white/95 p-4 shadow-[0_18px_48px_rgba(17,24,39,.14)] backdrop-blur">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Instant Estimate Total</div>
                      <div className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">
                        {formatUSD(selected.length ? totals.selected : totals.full)}
                      </div>
                      <div className="mt-1 text-xs text-[var(--hw-muted)]">
                        {selected.length
                          ? `Selected ${selected.length} item${selected.length === 1 ? "" : "s"}`
                          : `All items (${allItems.length})`}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" variant="secondary" disabled={selected.length === 0} onClick={() => setDrawerOpen(true)}>
                        Selected ({selected.length})
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={selected.length === 0}
                        onClick={() => setSelectedIds(new Set())}
                      >
                        Clear
                      </Button>
                      <Button
                        size="sm"
                        disabled={!report || extracted.length === 0 || downloading !== ""}
                        onClick={() => setDownloadOpen(true)}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        {downloading ? "Preparing…" : "Download report"}
                      </Button>
                    </div>
                  </div>

                  {selected.length === 0 ? (
                    <div className="mt-3 text-xs text-[var(--hw-muted)]">Tip: Select items to download a shorter report for clients.</div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Download modal */}
        {downloadOpen ? (
          <div className="fixed inset-0 z-[55] flex items-center justify-center p-6">
            <button type="button" className="absolute inset-0 bg-black/50" onClick={() => setDownloadOpen(false)} aria-label="Close" />
            <div className="relative w-full max-w-md overflow-hidden rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white shadow-[0_20px_60px_rgba(0,0,0,.25)]">
              <div className="flex items-center justify-between border-b border-[var(--hw-line)] p-4">
                <div className="text-sm font-semibold text-[var(--hw-ink)]">Download report</div>
                <Button size="sm" variant="secondary" onClick={() => setDownloadOpen(false)}>
                  Close
                </Button>
              </div>
              <div className="p-4">
                <div className="grid gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!report || selected.length === 0 || downloading !== ""}
                    onClick={() => {
                      setDownloadOpen(false);
                      void download("selected");
                    }}
                  >
                    {downloading === "selected" ? "Preparing…" : `Download selected (${selected.length})`}
                  </Button>
                  <Button
                    size="sm"
                    disabled={!report || extracted.length === 0 || downloading !== ""}
                    onClick={() => {
                      setDownloadOpen(false);
                      void download("full");
                    }}
                  >
                    {downloading === "full" ? "Preparing…" : "Download full report"}
                  </Button>
                </div>
                <div className="mt-3 text-xs text-[var(--hw-muted)]">Tip: Select items to download a shorter report for clients.</div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Share modal */}
        {shareOpen ? (
          <div className="fixed inset-0 z-[56] flex items-center justify-center p-6">
            <button type="button" className="absolute inset-0 bg-black/50" onClick={() => setShareOpen(false)} aria-label="Close" />
            <div className="relative w-full max-w-lg overflow-visible rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white shadow-[0_20px_60px_rgba(0,0,0,.25)]">
              <div className="flex items-center justify-between border-b border-[var(--hw-line)] p-4">
                <div className="text-sm font-semibold text-[var(--hw-ink)]">Share report</div>
                <Button size="sm" variant="secondary" onClick={() => setShareOpen(false)}>
                  Close
                </Button>
              </div>

              <div className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant={shareTab === "new" ? "primary" : "secondary"} onClick={() => setShareTab("new")}>
                    New user
                  </Button>
                  <Button size="sm" variant={shareTab === "contacts" ? "primary" : "secondary"} onClick={() => setShareTab("contacts")}>
                    Contact list
                  </Button>
                  <Button size="sm" variant={shareTab === "link" ? "primary" : "secondary"} onClick={() => setShareTab("link")}>
                    Generic link
                  </Button>
                </div>

                

                {shareTab === "new" ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-3 sm:grid-cols-2 sm:col-span-2">
                      <Input value={shareFirstName} onChange={(e) => setShareFirstName(e.target.value)} placeholder="First name" />
                      <Input value={shareLastName} onChange={(e) => setShareLastName(e.target.value)} placeholder="Last name" />
                    </div>

                    <div className="sm:col-span-2">
                      <Input value={shareEmail} onChange={(e) => setShareEmail(e.target.value)} placeholder="Email" />
                    </div>

                    <div className="sm:col-span-2">
                      <Input value={sharePhone} onChange={(e) => setSharePhone(e.target.value)} placeholder="Phone" />
                    </div>

                    <div className="sm:col-span-2">
                      <Picker
                        value={shareRole}
                        placeholder="Role"
                        options={[
                          { id: "Homeowner", label: "Homeowner" },
                          { id: "Homebuyer", label: "Homebuyer" },
                          { id: "Listing Agent", label: "Listing Agent" },
                          { id: "Buyer’s Agent", label: "Buyer’s Agent" },
                          { id: "Buyer’s Closing Coordinator", label: "Buyer’s Closing Coordinator" },
                          { id: "Seller’s Closing Coordinator", label: "Seller’s Closing Coordinator" },
                          { id: "Assistant", label: "Assistant" },
                          { id: "Contractor / Vendor", label: "Contractor / Vendor" },
                          { id: "Other", label: "Other" },
                        ]}
                        onChange={setShareRole}
                      />
                    </div>

                    <div className="sm:col-span-2 flex flex-wrap items-center justify-end gap-2">
                      <Button
                        size="sm"
                        disabled={!report || shareBusy || !shareEmail}
                        onClick={async () => {
                          if (!report) return;
                          setShareBusy(true);
                          try {
                            const name = `${shareFirstName} ${shareLastName}`.trim();
                            const r = await fetch("/api/express-estimate/share/send", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                reportId: report.id,
                                address: report.address,
                                reportType: report.type,
                                mode: "full",
                                lanes: extracted,
                                pro: {
                                  code: "frj",
                                  name: "Fernando Rocha Jr",
                                  email: "Fernando@TheFRJgroup.com",
                                  phone: "",
                                  brokerageName: "The FRJ Group",
                                },
                                recipient: {
                                  name: name || undefined,
                                  email: shareEmail || undefined,
                                  phone: sharePhone || undefined,
                                  role: shareRole || undefined,
                                },
                              }),
                            });
                            const j = (await r.json().catch(() => null)) as unknown;
                            const ok = !!(j && typeof j === "object" && (j as Record<string, unknown>).ok === true);
                            if (!ok) {
                              setToast("Send failed.");
                              window.setTimeout(() => setToast(""), 2000);
                              return;
                            }
                            // Also add to saved contacts store (local for now)
                            try {
                              const raw = window.localStorage.getItem("hw_props_client_v1") || "[]";
                              const arr = (JSON.parse(raw) as unknown[]) || [];
                              arr.unshift({
                                clientName: name,
                                clientEmail: shareEmail,
                                clientPhone: sharePhone,
                              });
                              window.localStorage.setItem("hw_props_client_v1", JSON.stringify(arr.slice(0, 200)));
                            } catch {}
                            setToast("Sent.");
                            window.setTimeout(() => setToast(""), 1800);
                          } finally {
                            setShareBusy(false);
                          }
                        }}
                      >
                        {shareBusy ? "Sending…" : "Send & Add Contact +"}
                      </Button>
                    </div>
                  </div>
                ) : null}

                {shareTab === "contacts" ? (
                  <div className="mt-3 grid gap-3">
                    <Picker
                      searchable
                      value={contactId}
                      placeholder="Select a contact"
                      options={savedContacts.map((c) => ({
                        id: c.id,
                        label: c.name,
                        sublabel: [c.email, c.phone].filter(Boolean).join(" • "),
                      }))}
                      onChange={(id) => {
                        setContactId(id);
                        const c = savedContacts.find((x) => x.id === id);
                        if (c) {
                          const parts = (c.name || "").trim().split(/\s+/g);
                          setShareFirstName(parts[0] || c.name || "");
                          setShareLastName(parts.slice(1).join(" ") || "");
                          setShareEmail(c.email || "");
                          setSharePhone(c.phone || "");
                          setShareRole("");
                        }
                      }}
                    />

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Button
                        size="sm"
                        disabled={!report || shareBusy || !shareEmail}
                        onClick={async () => {
                          if (!report) return;
                          setShareBusy(true);
                          try {
                            const name = `${shareFirstName} ${shareLastName}`.trim();
                            const r = await fetch("/api/express-estimate/share/send", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                reportId: report.id,
                                address: report.address,
                                reportType: report.type,
                                mode: "full",
                                lanes: extracted,
                                pro: {
                                  code: "frj",
                                  name: "Fernando Rocha Jr",
                                  email: "Fernando@TheFRJgroup.com",
                                  phone: "",
                                  brokerageName: "The FRJ Group",
                                },
                                recipient: {
                                  name: name || undefined,
                                  email: shareEmail || undefined,
                                  phone: sharePhone || undefined,
                                },
                              }),
                            });
                            const j = (await r.json().catch(() => null)) as unknown;
                            const ok = !!(j && typeof j === "object" && (j as Record<string, unknown>).ok === true);
                            if (!ok) {
                              setToast("Send failed.");
                              window.setTimeout(() => setToast(""), 2000);
                              return;
                            }
                            setToast("Sent.");
                            window.setTimeout(() => setToast(""), 1800);
                          } finally {
                            setShareBusy(false);
                          }
                        }}
                      >
                        {shareBusy ? "Sending…" : "Send"}
                      </Button>
                    </div>
                  </div>
                ) : null}

                {shareTab === "link" ? (
                  <div className="mt-3 rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Generic share link</div>
                    <div className="mt-1 text-sm font-semibold text-[var(--hw-ink)]">Full report</div>
                    <div className="mt-1 text-xs text-[var(--hw-muted)]">
                      Anyone with this link can view the estimate. Booking repairs and additional details are gated until they log in via magic link.
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button size="sm" variant="secondary" disabled={!report || shareBusy} className="gap-2" onClick={async () => {
                        if (!report) return;
                        setShareBusy(true);
                        try {
                          let url = shareUrl;
                          if (!url) {
                            const r = await fetch("/api/express-estimate/share/create", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                reportId: report.id,
                                address: report.address,
                                reportType: report.type,
                                mode: "full",
                                lanes: extracted,
                                pro: {
                                  code: "frj",
                                  name: "Fernando Rocha Jr",
                                  email: "Fernando@TheFRJgroup.com",
                                  phone: "",
                                  brokerageName: "The FRJ Group",
                                },
                                recipient: {},
                              }),
                            });
                            const j = (await r.json().catch(() => null)) as unknown;
                            const rec = j && typeof j === "object" ? (j as Record<string, unknown>) : null;
                            const ok = !!(rec && rec.ok === true);
                            const nextUrl = rec && typeof rec.url === "string" ? rec.url : "";
                            if (!ok || !nextUrl) {
                              setToast("Share link failed.");
                              window.setTimeout(() => setToast(""), 2200);
                              return;
                            }
                            url = nextUrl;
                            setShareUrl(url);
                          }
                          await navigator.clipboard.writeText(url);
                          setToast("Link copied.");
                          window.setTimeout(() => setToast(""), 1800);
                        } catch {
                          setToast("Copy failed.");
                          window.setTimeout(() => setToast(""), 1800);
                        } finally {
                          setShareBusy(false);
                        }
                      }}>
                        <Copy className="h-4 w-4" />
                        {shareBusy ? "Working…" : "Copy link"}
                      </Button>
                    </div>

                    <div className="mt-2 text-xs text-[var(--hw-muted)]">
                      {shareUrl ? `Link ready: ${shareUrl.replace(/^https?:\/\//, "").slice(0, 42)}…` : "A link will be generated when you copy."}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {/* Selected Drawer */}
        {drawerOpen ? (
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close"
            />
            <div className="absolute right-0 top-0 h-full w-full max-w-[420px] bg-white shadow-[0_20px_60px_rgba(0,0,0,.25)]">
              <div className="flex items-start justify-between gap-3 border-b border-[var(--hw-line)] p-5">
                <div>
                  <div className="text-sm font-semibold text-[var(--hw-ink)]">Selected items</div>
                  <div className="mt-1 text-sm text-[var(--hw-muted)]">Included in your Instant Estimate download.</div>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setDrawerOpen(false)}>
                  Close
                </Button>
              </div>

              <div className="p-5">
                <div className="mb-4 rounded-[var(--hw-radius-lg)] border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.06)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Selected total</div>
                  <div className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">{formatUSD(totals.selected)}</div>
                  <div className="mt-1 text-xs text-[var(--hw-muted)]">Based on selected items (avg of ranges).</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" disabled={!report || selected.length === 0} onClick={() => download("selected")}>
                    Download selected
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={selected.length === 0}
                    onClick={() => {
                      setSelectedIds(new Set());
                    }}
                  >
                    Clear
                  </Button>
                </div>

                {selected.length ? (
                  <div className="mt-4 grid gap-2">
                    {selected.map((item) => (
                      <div key={item.id} className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-[var(--hw-ink)]">{item.label}</div>
                            {item.note ? <div className="mt-1 truncate text-xs text-[var(--hw-muted)]">{item.note}</div> : null}
                          </div>
                          <button
                            className="text-xs font-semibold text-[var(--hw-muted)] hover:text-[var(--hw-ink)]"
                            onClick={() => {
                              setSelectedIds((prev) => {
                                const next = new Set(prev);
                                next.delete(item.id);
                                return next;
                              });
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-[var(--hw-radius-lg)] border border-dashed border-[var(--hw-line)] bg-[var(--hw-soft)] p-6 text-sm text-[var(--hw-muted)]">
                    Nothing selected yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Repairs Drawer */}
        {repairsOpen ? (
          <div className="fixed inset-0 z-50">
            <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setRepairsOpen(false)} aria-label="Close" />
            <div className="absolute inset-0 bg-white shadow-[0_20px_60px_rgba(0,0,0,.25)] lg:inset-auto lg:right-0 lg:top-0 lg:h-full lg:w-full lg:max-w-[420px]">
              <div className="grid grid-cols-3 items-center gap-3 border-b border-[var(--hw-line)] p-5">
                <div />
                <div className="text-center">
                  <div className="text-sm font-extrabold tracking-tight text-[var(--hw-red)]">Homeworke</div>
                  <div className="mt-0.5 text-xs font-semibold text-[var(--hw-muted)]">Repairs to book</div>
                </div>
                <div className="flex justify-end">
                  <Button size="sm" variant="secondary" onClick={() => setRepairsOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>

              <div className="p-5">
                <div className="mb-4 rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Repairs total (est.)</div>
                  <div className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">{formatUSD(totals.repairs)}</div>
                  <div className="mt-1 text-xs text-[var(--hw-muted)]">This is a placeholder flow — next step will be Checkout/Booking.</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" disabled={repairs.length === 0} onClick={() => {}}>
                    Continue to book
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={repairs.length === 0}
                    onClick={() => {
                      setRepairIds(new Set());
                    }}
                  >
                    Clear
                  </Button>
                </div>

                {repairs.length ? (
                  <div className="mt-4 grid gap-2">
                    {repairs.map((item) => (
                      <div key={item.id} className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-[var(--hw-ink)]">{item.label}</div>
                            {item.note ? <div className="mt-1 truncate text-xs text-[var(--hw-muted)]">{item.note}</div> : null}
                          </div>
                          <button
                            className="inline-flex h-7 items-center text-xs font-semibold text-[var(--hw-muted)] hover:text-[var(--hw-ink)]"
                            onClick={() => {
                              setRepairIds((prev) => {
                                const next = new Set(prev);
                                next.delete(item.id);
                                return next;
                              });
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-[var(--hw-radius-lg)] border border-dashed border-[var(--hw-line)] bg-[var(--hw-soft)] p-6 text-sm text-[var(--hw-muted)]">
                    No repairs selected.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Lightbox */}
        {lightboxSrc ? (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <button type="button" className="absolute inset-0 bg-black/60" onClick={() => setLightboxSrc("")} aria-label="Close" />
            <div className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-[var(--hw-radius-lg)] bg-white shadow-[0_20px_60px_rgba(0,0,0,.35)]">
              <div className="flex items-center justify-between border-b border-[var(--hw-line)] p-3">
                <div className="text-sm font-semibold text-[var(--hw-ink)]">Evidence</div>
                <Button size="sm" variant="secondary" onClick={() => setLightboxSrc("")}>
                  Close
                </Button>
              </div>
              <div className="bg-black">
                <img src={lightboxSrc} alt="Evidence" className="max-h-[80vh] w-full object-contain" />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </PortalShell>
  );
}
