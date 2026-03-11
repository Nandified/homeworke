"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { Button, Card, Chip, EmptyState, Textarea } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";
import { buildProNav } from "@/components/partner/portal-nav";

export type ExpressEstimateClientProps = {
  basePath: "/partner" | "/pro";
  title?: string;
  role: "PARTNER" | "PRO";
};

type ExtractedLane = {
  title: string;
  items: Array<{ id: string; label: string; note?: string; range?: string }>;
};

export function ExpressEstimateClient(props: ExpressEstimateClientProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parseStarted, setParseStarted] = useState(false);
  const [notes, setNotes] = useState("");

  // Demo mode: prefill so people can instantly see the builder.
  const builderReady = (typeof window !== "undefined" && window.location.search.includes("demo=1")) || (Boolean(file) && parseStarted);

  const nav = useMemo(() => buildProNav(props.basePath), [props.basePath]);

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

  // builderReady declared above

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
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--hw-ink)]">Upload a PDF</div>
              <div className="mt-1 text-sm text-[var(--hw-muted)]">Inspection report or appraisal repair request.</div>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            <label className="block cursor-pointer rounded-[var(--hw-radius-lg)] border border-dashed border-[var(--hw-line)] bg-[var(--hw-soft)] p-4 hover:bg-white">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[var(--hw-ink)]">{file ? file.name : "Choose a PDF to upload"}</div>
                  <div className="mt-1 text-sm text-[var(--hw-muted)]">{file ? "Ready to extract line items." : "Drag & drop or click to browse."}</div>
                </div>
                <div className="shrink-0">
                  <Button size="sm" variant="secondary" type="button">Browse</Button>
                </div>
              </div>
              <input
                className="hidden"
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  const next = e.target.files?.[0] ?? null;
                  setFile(next);
                  setParseStarted(false);
                  setSelectedIds(new Set());
                }}
              />
            </label>

            <div className="grid gap-3">
              <div>
                <div className="text-sm font-semibold text-[var(--hw-ink)]">Anything we should pay attention to?</div>
                <div className="mt-1 text-sm text-[var(--hw-muted)]">Optional notes (e.g., “focus on roof + electrical” or “seller credits request”).</div>
                <div className="mt-2">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add a note…"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  onClick={() => {
                    if (!file) return;
                    setParseStarted(true);
                  }}
                  disabled={!file}
                >
                  {parseStarted ? "Submitted" : "Submit"}
                </Button>
                <div className="text-xs text-[var(--hw-muted)]">We’ll generate suggested line items you can review and edit.</div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-[var(--hw-ink)]">Build your estimate</div>
                <div className="mt-1 text-sm text-[var(--hw-muted)]">Select items to include. Move unclear items into “Need more info.”</div>
              </div>
              <div className="hidden sm:flex gap-2">
                <Button size="sm" variant="secondary" disabled={!builderReady}>
                  Download selected
                </Button>
                <Button size="sm" disabled={!builderReady}>Download full</Button>
              </div>
            </div>

            {!builderReady ? (
              <div className="mt-6">
                <EmptyState title="Upload a PDF to begin" text="Once parsed, extracted categories will appear here." />
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {extracted.map((lane) => (
                  <div key={lane.title} className="rounded-[var(--radius)] border border-[var(--hw-line)] bg-white">
                    <div className="flex items-center justify-between gap-3 border-b border-[var(--hw-line)] px-4 py-3">
                      <div className="text-xs font-semibold tracking-wide uppercase text-[var(--hw-muted)]">
                        {lane.title}
                      </div>
                      <Chip className="border-[var(--hw-line)] bg-[var(--hw-soft)] text-[var(--hw-ink)]">
                        {lane.items.length} items
                      </Chip>
                    </div>
                    <div className="grid gap-1 p-2">
                      {lane.items.map((item) => {
                        const active = selectedIds.has(item.id);
                        return (
                          <button
                            key={item.id}
                            className={`w-full rounded-[calc(var(--radius)-4px)] border px-3 py-2 text-left transition ${
                              active
                                ? "border-[rgba(17,24,39,.25)] bg-[var(--hw-soft)]"
                                : "border-transparent hover:border-[var(--hw-line)] hover:bg-white"
                            }`}
                            onClick={() => {
                              setSelectedIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(item.id)) next.delete(item.id);
                                else next.add(item.id);
                                return next;
                              });
                            }}
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

                <div className="sm:hidden mt-2 flex flex-col gap-2">
                  <Button variant="secondary" disabled={!builderReady}>
                    Download selected PDF
                  </Button>
                  <Button disabled={!builderReady}>Download full PDF</Button>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold">Selection cart</div>
                <div className="mt-1 text-sm text-[var(--hw-muted)]">
                  {builderReady ? "Your chosen items will appear here." : "Parse a PDF to enable selections."}
                </div>
              </div>
              <Chip className="border-[var(--hw-line)] bg-white">{selected.length}</Chip>
            </div>

            {selected.length === 0 ? (
              <div className="mt-6">
                <EmptyState title="Nothing selected" text="Tap items to add them to your cart." />
              </div>
            ) : (
              <div className="mt-4 grid gap-2">
                {selected.map((item) => (
                  <div key={item.id} className="rounded-[var(--radius)] border border-[var(--hw-line)] bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm font-medium">{item.label}</div>
                      <button
                        className="text-xs text-[var(--hw-muted)] underline"
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
                    <div className="mt-1 text-xs text-[var(--hw-muted)]">{item.range || "—"}</div>
                  </div>
                ))}

                <div className="mt-3 flex flex-col gap-2">
                  <Button disabled={!builderReady}>Send to homeowner (stub)</Button>
                  <Button variant="secondary" disabled={!builderReady}>
                    Save draft
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </PortalShell>
  );
}
