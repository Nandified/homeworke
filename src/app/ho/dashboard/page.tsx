"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button, Card, EmptyState, Pill, StatTile } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";

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

type Property = {
  id: string;
  address: string;
  nickname?: string;
};

type Message = {
  id: string;
  createdAt: string;
  body: string;
  readAt?: string | null;
};

const nav = [
  { href: "/ho/dashboard", label: "Dashboard" },
  { href: "/ho/messages", label: "Messages" },
  { href: "/ho/properties", label: "My Properties" },
  { href: "/ho/pro-team", label: "Pro Team" },
  { href: "/ho/support", label: "Support" },
  { href: "/ho/account", label: "My Account" },
];

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem("hw_session_v1");
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export default function HomeownerDashboardPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[] | null>(null);
  const [properties, setProperties] = useState<Property[] | null>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);

  useEffect(() => {
    const s = loadSession();
    setSession(s);
    if (!s?.token) {
      setWorkOrders([]);
      setProperties([]);
      setMessages([]);
      return;
    }

    (async () => {
      try {
        const [woRes, propRes, msgRes] = await Promise.all([
          fetch(`/api/work-orders?token=${encodeURIComponent(s.token)}`),
          fetch(`/api/properties?token=${encodeURIComponent(s.token)}`),
          fetch(`/api/messages?token=${encodeURIComponent(s.token)}&limit=20`),
        ]);

        const woJson = (await woRes.json()) as { ok: boolean; workOrders?: WorkOrder[] };
        const propJson = (await propRes.json()) as { ok: boolean; properties?: Property[] };
        const msgJson = (await msgRes.json()) as { ok: boolean; messages?: Message[] };

        if (!woRes.ok || !woJson.ok) throw new Error("failed_work_orders");
        if (!propRes.ok || !propJson.ok) throw new Error("failed_properties");
        if (!msgRes.ok || !msgJson.ok) throw new Error("failed_messages");

        setWorkOrders(woJson.workOrders || []);
        setProperties(propJson.properties || []);
        setMessages(msgJson.messages || []);
      } catch {
        setWorkOrders([]);
        setProperties([]);
        setMessages([]);
      }
    })();
  }, []);

  const latest = useMemo(() => (workOrders && workOrders.length ? workOrders[0] : null), [workOrders]);
  const unreadCount = useMemo(() => (messages || []).filter((m) => !m.readAt).length, [messages]);

  return (
    <PortalShell role="HO" title="Homeowner" nav={nav}>
      <div className="grid gap-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <StatTile label="Active services" value={String(workOrders?.length ?? 0)} note="Work orders in your dashboard." />
          <StatTile label="My properties" value={String(properties?.length ?? 0)} note="Property profiles (Phase 2: minimal)." />
          <StatTile label="Unread messages" value={String(unreadCount)} note="From your Pro Team." />
        </div>

        {workOrders && workOrders.length ? (
          <Card className="p-6 md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Your work orders</div>
                <div className="mt-1 text-xs text-[var(--hw-muted)]">
                  Partner: {session?.partner?.partnerName || "—"} • Latest status: {latest?.status || "—"}
                </div>
              </div>
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
                    {w.propertyAddress ? <div className="mt-1 text-sm text-[var(--hw-muted)]">{w.propertyAddress}</div> : null}
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
