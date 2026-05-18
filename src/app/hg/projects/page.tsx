"use client";
import { HG_NAV } from "@/components/hg/nav";

import { useEffect, useMemo, useState } from "react";

import { Container, EmptyState, Input } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { ListRow, StatusChip } from "@/components/dashboard/ListRow";

type WorkOrder = {
  id: string;
  createdAt: string;
  serviceCategory?: string;
  serviceSubcategory?: string;
  issueDescription?: string;
  propertyAddress?: string;
  clientName?: string;
  status?: string;
};

function fmtDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function HomeGuideProjectsPage() {
  const [items, setItems] = useState<WorkOrder[] | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/hg/work-orders/recent?limit=200");
        const j = (await res.json()) as { ok: boolean; workOrders?: WorkOrder[] };
        if (!res.ok || !j.ok) throw new Error("failed");
        if (!cancelled) setItems(j.workOrders || []);
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
    const want = status === "all" ? "" : status;

    return (items || []).filter((w) => {
      const s = String(w.status || "").toLowerCase();
      if (want && s !== want) return false;
      if (!query) return true;

      const hay = [w.serviceCategory, w.serviceSubcategory, w.propertyAddress, w.clientName, w.issueDescription, w.id]
        .filter(Boolean)
        .map((x) => String(x).toLowerCase())
        .join(" | ");
      return hay.includes(query);
    });
  }, [items, q, status]);

  const statuses = useMemo(() => {
    const set = new Set<string>();
    for (const w of items || []) {
      const s = String(w.status || "").toLowerCase();
      if (s) set.add(s);
    }
    return ["all", ...Array.from(set).sort()];
  }, [items]);

  return (
    <PortalShell role="HG" title="Home Guide" nav={HG_NAV} description="Projects = work orders across the platform. Review, route, and keep things moving." >
      <Container>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">My Projects</div>
            <div className="mt-1 text-sm text-[var(--hw-muted)]">Newest work orders first (from Homeowner + Real Estate Pro submissions).</div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Input value={q} onChange={(e) => setQ(e.currentTarget.value)} placeholder="Search address, client, trade, id…" className="sm:w-[320px]" />
            <select
              value={status}
              onChange={(e) => setStatus(e.currentTarget.value)}
              className="h-11 rounded-[var(--hw-radius-sm)] border border-[var(--hw-line)] bg-white px-3 text-sm"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All statuses" : s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6">
          <DashboardSection title="Work orders" count={items === null ? "—" : filtered.length}>
            <div className="grid gap-2">
              {items === null ? (
                <div className="text-sm text-[var(--hw-muted)]">Loading…</div>
              ) : filtered.length === 0 ? (
                <EmptyState title="No matching work orders" text="Once Homeowners / Real Estate Pros submit work, it will show here." />
              ) : (
                filtered.slice(0, 100).map((w) => (
                  <ListRow
                    key={w.id}
                    href={`/hg/projects/${w.id}`}
                    title={w.serviceSubcategory ? `${w.serviceCategory || "Work Order"} • ${w.serviceSubcategory}` : w.serviceCategory || "Work Order"}
                    subtitle={w.propertyAddress || w.clientName || w.id}
                    footnote={w.issueDescription ? String(w.issueDescription).slice(0, 140) : undefined}
                    badge={w.status ? <StatusChip>{w.status}</StatusChip> : null}
                    meta={fmtDate(w.createdAt)}
                  />
                ))
              )}
            </div>
          </DashboardSection>
        </div>
      </Container>
    </PortalShell>
  );
}
