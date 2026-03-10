"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button, Card, EmptyState, Pill, StatTile } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";

const nav = [
  { href: "/ho/dashboard", label: "Dashboard" },
  { href: "/ho/messages", label: "Messages" },
  { href: "/ho/properties", label: "My Properties" },
  { href: "/ho/pro-team", label: "Pro Team" },
  { href: "/ho/support", label: "Support" },
  { href: "/ho/account", label: "My Account" },
];

type Session = {
  token: string;
  jobId: string;
  workOrderId?: string;
  email: string;
  service: string;
  providerName: string;
  date: string;
  window: string;
  partner: null | { partnerId: string; partnerName: string };
  shareWithPartner: boolean | null;
};

type WorkOrder = {
  id: string;
  createdAt: string;
  serviceCategory: string;
  serviceSubcategory?: string;
  issueDescription?: string;
  propertyAddress?: string;
  preferredDate?: string;
  preferredWindow?: string;
  status: string;
};

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem("hw_session_v1");
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export default function Page() {
  const [session, setSession] = useState<Session | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[] | null>(null);

  useEffect(() => {
    const s = loadSession();
    setSession(s);
    if (!s?.token) return;

    (async () => {
      try {
        const res = await fetch(`/api/work-orders?token=${encodeURIComponent(s.token)}`);
        const data = (await res.json()) as { ok: boolean; workOrders?: WorkOrder[] };
        if (!res.ok || !data.ok) {
          setWorkOrders([]);
          return;
        }
        setWorkOrders(data.workOrders || []);
      } catch {
        setWorkOrders([]);
      }
    })();
  }, []);

  const latest = useMemo(() => (workOrders && workOrders.length ? workOrders[0] : null), [workOrders]);

  return (
    <PortalShell role="HO" title="Homeowner" nav={nav}>
      <div className="grid gap-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <StatTile label="Active services" value={String(workOrders?.length ?? 0)} note="Work orders in your dashboard." />
          <StatTile label="Status" value={latest?.status ? String(latest.status) : "—"} note="Latest request." />
          <StatTile label="Partner" value={session?.partner?.partnerName || "—"} note="Shown only when attached." />
        </div>

        {workOrders && workOrders.length ? (
          <Card className="p-6 md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm font-semibold">Your work orders</div>
              <Pill>{workOrders.length} total</Pill>
            </div>
            <div className="mt-4 grid gap-3">
              {workOrders.slice(0, 5).map((w) => (
                <Link key={w.id} href={`/ho/work-orders/${w.id}`} className="no-underline">
                  <div className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-4 hover:bg-[var(--hw-soft)]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-[var(--hw-ink)]">{w.serviceCategory}</div>
                      <Pill>Status: {w.status}</Pill>
                    </div>
                    {w.propertyAddress ? (
                      <div className="mt-1 text-sm text-[var(--hw-muted)]">{w.propertyAddress}</div>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/marketplace/intake">
                <Button>Submit Work Order</Button>
              </Link>
              <Button variant="secondary">Request Express Estimate</Button>
              <Button variant="ghost">Chat with Pro Team</Button>
            </div>
          </Card>
        ) : (
          <EmptyState
            title="No active services"
            text="Start by requesting service in the marketplace. Capture happens at scheduling confirmation."
            action={
              <Link href="/marketplace/intake">
                <Button>Request service</Button>
              </Link>
            }
          />
        )}
      </div>
    </PortalShell>
  );
}
