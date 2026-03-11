"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button, EmptyState, StatTile } from "@/components/ui";
import { AIWorkOrderIntakeCard } from "@/components/ai/AIWorkOrderIntakeCard";
import { PortalShell } from "@/components/portal-shell";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { ListRow, StatusChip } from "@/components/dashboard/ListRow";
import { ensureDemoHomeownerSession } from "@/lib/demo";

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
    ensureDemoHomeownerSession();
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
    <PortalShell
      role="HO"
      title="Homeowner"
      nav={nav}
      description="Track your active services, properties, and messages with your Pro Team."
      primaryAction={
        <Link href="/marketplace/intake">
          <Button>Request service</Button>
        </Link>
      }
    >
      <div className="grid gap-6">
        <AIWorkOrderIntakeCard />

        <KpiGrid>
          <StatTile label="Active services" value={String(workOrders?.length ?? 0)} note="Work orders in your dashboard." />
          <StatTile label="My properties" value={String(properties?.length ?? 0)} note="Property profiles (Phase 2: minimal)." />
          <StatTile label="Unread messages" value={String(unreadCount)} note="From your Pro Team." />
        </KpiGrid>

        {workOrders && workOrders.length ? (
          <DashboardSection
            title="Your work orders"
            description={`Partner: ${session?.partner?.partnerName || "—"} • Latest status: ${latest?.status || "—"}`}
            count={`${workOrders.length} total`}
            action={<Button variant="secondary">Chat with Pro Team</Button>}
          >
            <div className="grid gap-2">
              {workOrders.slice(0, 5).map((w) => (
                <ListRow
                  key={w.id}
                  href={`/ho/work-orders/${w.id}`}
                  title={w.serviceCategory}
                  subtitle={w.propertyAddress}
                  badge={<StatusChip>Status: {w.status}</StatusChip>}
                />
              ))}
            </div>
            <div className="mt-5">
              <Button variant="ghost">Request Express Estimate</Button>
            </div>
          </DashboardSection>
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
