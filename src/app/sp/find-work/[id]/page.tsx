"use client";
import { SP_NAV } from "@/components/sp/nav";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button, Card, Container, Divider, EmptyState, Pill } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";

type WorkOrder = {
  id: string;
  serviceCategory?: string;
  serviceSubcategory?: string;
  issueDescription?: string;
  propertyAddress?: string;
  preferredDate?: string;
  preferredWindow?: string;
  scopeItems?: Array<{ id: string; name: string; description?: string; qty: number; minCents: number; maxCents: number }>;
};

function fmtDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

export default function ServiceProviderJobDetailsPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const [wo, setWo] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/hg/work-orders/${encodeURIComponent(id)}`);
        const j = (await res.json().catch(() => null)) as any;
        if (!cancelled) setWo(j?.workOrder || null);
      } catch {
        if (!cancelled) setWo(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const title = useMemo(() => {
    const base = wo?.serviceCategory || "Work Order";
    return wo?.serviceSubcategory ? `${base} • ${wo.serviceSubcategory}` : base;
  }, [wo]);

  return (
    <PortalShell role="SP" title="Service Provider" nav={SP_NAV}>
      <Container>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Job Details</div>
            <div className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">{title}</div>
            <div className="mt-2 text-xs font-semibold text-[var(--hw-muted)] font-mono">{id}</div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/sp/find-work" className="no-underline">
              <Button variant="secondary">Back</Button>
            </Link>
            <Link href={`/sp/find-work/${encodeURIComponent(id)}/estimate`} className="no-underline">
              <Button>Create estimate</Button>
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2">
            {loading ? (
              <div className="text-sm text-[var(--hw-muted)]">Loading…</div>
            ) : !wo ? (
              <EmptyState title="Not found" text="This job may have been removed." />
            ) : (
              <>
                <div className="text-sm font-semibold text-[var(--hw-ink)]">Job details</div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--hw-line)]">
                  <div className="grid grid-cols-[1.2fr_2fr_80px_120px_120px] gap-0 bg-[var(--hw-soft)] px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
                    <div>Item</div>
                    <div>Description</div>
                    <div className="text-right">Qty</div>
                    <div className="text-right">Min</div>
                    <div className="text-right">Max</div>
                  </div>
                  {(wo.scopeItems || []).map((it) => (
                    <div key={it.id} className="grid grid-cols-[1.2fr_2fr_80px_120px_120px] gap-0 border-t border-[var(--hw-line)] bg-white px-4 py-3 text-sm">
                      <div className="font-semibold text-[var(--hw-ink)]">{it.name}</div>
                      <div className="text-[var(--hw-muted)]">{it.description || "—"}</div>
                      <div className="text-right text-[var(--hw-muted)]">{it.qty}</div>
                      <div className="text-right font-semibold text-[var(--hw-ink)]">{(it.minCents / 100).toLocaleString(undefined,{style:"currency",currency:"USD"})}</div>
                      <div className="text-right font-semibold text-[var(--hw-ink)]">{(it.maxCents / 100).toLocaleString(undefined,{style:"currency",currency:"USD"})}</div>
                    </div>
                  ))}
                  {(!wo.scopeItems || wo.scopeItems.length === 0) ? (
                    <div className="border-t border-[var(--hw-line)] bg-white px-4 py-3 text-sm text-[var(--hw-muted)]">No scope items.</div>
                  ) : null}
                </div>

                <Divider className="my-5" />

                <div className="text-sm font-semibold text-[var(--hw-ink)]">Notes</div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-[var(--hw-ink)]">{wo.issueDescription || "—"}</div>

                <Divider className="my-5" />
                <div className="text-sm font-semibold text-[var(--hw-ink)]">Property</div>
                <div className="mt-2 text-sm text-[var(--hw-muted)]">{wo.propertyAddress || "—"}</div>
              </>
            )}
          </Card>

          <Card className="p-5">
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Timing</div>
            <div className="mt-3 grid gap-2 text-sm">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Possible Start Date</div>
                <div className="mt-1 font-semibold text-[var(--hw-ink)]">{wo?.preferredDate ? fmtDate(wo.preferredDate) : "—"}</div>
                {wo?.preferredWindow ? <div className="mt-1 text-xs text-[var(--hw-muted)]">{wo.preferredWindow}</div> : null}
              </div>
              <Divider className="my-2" />
              <div className="text-xs text-[var(--hw-muted)]">Next: mirror legacy line-items view (min/max ranges). For now, this pulls from the same WorkOrder record.</div>
            </div>
          </Card>
        </div>
      </Container>
    </PortalShell>
  );
}
