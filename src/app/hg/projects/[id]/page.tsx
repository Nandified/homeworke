"use client";
import { HG_NAV } from "@/components/hg/nav";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button, Card, Container, Divider, EmptyState, Input, Label, Pill, Textarea } from "@/components/ui";
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
  scopeText?: string;
  selectedEstimateId?: string;
  appointments?: Array<{ id: string; trade: string; preferredDate?: string; preferredWindow?: string; status?: string }>;
};

type Estimate = {
  id: string;
  createdAt: string;
  providerName: string;
  totalCents: number;
  status: "sent" | "replaced";
  expiresAt?: string;
};

type Document = {
  id: string;
  createdAt: string;
  title: string;
  url: string;
};

function fmtDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function money(cents: number) {
  try {
    return (cents / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

export default function HomeGuideProjectDetailPage({ params }: { params: { id: string } }) {
  const id = params.id;

  const [wo, setWo] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const [estimates, setEstimates] = useState<Estimate[] | null>(null);
  const [documents, setDocuments] = useState<Document[] | null>(null);

  const [scopeDraft, setScopeDraft] = useState("");
  const [savingScope, setSavingScope] = useState(false);

  const [docTitle, setDocTitle] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [addingDoc, setAddingDoc] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const [woRes, estRes, docRes] = await Promise.all([
        fetch(`/api/hg/work-orders/${encodeURIComponent(id)}`),
        fetch(`/api/hg/work-orders/${encodeURIComponent(id)}/estimates?demo=1`),
        fetch(`/api/hg/work-orders/${encodeURIComponent(id)}/documents?demo=1`),
      ]);
      const woJson = (await woRes.json().catch(() => null)) as any;
      const estJson = (await estRes.json().catch(() => null)) as any;
      const docJson = (await docRes.json().catch(() => null)) as any;

      const w = woJson?.workOrder || null;
      setWo(w);
      setEstimates(Array.isArray(estJson?.estimates) ? (estJson.estimates as Estimate[]) : []);
      setDocuments(Array.isArray(docJson?.documents) ? (docJson.documents as Document[]) : []);
      setScopeDraft(String(w?.scopeText || ""));
    } catch {
      setWo(null);
      setEstimates([]);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await reload();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

                <Divider className="my-6" />

                <div className="text-sm font-semibold text-[var(--hw-ink)]">Project Scope</div>
                <div className="mt-2 text-sm text-[var(--hw-muted)]">Edit internal scope notes (Home Guide).</div>
                <div className="mt-3 grid gap-2">
                  <Textarea value={scopeDraft} onChange={(e) => setScopeDraft(e.currentTarget.value)} placeholder="Add scope notes, assumptions, and details…" />
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setScopeDraft(String(wo.scopeText || ""))}
                    >
                      Reset
                    </Button>
                    <Button
                      size="sm"
                      disabled={savingScope}
                      onClick={async () => {
                        if (!wo) return;
                        setSavingScope(true);
                        try {
                          await fetch(`/api/hg/work-orders/${encodeURIComponent(id)}`, {
                            method: "POST",
                            headers: { "content-type": "application/json" },
                            body: JSON.stringify({ action: "set_scope", scopeText: scopeDraft }),
                          }).catch(() => null);

                          // Demo-store write (until DB wiring): update local wo state.
                          setWo((prev) => (prev ? { ...prev, scopeText: scopeDraft } : prev));
                        } finally {
                          setSavingScope(false);
                        }
                      }}
                    >
                      {savingScope ? "Saving…" : "Save scope"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>

          <div className="grid gap-4">
            <Card className="p-5">
              <div className="text-sm font-semibold text-[var(--hw-ink)]">Visit Appointment</div>
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

                  <Divider />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Status</div>
                      <div className="mt-1">
                        {wo.appointments?.[0]?.status ? <StatusChip>{wo.appointments[0].status}</StatusChip> : <span className="text-[var(--hw-muted)]">—</span>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={async () => {
                          await fetch(`/api/hg/work-orders/${encodeURIComponent(id)}`, {
                            method: "POST",
                            headers: { "content-type": "application/json" },
                            body: JSON.stringify({ action: "set_visit_status", visitStatus: "DONE" }),
                          });
                          await reload();
                        }}
                      >
                        Mark visit completed
                      </Button>
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={async () => {
                          await fetch(`/api/hg/work-orders/${encodeURIComponent(id)}`, {
                            method: "POST",
                            headers: { "content-type": "application/json" },
                            body: JSON.stringify({ action: "set_visit_status", visitStatus: "CANCELED" }),
                          });
                          await reload();
                        }}
                      >
                        Mark visit skipped
                      </Button>
                    </div>
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
                </div>
              ) : (
                <div className="mt-3 text-sm text-[var(--hw-muted)]">—</div>
              )}
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-[var(--hw-ink)]">Estimates</div>
                {wo?.selectedEstimateId ? <Pill>Selected</Pill> : null}
              </div>
              <div className="mt-3 grid gap-2">
                {estimates === null ? (
                  <div className="text-sm text-[var(--hw-muted)]">Loading…</div>
                ) : estimates.length === 0 ? (
                  <div className="text-sm text-[var(--hw-muted)]">No estimates yet.</div>
                ) : (
                  estimates.map((e) => {
                    const selected = wo?.selectedEstimateId === e.id;
                    return (
                      <div key={e.id} className={"rounded-2xl border bg-white p-3 " + (selected ? "border-[rgba(229,57,53,.35)]" : "border-[var(--hw-line)]") }>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold text-[var(--hw-ink)]">{e.providerName}</div>
                            <div className="mt-0.5 text-xs text-[var(--hw-muted)]">{money(e.totalCents)} • {e.status}{e.expiresAt ? ` • expires ${new Date(e.expiresAt).toLocaleDateString()}` : ""}</div>
                          </div>
                          {selected ? <StatusChip className="border-[rgba(229,57,53,.25)] bg-[rgba(229,57,53,.06)] text-[var(--hw-red)]">Selected</StatusChip> : null}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Button
                            size="xs"
                            variant="secondary"
                            onClick={() => window.open("/", "_blank")}
                          >
                            Download
                          </Button>
                          <Button
                            size="xs"
                            onClick={async () => {
                              await fetch(`/api/hg/work-orders/${encodeURIComponent(id)}/estimates`, {
                                method: "POST",
                                headers: { "content-type": "application/json" },
                                body: JSON.stringify({ demo: true, action: "select", estimateId: e.id }),
                              });
                              await reload();
                            }}
                          >
                            Select on behalf of client
                          </Button>
                          <Button
                            size="xs"
                            variant="destructive"
                            onClick={async () => {
                              if (!window.confirm("Replace this bid?")) return;
                              await fetch(`/api/hg/work-orders/${encodeURIComponent(id)}/estimates`, {
                                method: "POST",
                                headers: { "content-type": "application/json" },
                                body: JSON.stringify({ demo: true, action: "replace", estimateId: e.id }),
                              });
                              await reload();
                            }}
                          >
                            Replace bid
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>

            <Card className="p-5">
              <div className="text-sm font-semibold text-[var(--hw-ink)]">Project Documents</div>
              <div className="mt-2 text-sm text-[var(--hw-muted)]">Attach links to documents (v1).</div>
              <div className="mt-3 grid gap-2">
                <div className="grid gap-1.5">
                  <Label>Title</Label>
                  <Input value={docTitle} onChange={(e) => setDocTitle(e.currentTarget.value)} placeholder="Inspection report" />
                </div>
                <div className="grid gap-1.5">
                  <Label>URL</Label>
                  <Input value={docUrl} onChange={(e) => setDocUrl(e.currentTarget.value)} placeholder="https://…" />
                </div>
                <Button
                  size="sm"
                  disabled={addingDoc || !docTitle.trim() || !docUrl.trim()}
                  onClick={async () => {
                    setAddingDoc(true);
                    try {
                      await fetch(`/api/hg/work-orders/${encodeURIComponent(id)}/documents`, {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ demo: true, action: "add", title: docTitle.trim(), url: docUrl.trim() }),
                      });
                      setDocTitle("");
                      setDocUrl("");
                      await reload();
                    } finally {
                      setAddingDoc(false);
                    }
                  }}
                >
                  {addingDoc ? "Adding…" : "+ Add document"}
                </Button>

                <Divider className="my-2" />

                {documents === null ? (
                  <div className="text-sm text-[var(--hw-muted)]">Loading…</div>
                ) : documents.length === 0 ? (
                  <div className="text-sm text-[var(--hw-muted)]">No documents yet.</div>
                ) : (
                  <div className="grid gap-2">
                    {documents.map((d) => (
                      <a key={d.id} href={d.url} target="_blank" rel="noreferrer" className="rounded-2xl border border-[var(--hw-line)] bg-white px-4 py-3 no-underline hover:bg-[var(--hw-soft)]">
                        <div className="text-sm font-semibold text-[var(--hw-ink)]">{d.title}</div>
                        <div className="mt-0.5 truncate text-xs text-[var(--hw-muted)]">{d.url}</div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </PortalShell>
  );
}
