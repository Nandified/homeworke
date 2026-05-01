"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button, Card, CardHeader, EmptyState, StatTile } from "@/components/ui";
import { AIWorkOrderIntakeCard } from "@/components/ai/AIWorkOrderIntakeCard";
import { PortalShell } from "@/components/portal-shell";
import { HO_NAV } from "@/components/ho/nav";
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

// nav defined in components/ho/nav.ts

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
    <PortalShell role="HO" title="Homeowner" nav={HO_NAV as any} hideHeading>
      <div className="grid gap-6">
        <Card className="p-6">
          <CardHeader
            title="Dashboard"
            subtitle="Track your active services, properties, and updates from your team."
            action={
              <Link href="/marketplace/intake" className="inline-flex">
                <Button>Request service</Button>
              </Link>
            }
          />
        </Card>

        <AIWorkOrderIntakeCard />

        <KpiGrid>
          <StatTile label="Active services" value={String(workOrders?.length ?? 0)} note="Work orders in your dashboard." />
          <StatTile label="My properties" value={String(properties?.length ?? 0)} note="Saved addresses." />
          <StatTile label="Unread" value={String(unreadCount)} note="Messages and updates." />
        </KpiGrid>

        <Card className="p-6 md:p-7">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-lg font-extrabold tracking-tight text-[var(--hw-ink)]">Instant Estimate</div>
              <div className="mt-1 text-sm leading-relaxed text-[var(--hw-muted)]">
                Upload an inspection/appraisal PDF, then open a report to analyze and download an estimate.
              </div>
            </div>
            <Link href="/ho/express-estimate" className="shrink-0">
              <Button variant="secondary">Open</Button>
            </Link>
          </div>
        </Card>

        {workOrders && workOrders.length ? (
          <DashboardSection
            title="Active projects shared with you"
            description={`Team: ${session?.partner?.partnerName || "—"} • Latest status: ${latest?.status || "—"}`}
            count={`${workOrders.length} total`}
            action={
              <Link href="/ho/pro-team">
                <Button variant="secondary">My Team</Button>
              </Link>
            }
          >
            <div className="grid gap-2">
              {workOrders.slice(0, 5).map((w) => (
                <ListRow
                  key={w.id}
                  href={`/ho/work-orders/${w.id}`}
                  title={w.serviceSubcategory ? `${w.serviceCategory} / ${w.serviceSubcategory}` : w.serviceCategory}
                  subtitle={w.propertyAddress}
                  badge={<StatusChip>Status: {w.status}</StatusChip>}
                />
              ))}
            </div>
            <div className="mt-5">
              <Link href="/ho/express-estimate">
                <Button variant="ghost">Instant Estimate</Button>
              </Link>
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
