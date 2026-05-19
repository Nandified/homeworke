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
                <div className="text-sm font-semibold text-[var(--hw-ink)]">Scope</div>
                <div className="mt-3 whitespace-pre-wrap text-sm text-[var(--hw-ink)]">{wo.issueDescription || "—"}</div>
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
