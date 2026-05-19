"use client";
import { SP_NAV } from "@/components/sp/nav";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button, Card, Container, EmptyState, Input, Pill } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";

type Opportunity = {
  id: string;
  zip: string;
  orderNo: string;
  tags: string[];
  minCents: number;
  maxCents: number;
  possibleStartDate?: string;
  slotsAvailable: number;
  slotsTotal: number;
};

function money(cents: number) {
  try {
    return (cents / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

export default function ServiceProviderFindWorkPage() {
  const [available, setAvailable] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem("hw_sp_available") === "1";
    } catch {
      return false;
    }
  });

  const [items, setItems] = useState<Opportunity[] | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/sp/opportunities?limit=50&demo=1");
        const j = (await res.json().catch(() => null)) as any;
        if (!cancelled) setItems(Array.isArray(j?.opportunities) ? (j.opportunities as Opportunity[]) : []);
      } catch {
        if (!cancelled) setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items || [];
    return (items || []).filter((o) => {
      const hay = [o.zip, o.orderNo, ...(o.tags || [])].filter(Boolean).join(" | ").toLowerCase();
      return hay.includes(query);
    });
  }, [items, q]);

  return (
    <PortalShell role="SP" title="Service Provider" nav={SP_NAV} description="Hi — your next opportunity awaits." >
      <Container>
        <div className="grid gap-4">
          <Card className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-[var(--hw-ink)]">Find Work</div>
                <div className="mt-1 text-sm text-[var(--hw-muted)]">Turn on availability to receive matching alerts.</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm font-semibold text-[var(--hw-ink)]">I’m available to work</div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !available;
                    setAvailable(next);
                    try {
                      window.localStorage.setItem("hw_sp_available", next ? "1" : "0");
                    } catch {}
                  }}
                  className={
                    "relative h-7 w-12 rounded-full border transition " +
                    (available
                      ? "border-[rgba(16,185,129,.35)] bg-[rgba(16,185,129,.18)]"
                      : "border-[var(--hw-line)] bg-[var(--hw-soft)]")
                  }
                  aria-pressed={available}
                >
                  <span
                    className={
                      "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-all " +
                      (available ? "left-[calc(100%-26px)]" : "left-0.5")
                    }
                  />
                </button>
                <Pill>{available ? "On" : "Off"}</Pill>
              </div>
            </div>

            <div className="mt-4">
              <Input value={q} onChange={(e) => setQ(e.currentTarget.value)} placeholder="Search by zip, order, tag…" />
            </div>
          </Card>

          {items === null ? (
            <div className="text-sm text-[var(--hw-muted)]">Loading…</div>
          ) : filtered.length === 0 ? (
            <EmptyState title="No opportunities" text="When new jobs are available, they’ll show here." />
          ) : (
            <div className="grid gap-3">
              {filtered.map((o) => {
                const pct = Math.max(0, Math.min(100, Math.round(((o.slotsTotal - o.slotsAvailable) / o.slotsTotal) * 100)));
                return (
                  <Card key={o.id} className="p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--hw-muted)]">
                          <span className="text-amber-700">🔥</span>
                          <span>
                            {o.slotsAvailable}/{o.slotsTotal} slots Available
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <div className="text-3xl font-extrabold tracking-tight text-[var(--hw-ink)]">{o.zip}</div>
                          <div className="text-sm font-semibold text-[var(--hw-muted)]">Order #{o.orderNo}</div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {(o.tags || []).slice(0, 6).map((t) => (
                            <Pill key={t}>{t}</Pill>
                          ))}
                        </div>

                        <div className="mt-4 grid gap-1 text-sm">
                          <div className="text-[var(--hw-muted)]">Estimated Price</div>
                          <div className="font-semibold text-[var(--hw-ink)]">
                            {money(o.minCents)} – {money(o.maxCents)}
                          </div>
                          <div className="mt-2 text-[var(--hw-muted)]">Possible Start Date</div>
                          <div className="font-semibold text-[var(--hw-ink)]">{o.possibleStartDate || "—"}</div>
                        </div>

                        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-[var(--hw-soft)]">
                          <div className="h-full rounded-full bg-[rgba(16,185,129,.55)]" style={{ width: `${pct}%` }} />
                        </div>
                      </div>

                      <div className="shrink-0">
                        <Link href={`/sp/find-work/${encodeURIComponent(o.id)}`} className="no-underline">
                          <Button variant="secondary">Job Details</Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </Container>
    </PortalShell>
  );
}
