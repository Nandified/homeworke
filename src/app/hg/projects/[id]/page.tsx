"use client";
import { HG_NAV } from "@/components/hg/nav";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button, Card, Container, Divider, EmptyState } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";
import { StatusChip } from "@/components/dashboard/ListRow";

type WorkOrder = {
  id: string;
  createdAt: string;
  serviceCategory?: string;
  serviceSubcategory?: string;
  issueDescription?: string;
  urgencyLevel?: string;
  propertyAddress?: string;
  propertyType?: string;
  preferredDate?: string;
  preferredWindow?: string;
  clientName?: string;
  originPartnerId?: string | null;
  shareWithPartner?: boolean | null;
  status?: string;
  appointments?: Array<{ id: string; trade: string; preferredDate?: string; preferredWindow?: string; status?: string }>;
};

function fmtDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function HomeGuideProjectDetailPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const [wo, setWo] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/hg/work-orders/${encodeURIComponent(id)}`);
        const j = (await res.json()) as { ok: boolean; workOrder?: WorkOrder };
        if (!res.ok || !j.ok || !j.workOrder) throw new Error("not_found");
        if (!cancelled) setWo(j.workOrder);
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
    if (!wo) return "Project";
    const base = wo.serviceCategory || "Work Order";
    return wo.serviceSubcategory ? `${base} • ${wo.serviceSubcategory}` : base;
  }, [wo]);

  return (
    <PortalShell role="HG" title="Home Guide" nav={HG_NAV}>
      <Container>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Project</div>
            <div className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">{title}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--hw-muted)]">
              <span className="font-mono text-xs">{id}</span>
              {wo?.status ? <StatusChip>{wo.status}</StatusChip> : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/hg/projects" className="no-underline">
              <Button variant="secondary">Back</Button>
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2">
            {loading ? (
              <div className="text-sm text-[var(--hw-muted)]">Loading…</div>
            ) : !wo ? (
              <EmptyState title="Not found" text="This work order may have been removed." />
            ) : (
              <>
                <div className="text-sm font-semibold text-[var(--hw-ink)]">Summary</div>
                <div className="mt-3 grid gap-3 text-sm">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Client</div>
                    <div className="mt-1 text-[var(--hw-ink)]">{wo.clientName || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Property</div>
                    <div className="mt-1 text-[var(--hw-ink)]">{wo.propertyAddress || "—"}</div>
                    {wo.propertyType ? <div className="mt-1 text-xs text-[var(--hw-muted)]">{wo.propertyType}</div> : null}
                  </div>

                  <Divider />

                  <div>
                    <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Issue</div>
                    <div className="mt-1 whitespace-pre-wrap text-[var(--hw-ink)]">{wo.issueDescription || "—"}</div>
                  </div>
                </div>
              </>
            )}
          </Card>

          <Card className="p-5">
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Scheduling</div>
            {wo ? (
              <div className="mt-3 grid gap-3 text-sm">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Preferred</div>
                  <div className="mt-1 text-[var(--hw-ink)]">{wo.preferredDate ? `${wo.preferredDate} • ${wo.preferredWindow || ""}` : "—"}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Created</div>
                  <div className="mt-1 text-[var(--hw-ink)]">{fmtDate(wo.createdAt)}</div>
                </div>
                {Array.isArray(wo.appointments) && wo.appointments.length ? (
                  <>
                    <Divider />
                    <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Appointments</div>
                    <div className="grid gap-2">
                      {wo.appointments.map((a) => (
                        <div key={a.id} className="rounded-2xl border border-[var(--hw-line)] bg-white p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-sm font-semibold text-[var(--hw-ink)]">{a.trade}</div>
                            {a.status ? <StatusChip>{a.status}</StatusChip> : null}
                          </div>
                          <div className="mt-1 text-xs text-[var(--hw-muted)]">{a.preferredDate ? `${a.preferredDate} • ${a.preferredWindow || ""}` : "—"}</div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}

                <Divider />

                <div className="text-xs text-[var(--hw-muted)]">
                  Next: connect this to Home Guide actions (confirm schedule, route to SP, open message thread). This detail page is already reading the same work orders created by Homeowner/Pro submissions.
                </div>
              </div>
            ) : (
              <div className="mt-3 text-sm text-[var(--hw-muted)]">—</div>
            )}
          </Card>
        </div>
      </Container>
    </PortalShell>
  );
}
