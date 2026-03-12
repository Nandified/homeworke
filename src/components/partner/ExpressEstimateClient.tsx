"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";

import { Button, Card, Chip, EmptyState, Textarea } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";
import { buildProNav } from "@/components/partner/portal-nav";
import { deleteStagedFile, getStagedFile } from "@/lib/staged-files";

export type ExpressEstimateClientProps = {
  basePath: "/partner" | "/pro";
  title?: string;
  role: "PARTNER" | "PRO";
};

type ExtractedLane = {
  title: string;
  items: Array<{ id: string; label: string; note?: string; range?: string }>;
};

type Report = {
  id: string;
  address: string;
  type: "Inspection" | "Appraisal";
  createdAt: string;
  status: "Draft" | "Ready";
};

export function ExpressEstimateClient(props: ExpressEstimateClientProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [notes, setNotes] = useState("");

  // If a file was staged from the dashboard, load it once on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const staged = sp.get("staged");
    if (!staged) return;

    (async () => {
      try {
        const f = await getStagedFile(staged);
        if (f) {
          setFile(f);
          setSubmitted(false);
          setSelectedIds(new Set());
        }
      } finally {
        // Always cleanup.
        try {
          await deleteStagedFile(staged);
        } catch {}
      }
    })();
  }, []);

  const nav = useMemo(() => buildProNav(props.basePath), [props.basePath]);

  // Demo mode: prefill so people can instantly see the report UI.
  const demoMode = typeof window !== "undefined" && window.location.search.includes("demo=1");

  const reports = useMemo<Report[]>(() => {
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

  const [activeReportId, setActiveReportId] = useState<string | null>(demoMode ? reports[0]?.id ?? null : null);

  const extracted = useMemo((): ExtractedLane[] => {
    // Stubbed demo parse output — this will be wired to PDF ingestion.
    return [
      {
        title: "Exterior",
        items: [
          { id: "roof", label: "Roofing patch / replace", note: "shingles + underlayment", range: "$4.8k–$8.2k" },
          { id: "gutters", label: "Gutters + downspouts", range: "$1.1k–$1.9k" },
        ],
      },
      {
        title: "Interior",
        items: [
          { id: "paint", label: "Interior paint refresh", note: "living + hall", range: "$1.3k–$2.5k" },
          { id: "floor", label: "Floor repair / refinish", range: "$900–$2.1k" },
        ],
      },
      {
        title: "Systems",
        items: [
          { id: "hvac", label: "HVAC tune-up / diagnostic", range: "$180–$450" },
          { id: "plumbing", label: "Plumbing leak locate", range: "$250–$650" },
        ],
      },
      {
        title: "Need more info",
        items: [
          { id: "foundation", label: "Foundation crack severity", note: "photos needed" },
          { id: "mold", label: "Mold / moisture source", note: "inspection recommended" },
        ],
      },
    ];
  }, []);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allItems = useMemo(() => extracted.flatMap((lane) => lane.items), [extracted]);
  const selected = useMemo(() => allItems.filter((item) => selectedIds.has(item.id)), [allItems, selectedIds]);

  const activeReport = useMemo(() => reports.find((r) => r.id === activeReportId) || null, [reports, activeReportId]);

  return (
    <PortalShell
      role={props.role}
      title={props.title || "Express Estimate"}
      nav={nav}
      description="Upload an inspection/appraisal PDF and generate a polished repair estimate in minutes."
      primaryAction={
        <Link href={`${props.basePath}/dashboard`}>
          <Button variant="secondary">Back to dashboard</Button>
        </Link>
      }
    >
      <div className="grid gap-6">
        {/* Upload */}
        <Card className="p-6">
          <div>
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Upload a PDF</div>
            <div className="mt-1 text-sm text-[var(--hw-muted)]">Inspection report or appraisal repair request.</div>
          </div>

          <div className="mt-4 grid gap-3">
            <label className="block cursor-pointer rounded-[var(--hw-radius-lg)] border border-dashed border-[var(--hw-line)] bg-[var(--hw-soft)] p-4 hover:bg-white">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[var(--hw-ink)]">{file ? file.name : "Choose a PDF to upload"}</div>
                  <div className="mt-1 text-sm text-[var(--hw-muted)]">{file ? "Ready to submit." : "Drag & drop or click to browse."}</div>
                </div>
                <div className="shrink-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }}
                  >
                    Browse
                  </Button>
                </div>
              </div>
              <input
                ref={fileInputRef}
                className="hidden"
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  const next = e.target.files?.[0] ?? null;
                  setFile(next);
                  setSubmitted(false);
                  setSelectedIds(new Set());
                }}
              />
            </label>

            <div>
              <div className="text-sm font-semibold text-[var(--hw-ink)]">Notes (optional)</div>
              <div className="mt-1 text-sm text-[var(--hw-muted)]">Anything you want the estimate to focus on?</div>
              <div className="mt-2">
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add a note…" />
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                onClick={() => {
                  if (!file) return;
                  setSubmitted(true);
                  // In real wiring: create a report, set it active.
                  setActiveReportId(reports[0]?.id ?? null);
                }}
                disabled={!file}
              >
                {submitted ? "Submitted" : "Submit"}
              </Button>
              <div className="text-xs text-[var(--hw-muted)]">We’ll generate suggested line items you can review and edit.</div>
            </div>
          </div>
        </Card>

        {/* Reports list */}
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--hw-ink)]">Reports</div>
              <div className="mt-1 text-sm text-[var(--hw-muted)]">Your uploaded PDFs live here. Open a report to build and download an estimate.</div>
            </div>
            <Chip className="border-[var(--hw-line)] bg-white">{reports.length}</Chip>
          </div>

          <div className="mt-4 grid gap-3">
            {reports.map((r) => {
              const active = r.id === activeReportId;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setActiveReportId(r.id)}
                  className={
                    "w-full rounded-[var(--hw-radius-lg)] border p-4 text-left transition " +
                    (active
                      ? "border-[rgba(229,57,53,.35)] bg-[rgba(229,57,53,.04)]"
                      : "border-[var(--hw-line)] bg-white hover:bg-[var(--hw-soft)]")
                  }
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[var(--hw-ink)]">{r.address}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--hw-muted)]">
                        <span>{r.type}</span>
                        <span>•</span>
                        <span>{new Date(r.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                        <span>•</span>
                        <span>{r.status}</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <Button size="sm" variant={active ? "primary" : "secondary"}>
                        {active ? "Open" : "View"}
                      </Button>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Open report */}
        <Card className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-[var(--hw-ink)]">{activeReport ? activeReport.address : "Open a report"}</div>
              <div className="mt-1 text-sm text-[var(--hw-muted)]">
                {activeReport ? `${activeReport.type} • ${activeReport.status}` : "Select a report above to review line items."}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" disabled={!activeReport}>
                Download selected
              </Button>
              <Button size="sm" disabled={!activeReport}>
                Download full
              </Button>
            </div>
          </div>

          {!activeReport ? (
            <div className="mt-5">
              <EmptyState title="No report selected" text="Choose a report above to view categories and select items." />
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

              {/* Embedded selection */}
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
