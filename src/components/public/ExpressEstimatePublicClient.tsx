"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { Button, Card, Chip, Container, Pill, Textarea } from "@/components/ui";
import { deleteStagedFile, getStagedFile } from "@/lib/staged-files";

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

export function ExpressEstimatePublicClient(props: { stagedId?: string; partnerCode?: string }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Load staged file (from public landing flow)
  useEffect(() => {
    if (!props.stagedId) return;
    (async () => {
      try {
        const f = await getStagedFile(props.stagedId!);
        if (f) setFile(f);
      } finally {
        // best-effort cleanup
        try {
          await deleteStagedFile(props.stagedId!);
        } catch {}
      }
    })();
  }, [props.stagedId]);

  const reports = useMemo<Report[]>(() => {
    const now = Date.now();
    return [
      {
        id: "rpt_demo",
        address: "(from your upload)",
        type: "Inspection",
        createdAt: new Date(now - 1000 * 60 * 10).toISOString(),
        status: submitted ? "Ready" : "Draft",
      },
    ];
  }, [submitted]);

  const extracted = useMemo((): ExtractedLane[] => {
    // Stubbed parse output — wired later to real PDF ingestion.
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
    ];
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <Container className="py-10 md:py-16">
        <div className="flex flex-wrap items-center gap-2">
          <Pill>Express Estimate</Pill>
          {props.partnerCode ? <Pill>Partner: {props.partnerCode.toUpperCase()}</Pill> : null}
        </div>

        <h1 className="mt-6 text-balance text-4xl font-extrabold tracking-tight text-[var(--hw-ink)]">
          Upload a report. Get an estimate.
        </h1>
        <p className="mt-4 max-w-2xl text-pretty text-base leading-7 text-[var(--hw-muted)]">
          Upload an inspection or appraisal PDF and we’ll generate a polished estimate you can review and share. Final pricing depends on confirmed scope.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Card className="p-6 lg:col-span-7">
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Upload a PDF</div>
            <div className="mt-1 text-sm text-[var(--hw-muted)]">Inspection report or appraisal repair request.</div>

            <div className="mt-4 grid gap-3">
              <label className="block cursor-pointer rounded-[var(--hw-radius-lg)] border border-dashed border-[var(--hw-line)] bg-[var(--hw-soft)] p-4 hover:bg-white">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[var(--hw-ink)]">
                      {file ? file.name : "Choose a PDF to upload"}
                    </div>
                    <div className="mt-1 text-sm text-[var(--hw-muted)]">
                      {file ? "Ready to submit." : "Drag & drop or click to browse."}
                    </div>
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
                  }}
                />
              </label>

              <div>
                <div className="text-sm font-semibold text-[var(--hw-ink)]">Notes (optional)</div>
                <div className="mt-2">
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add a note…" />
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  onClick={() => {
                    if (!file) return;
                    setSubmitted(true);
                  }}
                  disabled={!file}
                >
                  {submitted ? "Submitted" : "Submit"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <div className="text-xs text-[var(--hw-muted)]">In this build, the report parsing UI is demo-mode.</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 lg:col-span-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-[var(--hw-ink)]">Reports</div>
                <div className="mt-1 text-sm text-[var(--hw-muted)]">Your upload appears here once submitted.</div>
              </div>
              <Chip className="border-[var(--hw-line)] bg-white">{reports.length}</Chip>
            </div>

            <div className="mt-4 grid gap-3">
              {reports.map((r) => (
                <div key={r.id} className="w-full rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-4">
                  <div className="truncate text-sm font-semibold text-[var(--hw-ink)]">{r.address}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--hw-muted)]">
                    <span>{r.type}</span>
                    <span>•</span>
                    <span>{new Date(r.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                    <span>•</span>
                    <span>{r.status}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-xs text-[var(--hw-muted)]">
              By continuing, you agree to Homeworke’s Terms and Privacy Policy.
            </div>
          </Card>
        </div>

        {submitted ? (
          <Card className="mt-8 p-6">
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Suggested line items (preview)</div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              {extracted.map((lane) => (
                <div key={lane.title} className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">{lane.title}</div>
                  <div className="mt-3 grid gap-2">
                    {lane.items.map((it) => (
                      <div key={it.id} className="rounded-[var(--hw-radius)] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-3">
                        <div className="text-sm font-semibold text-[var(--hw-ink)]">{it.label}</div>
                        {it.note ? <div className="mt-1 text-xs text-[var(--hw-muted)]">{it.note}</div> : null}
                        {it.range ? <div className="mt-2 text-xs font-semibold text-[var(--hw-ink)]">{it.range}</div> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/marketplace/intake">
                <Button>Request service</Button>
              </Link>
              <Link href="/">
                <Button variant="secondary">Back to Homeworke</Button>
              </Link>
            </div>

            {notes ? <div className="mt-6 text-sm text-[var(--hw-muted)]">Notes: {notes}</div> : null}
          </Card>
        ) : null}
      </Container>
    </div>
  );
}
