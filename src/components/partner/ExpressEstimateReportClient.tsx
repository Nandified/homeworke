"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";

import { Button, Card, Chip, EmptyState } from "@/components/ui";
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
  const nav = useMemo(() => buildProNav(props.basePath), [props.basePath]);

  const demoReports = useMemo<Report[]>(() => {
    const now = Date.now();
    return [
      {
        id: "rpt_4240_mozart",
        address: "4240 S Mozart St, Chicago, IL",
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
          },
          { id: "gutters", label: "Gutters + downspouts", range: "$1.1k–$1.9k", price: 1500 },
        ],
      },
      {
        title: "Interior",
        items: [
          { id: "paint", label: "Interior paint refresh", note: "living + hall", range: "$1.3k–$2.5k", price: 1900 },
          { id: "floor", label: "Floor repair / refinish", range: "$900–$2.1k", price: 1500 },
        ],
      },
      {
        title: "Systems",
        items: [
          { id: "hvac", label: "HVAC tune-up / diagnostic", range: "$180–$450", price: 300 },
          { id: "plumbing", label: "Plumbing leak locate", range: "$250–$650", price: 450 },
        ],
      },
      {
        title: "Need more info",
        items: [
          { id: "foundation", label: "Foundation crack severity", note: "photos needed", price: 0 },
          { id: "mold", label: "Mold / moisture source", note: "inspection recommended", price: 0 },
        ],
      },
    ];
  }, []);

  const [extracted, setExtracted] = useState<ExtractedLane[]>(demoExtracted);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string>("");

  const allItems = useMemo(() => extracted.flatMap((lane) => lane.items), [extracted]);
  const selected = useMemo(() => allItems.filter((item) => selectedIds.has(item.id)), [allItems, selectedIds]);

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
    const full = fullNums.reduce((a, b) => a + b, 0);
    const sel = selNums.reduce((a, b) => a + b, 0);
    return { full, selected: sel };
  }, [allItems, selected]);

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
      return;
    }

    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.address.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}-${mode}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <PortalShell
      role={props.role}
      title="Express Estimate"
      portalTitle={props.role === "PRO" ? "Real Estate Pro" : undefined}
      nav={nav}
      description="Analyze a report and download an estimate."
      primaryAction={
        <Link href={`${props.basePath}/express-estimate`}>
          <Button variant="secondary">Back to reports</Button>
        </Link>
      }
    >
      <div className="grid gap-6">
        <Card className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-[var(--hw-ink)]">{report ? report.address : "Report"}</div>
              <div className="mt-1 text-sm text-[var(--hw-muted)]">
                {report ? `${report.type} • ${report.status}` : "This report does not exist in demo data."}
              </div>
              {analysisError ? <div className="mt-2 text-xs font-semibold text-[var(--hw-red)]">{analysisError}</div> : null}
              {analysisSummary ? <div className="mt-2 text-xs text-[var(--hw-muted)]">{analysisSummary}</div> : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="secondary" disabled={!report || selected.length === 0} onClick={() => download("selected")}>
                Download selected
              </Button>
              <Button size="sm" disabled={!report || extracted.length === 0} onClick={() => download("full")}>
                Download full
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={selected.length === 0}
                onClick={() => setDrawerOpen(true)}
              >
                Selected ({selected.length})
              </Button>
            </div>
          </div>

          {extracted.length === 0 ? (
            <div className="mt-5">
              <EmptyState title="No demo data" text="No items available yet." />
            </div>
          ) : (
            <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_360px]">
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
                        return (
                          <div
                            key={item.id}
                            className={
                              "w-full rounded-[calc(var(--hw-radius-lg)-8px)] border px-3 py-2 text-left transition " +
                              (on
                                ? "border-[rgba(229,57,53,.25)] bg-[rgba(229,57,53,.06)]"
                                : "border-transparent hover:border-[var(--hw-line)] hover:bg-white")
                            }
                          >
                            <div className="flex flex-col gap-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-semibold text-[var(--hw-ink)]">{item.label}</div>
                                  {item.note ? <div className="mt-0.5 truncate text-xs text-[var(--hw-muted)]">{item.note}</div> : null}
                                </div>
                                <div className="shrink-0 text-right">
                                  <div className="text-sm font-semibold text-[var(--hw-ink)]">{formatUSD(estimateItemValue(item) || 0)}</div>
                                  <div className="text-[11px] text-[var(--hw-muted)]">{item.range || "—"}</div>
                                </div>
                              </div>

                              {item.evidence?.length ? (
                                <div className="flex flex-wrap gap-2">
                                  {item.evidence.slice(0, 3).map((ev) => (
                                    <button
                                      key={ev.src}
                                      type="button"
                                      className="h-14 w-14 overflow-hidden rounded-[14px] border border-[var(--hw-line)] bg-[var(--hw-soft)]"
                                      onClick={() => setLightboxSrc(ev.src)}
                                      title={ev.caption || "Evidence"}
                                    >
                                      <img src={ev.src} alt={ev.caption || "Evidence"} className="h-full w-full object-cover" />
                                    </button>
                                  ))}
                                </div>
                              ) : null}

                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  size="sm"
                                  variant={on ? "secondary" : "primary"}
                                  onClick={() => {
                                    setSelectedIds((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(item.id)) next.delete(item.id);
                                      else next.add(item.id);
                                      return next;
                                    });
                                  }}
                                >
                                  {on ? "Selected ✓" : "Select item"}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => {}}>
                                  Book repair
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected */}
              <div className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-5">
                <div className="mb-4 rounded-[var(--hw-radius-lg)] border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.06)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Instant Estimate total</div>
                  <div className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">{formatUSD(totals.selected)}</div>
                  <div className="mt-1 text-xs text-[var(--hw-muted)]">Based on selected items (avg of ranges).</div>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[var(--hw-ink)]">Selected items</div>
                    <div className="mt-1 text-sm text-[var(--hw-muted)]">Included in your Instant Estimate download.</div>
                  </div>
                  <Chip className="border-[var(--hw-line)] bg-white">{selected.length}</Chip>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
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

                {selected.length === 0 ? (
                  <div className="mt-4">
                    <EmptyState title="Nothing selected" text="Use “Select item” to include items in the Instant Estimate download." />
                  </div>
                ) : (
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
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Drawer */}
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
