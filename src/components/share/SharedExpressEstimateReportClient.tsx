"use client";

import { useMemo, useState } from "react";

import { Button, Card, Chip, EmptyState, Input, Modal, Picker } from "@/components/ui";
import type { ReportShareLaneV1, ReportSharePayloadV1 } from "@/lib/share-token";
import { Download } from "lucide-react";

export function SharedExpressEstimateReportClient(props: { token: string; payload: ReportSharePayloadV1 }) {
  const [downloading, setDownloading] = useState<"" | "full" | "selected">("");
  const [toast, setToast] = useState<string>("");

  const [leadOpen, setLeadOpen] = useState(false);
  const [leadEmail, setLeadEmail] = useState("");
  const [leadRole, setLeadRole] = useState("");
  const [leadBusy, setLeadBusy] = useState(false);
  const [pendingMode, setPendingMode] = useState<null | "full" | "selected">(null);

  const leadStorageKey = `hw_share_lead_v1:${props.payload.reportId}`;
  const leadCaptured = useMemo(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(leadStorageKey) === "1";
    } catch {
      return false;
    }
  }, [leadStorageKey]);

  function parseMoneyToNumber(raw: string): number | null {
    const s = (raw || "").toLowerCase().replace(/\s+/g, " ").trim();
    if (!s) return null;
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

  const baseLanes = useMemo<ReportShareLaneV1[]>(() => {
    return Array.isArray(props.payload.lanes) && props.payload.lanes.length ? props.payload.lanes : [];
  }, [props.payload.lanes]);

  const selectedIds = new Set(props.payload.selectedIds || []);

  const lanes = useMemo(() => {
    if (props.payload.mode === "selected") {
      return baseLanes
        .map((lane) => ({ ...lane, items: lane.items.filter((it) => selectedIds.has(it.id)) }))
        .filter((l) => l.items.length);
    }
    return baseLanes;
  }, [baseLanes, props.payload.mode]);

  const totals = useMemo(() => {
    const items = lanes.flatMap((l) => l.items);
    const nums = items.map(estimateItemValue).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    const total = nums.reduce((a, b) => a + b, 0);
    return { count: items.length, total };
  }, [lanes]);

  async function download(mode: "full" | "selected") {
    // Lead capture gate: ask for email + role on first download.
    if (!leadCaptured) {
      setPendingMode(mode);
      setLeadOpen(true);
      return;
    }

    try {
      setDownloading(mode);
      setToast(mode === "full" ? "Preparing report…" : "Preparing selected report…");

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

      <Modal
        open={leadOpen}
        title="Download report"
        mobilePlacement="center"
        onClose={() => {
          if (leadBusy) return;
          setLeadOpen(false);
          setPendingMode(null);
        }}
      >
        <div className="grid gap-4">
          <div className="text-sm text-[var(--hw-muted)]">Enter your email to view this report with more details.</div>

          <div className="grid gap-2">
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Email</div>
            <Input value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} placeholder="you@email.com" inputMode="email" autoComplete="email" />
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-semibold text-[var(--hw-ink)]">I am a…</div>
            <Picker
              value={leadRole}
              placeholder="Select one"
              options={[
                { id: "Homeowner", label: "Homeowner" },
                { id: "Homebuyer", label: "Homebuyer" },
                { id: "Listing Agent", label: "Listing Agent" },
                { id: "Buyer's Agent", label: "Buyer's Agent" },
                { id: "Assistant", label: "Assistant" },
                { id: "Buyer's Closing Coordinator", label: "Buyer's Closing Coordinator" },
                { id: "Seller's Closing Coordinator", label: "Seller's Closing Coordinator" },
                { id: "Contractor / Vendor", label: "Contractor / Vendor" },
                { id: "Other", label: "Other" },
              ]}
              onChange={setLeadRole}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              className="min-w-[160px]"
              disabled={!leadEmail || !leadEmail.includes("@") || leadBusy || !pendingMode}
              onClick={async () => {
                if (!pendingMode) return;
                setLeadBusy(true);
                try {
                  await fetch("/api/express-estimate/share/lead", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                      token: props.token,
                      reportId: props.payload.reportId,
                      email: leadEmail,
                      role: leadRole,
                      source: "download",
                    }),
                  }).catch(() => null);

                  try {
                    window.localStorage.setItem(leadStorageKey, "1");
                  } catch {}

                  setLeadOpen(false);
                  const m = pendingMode;
                  setPendingMode(null);
                  // Proceed to download
                  void download(m);
                } finally {
                  setLeadBusy(false);
                }
              }}
            >
              {leadBusy ? "Downloading…" : "Download report"}
            </Button>
          </div>
        </div>
      </Modal>

      <Card className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Instant estimate</div>
            <div className="mt-1 text-sm font-semibold text-[var(--hw-ink)]">
              {props.payload.client?.name ? `${props.payload.client.name} — ` : ""}
              {props.payload.address || "Shared Express Estimate"}
            </div>
            {props.payload.recipient?.name || props.payload.recipient?.role ? (
              <div className="mt-1 text-sm text-[var(--hw-muted)]">
                Shared with {props.payload.recipient?.name || ""}
                {props.payload.recipient?.role ? ` • ${props.payload.recipient.role}` : ""}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {props.payload.mode === "selected" ? (
              <Button
                size="sm"
                variant="secondary"
                disabled={(props.payload.selectedIds || []).length === 0 || downloading !== ""}
                onClick={() => download("selected")}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                {downloading === "selected" ? "Preparing…" : "Download report"}
              </Button>
            ) : (
              <Button size="sm" disabled={downloading !== ""} onClick={() => download("full")} className="gap-2">
                <Download className="h-4 w-4" />
                {downloading === "full" ? "Preparing…" : "Download report"}
              </Button>
            )}
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
                          <div className="text-sm font-semibold text-[var(--hw-ink)]">
                            {typeof item.price === "number" ? formatUSD(item.price) : "—"}
                          </div>
                          <div className="text-[11px] text-[var(--hw-muted)]">{item.range || "—"}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="rounded-[var(--hw-radius-lg)] border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.06)] p-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Instant estimate total</div>
                  <div className="mt-1 text-3xl font-extrabold tracking-tight text-[var(--hw-ink)]">{formatUSD(totals.total)}</div>
                </div>
                <div className="text-xs text-[var(--hw-muted)]">
                  Based on {totals.count} item{totals.count === 1 ? "" : "s"} (avg of ranges when needed).
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
