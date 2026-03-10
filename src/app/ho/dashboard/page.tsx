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

        {latest ? (
          <Card className="p-6 md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm font-semibold">Latest work order</div>
              <Pill>Status: {latest.status}</Pill>
            </div>
            <div className="mt-3 text-sm leading-7 text-[var(--hw-muted)]">
              <div>
                <span className="font-semibold text-[var(--hw-ink)]">Service:</span> {latest.serviceCategory}
              </div>
              {latest.propertyAddress ? (
                <div>
                  <span className="font-semibold text-[var(--hw-ink)]">Address:</span> {latest.propertyAddress}
                </div>
              ) : null}
              {latest.preferredDate ? (
                <div>
                  <span className="font-semibold text-[var(--hw-ink)]">Preferred:</span> {latest.preferredDate} ({latest.preferredWindow || ""})
                </div>
              ) : null}
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
