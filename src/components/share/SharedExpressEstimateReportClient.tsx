"use client";

import { useMemo, useState } from "react";

import { Button, Card, Chip, EmptyState } from "@/components/ui";
import type { ReportSharePayloadV1 } from "@/lib/share-token";

type ExtractedLane = {
  title: string;
  items: Array<{ id: string; label: string; note?: string; range?: string; price?: number }>;
};

export function SharedExpressEstimateReportClient(props: { token: string; payload: ReportSharePayloadV1 }) {
  const [downloading, setDownloading] = useState<"" | "full" | "selected">("");
  const [toast, setToast] = useState<string>("");

  const demoExtracted = useMemo<ExtractedLane[]>(() => {
    // Mirrors the demo report lanes (kept lightweight for now).
    return [
      {
        title: "Exterior",
        items: [
          { id: "roof", label: "Roofing patch / replace", note: "shingles + underlayment", range: "$4.8k–$8.2k", price: 6500 },
          { id: "gutters", label: "Gutters + downspouts", range: "$1.1k–$1.9k", price: 1500 },
          { id: "siding", label: "Siding repair", note: "loose panels", range: "$900–$2.2k", price: 1500 },
          { id: "deck", label: "Deck board replacement", note: "rot / splintering", range: "$600–$1.6k", price: 1100 },
        ],
      },
      {
        title: "Interior",
        items: [
          { id: "paint", label: "Interior paint refresh", note: "living + hall", range: "$1.3k–$2.5k", price: 1900 },
          { id: "floor", label: "Floor repair / refinish", range: "$900–$2.1k", price: 1500 },
          { id: "drywall", label: "Drywall patch + texture", note: "water stain", range: "$250–$900", price: 550 },
        ],
      },
    ];
  }, []);

  const selectedIds = new Set(props.payload.selectedIds || []);

  const lanes = useMemo(() => {
    if (props.payload.mode === "selected") {
      return demoExtracted
        .map((lane) => ({ ...lane, items: lane.items.filter((it) => selectedIds.has(it.id)) }))
        .filter((l) => l.items.length);
    }
    return demoExtracted;
  }, [demoExtracted, props.payload.mode]);

  async function download(mode: "full" | "selected") {
    try {
      setDownloading(mode);
      setToast(mode === "full" ? "Preparing full report…" : "Preparing selected report…");

      const r = await fetch("/api/express-estimate/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: props.payload.reportId,
          address: props.payload.address || "Shared address",
          reportType: (props.payload.reportType as any) || "Inspection",
          mode,
          selectedIds: mode === "selected" ? (props.payload.selectedIds || []) : null,
          lanes,
        }),
      });

      if (!r.ok) {
        setToast("Download failed.");
        return;
      }

      const blob = await r.blob();
      setToast("Downloading…");

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `shared-report-${mode}.pdf`;
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
    <div className="grid gap-4">
      {toast ? (
        <div className="fixed bottom-5 left-1/2 z-[70] w-[min(520px,calc(100vw-32px))] -translate-x-1/2 rounded-full border border-[rgba(229,57,53,.18)] bg-white px-4 py-2.5 text-center text-sm font-semibold text-[var(--hw-ink)] shadow-[0_16px_40px_rgba(17,24,39,.16)]">
          {toast}
        </div>
      ) : null}

      <Card className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--hw-ink)]">{props.payload.address || "Shared Express Estimate"}</div>
            <div className="mt-1 text-sm text-[var(--hw-muted)]">
              Shared with {props.payload.recipient?.name || "you"}
              {props.payload.recipient?.role ? ` • ${props.payload.recipient.role}` : ""}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={props.payload.mode !== "selected" || (props.payload.selectedIds || []).length === 0 || downloading !== ""}
              onClick={() => download("selected")}
            >
              {downloading === "selected" ? "Preparing…" : "Download selected"}
            </Button>
            <Button size="sm" disabled={downloading !== ""} onClick={() => download("full")}>
              {downloading === "full" ? "Preparing…" : "Download full"}
            </Button>
          </div>
        </div>

        {lanes.length === 0 ? (
          <div className="mt-5">
            <EmptyState title="Nothing shared" text="No items are available in this shared view." />
          </div>
        ) : (
          <div className="mt-5 grid gap-4">
            {lanes.map((lane) => (
              <div key={lane.title} className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white">
                <div className="flex items-center justify-between gap-3 border-b border-[var(--hw-line)] px-4 py-3">
                  <div className="text-xs font-semibold tracking-wide uppercase text-[var(--hw-muted)]">{lane.title}</div>
                  <Chip className="border-[var(--hw-line)] bg-[var(--hw-soft)] text-[var(--hw-ink)]">{lane.items.length}</Chip>
                </div>
                <div className="grid gap-1 p-2">
                  {lane.items.map((item) => (
                    <div key={item.id} className="w-full rounded-[calc(var(--hw-radius-lg)-8px)] border border-[var(--hw-line)] bg-white px-3 py-2 text-left">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-[var(--hw-ink)]">{item.label}</div>
                          {item.note ? <div className="mt-0.5 truncate text-xs text-[var(--hw-muted)]">{item.note}</div> : null}
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-sm font-semibold text-[var(--hw-ink)]">{typeof item.price === "number" ? item.price.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }) : "—"}</div>
                          <div className="text-[11px] text-[var(--hw-muted)]">{item.range || "—"}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
