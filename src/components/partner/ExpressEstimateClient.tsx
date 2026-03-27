"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";

import { Button, Card, Chip, Textarea } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";
import { buildProNav } from "@/components/partner/portal-nav";
import { stageFile } from "@/lib/staged-files";

export type ExpressEstimateClientProps = {
  basePath: "/partner" | "/pro";
  title?: string;
  role: "PARTNER" | "PRO";
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
  const [fileName, setFileName] = useState<string>("");
  const [stagedId, setStagedId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [notes, setNotes] = useState("");

  const nav = useMemo(() => buildProNav(props.basePath), [props.basePath]);

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.sessionStorage.getItem("hw.expressEstimate.notes") || "";
      if (saved) setNotes(saved);
    } catch {}
  }, []);

  return (
    <PortalShell
      role={props.role}
      title={props.title || "Express Estimate"}
      portalTitle={props.role === "PRO" ? "Real Estate Pro" : undefined}
      nav={nav}
      description="Upload an inspection/appraisal PDF, then open a report to analyze and download an estimate."
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
            <div className="mt-1 text-sm text-[var(--hw-muted)]">This PDF will be used when you open a report to analyze it.</div>
          </div>

          <div className="mt-4 grid gap-3">
            <label className="block cursor-pointer rounded-[var(--hw-radius-lg)] border border-dashed border-[var(--hw-line)] bg-[var(--hw-soft)] p-4 hover:bg-white">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[var(--hw-ink)]">{fileName || "Choose a PDF to upload"}</div>
                  <div className="mt-1 text-sm text-[var(--hw-muted)]">
                    {fileName ? "Attached. Now open a report below." : "Drag & drop or click to browse."}
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
                  if (!next) return;
                  setFile(next);
                  setFileName(next.name);
                  setStagedId("");

                  // Persist notes for the detail page.
                  try {
                    window.sessionStorage.setItem("hw.expressEstimate.notes", notes || "");
                  } catch {}
                }}
              />
            </label>

            <div>
              <div className="text-sm font-semibold text-[var(--hw-ink)]">Notes (optional)</div>
              <div className="mt-1 text-sm text-[var(--hw-muted)]">Anything you want the estimate to focus on?</div>
              <div className="mt-2">
                <Textarea
                  value={notes}
                  onChange={(e) => {
                    const v = e.target.value;
                    setNotes(v);
                    try {
                      window.sessionStorage.setItem("hw.expressEstimate.notes", v);
                    } catch {}
                  }}
                  placeholder="Add a note…"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-[var(--hw-muted)]">Upload attaches a PDF to create a new report.</div>
              <Button
                size="sm"
                disabled={!file || submitting}
                onClick={() => {
                  if (!file || submitting) return;
                  setSubmitting(true);
                  setSubmitError("");

                  void (async () => {
                    try {
                      const id = await stageFile(file);
                      setStagedId(id);
                    } catch {
                      setSubmitError("Upload failed. Please try again.");
                    } finally {
                      setSubmitting(false);
                    }
                  })();
                }}
              >
                {submitting ? "Uploading…" : "Upload"}
              </Button>
            </div>

            {submitError ? <div className="text-xs font-semibold text-[var(--hw-red)]">{submitError}</div> : null}
          </div>
        </Card>

        {/* Reports list */}
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--hw-ink)]">Reports</div>
              <div className="mt-1 text-sm text-[var(--hw-muted)]">
                Open a report to view results, select items, analyze, and download.
              </div>
            </div>
            <Chip className="border-[var(--hw-line)] bg-white">{reports.length}</Chip>
          </div>

          <div className="mt-4 grid gap-3">
            {reports.map((r) => {
              const href = `${props.basePath}/express-estimate/${encodeURIComponent(r.id)}${stagedId ? `?staged=${encodeURIComponent(stagedId)}` : ""}`;
              return (
                <div
                  key={r.id}
                  className="w-full rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-4 text-left"
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
                      <Link href={href}>
                        <Button size="sm" variant="primary" disabled={false}>
                          Open report
                        </Button>
                      </Link>
                      {null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </PortalShell>
  );
}
