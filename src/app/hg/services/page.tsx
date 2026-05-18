"use client";
import { HG_NAV } from "@/components/hg/nav";

import { useMemo, useState } from "react";

import taxonomy from "@/content/homeworke_services_taxonomy.json";
import { Card, Container, Input, Pill } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";

type TaxService = { trade?: string; label?: string; category?: string };

export default function HomeGuideServicesPage() {
  const trades = useMemo(() => ((taxonomy as any)?.trades || []) as string[], []);
  const services = useMemo(() => (((taxonomy as any)?.services || []) as TaxService[]).filter(Boolean), []);

  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return services.slice(0, 50);
    return services
      .filter((s) => {
        const trade = String(s.trade || "").toLowerCase();
        const label = String(s.label || "").toLowerCase();
        const cat = String(s.category || "").toLowerCase();
        return trade.includes(query) || label.includes(query) || cat.includes(query);
      })
      .slice(0, 100);
  }, [q, services]);

  return (
    <PortalShell role="HG" title="Home Guide" nav={HG_NAV} description="Browse the service taxonomy used by intake, matching, and provider profiles." >
      <Container>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">Services</div>
            <div className="mt-1 text-sm text-[var(--hw-muted)]">Search trades and service labels (read-only in v1).</div>
          </div>
          <div className="w-full max-w-sm">
            <Input value={q} onChange={(e) => setQ(e.currentTarget.value)} placeholder="Search by trade, service, category…" />
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Card className="p-4">
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Trades</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {trades.map((t) => (
                <Pill key={t}>{t}</Pill>
              ))}
            </div>
          </Card>

          <Card className="p-4 lg:col-span-2">
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Services</div>
            <div className="mt-3 grid gap-2">
              {filtered.map((s, idx) => (
                <div key={`${s.trade || ""}:${s.label || ""}:${idx}`} className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--hw-line)] bg-white px-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[var(--hw-ink)]">{String(s.label || "") || "—"}</div>
                    <div className="mt-0.5 truncate text-xs text-[var(--hw-muted)]">{String(s.trade || "")}{s.category ? ` • ${s.category}` : ""}</div>
                  </div>
                </div>
              ))}
              {!filtered.length ? <div className="text-sm text-[var(--hw-muted)]">No matches.</div> : null}
            </div>
          </Card>
        </div>
      </Container>
    </PortalShell>
  );
}
