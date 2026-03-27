"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";

import { Button, Card, Chip, EmptyState } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";
import { buildProNav } from "@/components/partner/portal-nav";
import { deleteStagedFile, getStagedFile } from "@/lib/staged-files";

type ExtractedLane = {
  title: string;
  items: Array<{ id: string; label: string; note?: string; range?: string }>;
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
  const [extracted, setExtracted] = useState<ExtractedLane[]>([]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allItems = useMemo(() => extracted.flatMap((lane) => lane.items), [extracted]);
  const selected = useMemo(() => allItems.filter((item) => selectedIds.has(item.id)), [allItems, selectedIds]);

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

  async function analyze() {
    if (!file || !report) return;
    setAnalyzing(true);
    setAnalysisError("");
    setAnalysisSummary("");

    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("notes", notes || "");
      fd.set("location", report.address);

      const r = await fetch("/api/express-estimate/analyze", { method: "POST", body: fd });
      const j = (await r.json()) as AnalyzeResponse;

      if (!j || !("ok" in (j as any)) || (j as any).ok !== true) {
        const err = j as Extract<AnalyzeResponse, { ok: false }>;
        const e = err?.detail ? `${err.error}: ${err.detail}` : String(err?.error || "analyze_failed");
        throw new Error(e);
      }

      const ok = j as Extract<AnalyzeResponse, { ok: true }>;
      setExtracted(ok.lanes || []);
      setAnalysisSummary(ok.summary || (ok.used === "demo" ? "Demo analysis" : ""));
      setSelectedIds(new Set());
    } catch (e: any) {
      setAnalysisError(String(e?.message || e || "analyze_failed"));
    } finally {
      setAnalyzing(false);
    }
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

            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={!report || !file || analyzing} onClick={analyze}>
                {analyzing ? "Analyzing…" : extracted.length ? "Re-analyze" : "Analyze report"}
              </Button>
              <Button size="sm" variant="secondary" disabled={!report || selected.length === 0}>
                Download selected
              </Button>
              <Button size="sm" disabled={!report || extracted.length === 0}>
                Download full
              </Button>
            </div>
          </div>

          {!file ? (
            <div className="mt-5">
              <EmptyState title="No PDF attached" text="Go back to reports and select a PDF to analyze." />
            </div>
          ) : extracted.length === 0 ? (
            <div className="mt-5">
              <EmptyState title="No analysis yet" text="Click Analyze report to generate price results." />
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
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setSelectedIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(item.id)) next.delete(item.id);
                                else next.add(item.id);
                                return next;
                              });
                            }}
                            className={
                              "w-full rounded-[calc(var(--hw-radius-lg)-8px)] border px-3 py-2 text-left transition " +
                              (on
                                ? "border-[rgba(229,57,53,.25)] bg-[rgba(229,57,53,.06)]"
                                : "border-transparent hover:border-[var(--hw-line)] hover:bg-white")
                            }
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-medium text-[var(--hw-ink)]">{item.label}</div>
                                {item.note ? <div className="mt-0.5 text-xs text-[var(--hw-muted)]">{item.note}</div> : null}
                              </div>
                              <div className="text-xs text-[var(--hw-muted)]">{item.range || "—"}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected */}
              <div className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[var(--hw-ink)]">Selected</div>
                    <div className="mt-1 text-sm text-[var(--hw-muted)]">Items included in your estimate.</div>
                  </div>
                  <Chip className="border-[var(--hw-line)] bg-white">{selected.length}</Chip>
                </div>

                {selected.length === 0 ? (
                  <div className="mt-4">
                    <EmptyState title="Nothing selected" text="Tap items to add them here." />
                  </div>
                ) : (
                  <div className="mt-4 grid gap-2">
                    {selected.map((item) => (
                      <div key={item.id} className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-sm font-medium text-[var(--hw-ink)]">{item.label}</div>
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
                        {item.note ? <div className="mt-1 text-xs text-[var(--hw-muted)]">{item.note}</div> : null}
                        {item.range ? <div className="mt-1 text-xs text-[var(--hw-muted)]">{item.range}</div> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </PortalShell>
  );
}
