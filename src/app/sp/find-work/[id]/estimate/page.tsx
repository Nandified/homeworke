"use client";
import { SP_NAV } from "@/components/sp/nav";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button, Card, Container, Divider, EmptyState, Input, Label, Pill, Textarea } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";

type EstimateItem = {
  id: string;
  name: string;
  description: string;
  qty: number;
  priceCents: number;
};

function money(cents: number) {
  try {
    return (cents / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

function storageKey(jobId: string) {
  return `hw_sp_estimate_draft_${jobId}`;
}

export default function ServiceProviderCreateEstimatePage({ params }: { params: { id: string } }) {
  const jobId = params.id;

  const [startDate, setStartDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [items, setItems] = useState<EstimateItem[]>([]);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey(jobId));
      if (!raw) return;
      const j = JSON.parse(raw) as any;
      if (j?.startDate) setStartDate(String(j.startDate));
      if (j?.expiryDate) setExpiryDate(String(j.expiryDate));
      if (Array.isArray(j?.items)) setItems(j.items as EstimateItem[]);
    } catch {
      // ignore
    }
  }, [jobId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey(jobId), JSON.stringify({ startDate, expiryDate, items }));
    } catch {
      // ignore
    }
  }, [jobId, startDate, expiryDate, items]);

  const totalCents = useMemo(() => items.reduce((sum, it) => sum + (it.priceCents || 0) * (it.qty || 1), 0), [items]);
  const feeCents = useMemo(() => Math.round(totalCents * 0.2), [totalCents]);

  return (
    <PortalShell role="SP" title="Service Provider" nav={SP_NAV} description="Create and submit your estimate." >
      <Container>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Estimate</div>
            <div className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">Create estimate</div>
            <div className="mt-2 text-xs font-mono text-[var(--hw-muted)]">Job: {jobId}</div>
          </div>
          <Link href={`/sp/find-work/${encodeURIComponent(jobId)}`} className="no-underline">
            <Button variant="secondary">Back to job</Button>
          </Link>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2">
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Estimate details</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Possible Start Date</Label>
                <Input value={startDate} onChange={(e) => setStartDate(e.currentTarget.value)} placeholder="MM/DD/YYYY" />
              </div>
              <div className="grid gap-1.5">
                <Label>Expiry Date</Label>
                <Input value={expiryDate} onChange={(e) => setExpiryDate(e.currentTarget.value)} placeholder="MM/DD/YYYY" />
              </div>
            </div>

            <Divider className="my-5" />

            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[var(--hw-ink)]">Create estimate items</div>
                <div className="mt-1 text-sm text-[var(--hw-muted)]">Platform fee: 20% (shown for transparency).</div>
              </div>
              <Pill>{money(totalCents)} total</Pill>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="grid gap-1.5">
                <Label>Item name</Label>
                <Input value={name} onChange={(e) => setName(e.currentTarget.value)} placeholder="Garage door repair" />
              </div>
              <div className="grid gap-1.5">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.currentTarget.value)} placeholder="Describe the work, materials, and assumptions…" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>Quantity</Label>
                  <Input value={qty} onChange={(e) => setQty(e.currentTarget.value)} placeholder="1" />
                </div>
                <div className="grid gap-1.5">
                  <Label>Price ($)</Label>
                  <Input value={price} onChange={(e) => setPrice(e.currentTarget.value)} placeholder="400" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                {editingItemId ? (
                  <div className="mr-auto text-xs font-medium text-[var(--hw-muted)]">Editing item…</div>
                ) : null}

                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditingItemId(null);
                    setName("");
                    setDescription("");
                    setQty("1");
                    setPrice("");
                  }}
                >
                  {editingItemId ? "Cancel" : "Reset"}
                </Button>

                <Button
                  onClick={() => {
                    const n = name.trim();
                    const d = description.trim();
                    const q = Math.max(1, Math.min(999, Number(qty || 1) || 1));
                    const dollars = Number(String(price).replace(/[^0-9.]/g, ""));
                    const cents = Math.round((Number.isFinite(dollars) ? dollars : 0) * 100);
                    if (!n || !cents) return;

                    if (editingItemId) {
                      setItems((prev) =>
                        prev.map((x) =>
                          x.id === editingItemId
                            ? {
                                ...x,
                                name: n,
                                description: d,
                                qty: q,
                                priceCents: cents,
                              }
                            : x,
                        ),
                      );
                    } else {
                      setItems((prev) => [
                        {
                          id: `it_${Math.random().toString(36).slice(2, 9)}`,
                          name: n,
                          description: d,
                          qty: q,
                          priceCents: cents,
                        },
                        ...prev,
                      ]);
                    }

                    setEditingItemId(null);
                    setName("");
                    setDescription("");
                    setQty("1");
                    setPrice("");
                  }}
                  disabled={!name.trim() || !price.trim()}
                >
                  {editingItemId ? "Update item" : "Save item"}
                </Button>
              </div>
            </div>

            <Divider className="my-5" />

            <div className="text-sm font-semibold text-[var(--hw-ink)]">Items</div>
            <div className="mt-3 grid gap-2">
              {items.length === 0 ? (
                <EmptyState title="No items yet" text="Add at least one item to submit your estimate." />
              ) : (
                items.map((it) => (
                  <div key={it.id} className="rounded-2xl border border-[var(--hw-line)] bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[var(--hw-ink)]">{it.name}</div>
                        {it.description ? <div className="mt-1 text-sm text-[var(--hw-muted)]">{it.description}</div> : null}
                        <div className="mt-2 text-xs text-[var(--hw-muted)]">Qty: {it.qty} • {money(it.priceCents)} each</div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          size="xs"
                          variant="secondary"
                          onClick={() => {
                            setEditingItemId(it.id);
                            setName(it.name);
                            setDescription(it.description || "");
                            setQty(String(it.qty || 1));
                            setPrice(String((it.priceCents || 0) / 100));
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          variant="destructive"
                          onClick={() => {
                            setItems((prev) => prev.filter((x) => x.id !== it.id));
                            if (editingItemId === it.id) {
                              setEditingItemId(null);
                              setName("");
                              setDescription("");
                              setQty("1");
                              setPrice("");
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Summary</div>
            <div className="mt-4 grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--hw-muted)]">Subtotal</span>
                <span className="font-semibold text-[var(--hw-ink)]">{money(totalCents)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--hw-muted)]">Platform fee (20%)</span>
                <span className="font-semibold text-[var(--hw-ink)]">{money(feeCents)}</span>
              </div>
              <Divider className="my-2" />
              <div className="flex items-center justify-between">
                <span className="text-[var(--hw-muted)]">Total (est.)</span>
                <span className="text-lg font-extrabold tracking-tight text-[var(--hw-ink)]">{money(totalCents + feeCents)}</span>
              </div>

              <Divider className="my-3" />

              <Button
                disabled={!items.length}
                onClick={async () => {
                  // Demo submit: persist to the server-side demo store so it appears in My Jobs.
                  await fetch("/api/sp/estimates", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                      demo: true,
                      workOrderId: jobId,
                      startDate,
                      expiryDate,
                      items,
                      totalCents,
                    }),
                  });

                  try {
                    window.localStorage.removeItem(storageKey(jobId));
                  } catch {}

                  window.location.href = "/sp/my-jobs";
                }}
              >
                Submit estimate (demo)
              </Button>
              <div className="mt-2 text-xs text-[var(--hw-muted)]">Submitting will add this job to My Jobs (demo mode).</div>
            </div>
          </Card>
        </div>
      </Container>
    </PortalShell>
  );
}
