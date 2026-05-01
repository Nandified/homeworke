"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button, Card, Chip, Container, StatTile } from "@/components/ui";
import { AIWorkOrderIntakeCard } from "@/components/ai/AIWorkOrderIntakeCard";
import { InstantEstimateCard } from "@/components/dashboard/InstantEstimateCard";
import { PortalShell } from "@/components/portal-shell";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { ListRow, StatusChip } from "@/components/dashboard/ListRow";
import { HO_NAV } from "@/components/ho/nav";
import { ensureDemoHomeownerSession } from "@/lib/demo";

type Session = {
  token: string;
  email?: string;
  partner?: null | { partnerId: string; partnerName: string };
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
  updatedAt?: string;
};

type Message = {
  id: string;
  createdAt: string;
  body: string;
  fromRole?: string;
  readAt?: string | null;
  threadId?: string;
  threadTitle?: string | null;
  ownerName?: string | null;
  propertyAddress?: string | null;
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

export default function HomeownerDashboardPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    ensureDemoHomeownerSession();
    const s = loadSession();
    setSession(s);

    if (!s?.token) {
      setWorkOrders([]);
      setMessages([]);
      return;
    }

    (async () => {
      try {
        const [woRes, msgRes] = await Promise.all([
          fetch(`/api/work-orders?token=${encodeURIComponent(s.token)}`),
          fetch(`/api/messages?token=${encodeURIComponent(s.token)}&limit=20`),
        ]);

        const woJson = (await woRes.json()) as { ok?: boolean; workOrders?: WorkOrder[] };
        const msgJson = (await msgRes.json()) as { ok?: boolean; messages?: Message[] };

        if (woRes.ok && woJson.ok) setWorkOrders(woJson.workOrders || []);
        if (msgRes.ok && msgJson.ok) setMessages(msgJson.messages || []);
      } catch {
        // Keep dashboard clean; show empty states.
        setWorkOrders([]);
        setMessages([]);
      }
    })();
  }, []);

  const sortedWorkOrders = useMemo(() => {
    return [...workOrders].sort((a, b) => {
      const at = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bt = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bt - at;
    });
  }, [workOrders]);

  const unreadCount = useMemo(() => messages.filter((m) => !m.readAt).length, [messages]);
  const activeCount = useMemo(() => workOrders.filter((w) => String(w.status || "").toLowerCase() !== "completed").length, [workOrders]);
  const pendingCount = useMemo(() => workOrders.filter((w) => String(w.status || "").toLowerCase() === "pending").length, [workOrders]);
  const completedCount = useMemo(() => workOrders.filter((w) => String(w.status || "").toLowerCase() === "completed").length, [workOrders]);

  const previewMessages = useMemo(() => {
    const rows = messages.slice(0, 3).map((m) => {
      const from = (m.ownerName || (m.fromRole === "HO" ? "You" : m.fromRole) || "Message").toString();
      const address = m.propertyAddress || "";
      const body = (m.body || "").replace(/\s+/g, " ").trim();
      return { id: m.id, from, address, body, unread: !m.readAt, threadId: m.threadId };
    });
    return rows;
  }, [messages]);

  const MessagesCard = (
    <Card className="border-[var(--hw-line)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Messages</div>
          <div className="mt-1 flex items-center gap-2">
            <div className="text-lg font-extrabold tracking-tight text-[var(--hw-ink)]">Messages</div>
            <Chip>{unreadCount} unread</Chip>
          </div>
        </div>
        <Link href="/ho/messages" className="shrink-0">
          <Button size="sm" variant="secondary">
            View
          </Button>
        </Link>
      </div>

      <div className="mt-4 grid gap-2">
        {previewMessages.length ? (
          previewMessages.map((m) => (
            <Link
              key={m.id}
              href="/ho/messages"
              className="block max-w-full overflow-hidden rounded-[var(--hw-radius)] border border-[var(--hw-line)] bg-white px-3 py-2 transition hover:bg-[var(--hw-soft)]"
            >
              <div className="flex min-w-0 items-start gap-2">
                {m.unread ? <span className="mt-[3px] h-2 w-2 shrink-0 rounded-full bg-[rgb(229,57,53)]" /> : null}
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[var(--hw-ink)] truncate">{m.from}</div>
                  {m.address ? <div className="mt-0.5 text-[11px] text-[var(--hw-muted)] truncate">{m.address}</div> : null}
                  <div className="mt-1 text-xs text-[var(--hw-ink)] truncate">{m.body}</div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-sm text-[var(--hw-muted)]">No messages yet.</div>
        )}
      </div>
    </Card>
  );

  return (
    <PortalShell role="HO" title="Homeowner" nav={HO_NAV as any} hideHeading>
      <Container>
        <div className="grid gap-6">
          {/* Top row: AI intake (left) + KPIs + Messages */}
          <div className="grid items-start gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <AIWorkOrderIntakeCard
                eyebrow="Job work order"
                title="What do you need help with?"
                primaryCta="Schedule a visit"
                secondaryCta="Browse services"
                showServicingPill={false}
              />

              <div className="mt-6 lg:hidden">
                <InstantEstimateCard basePath="/ho" />
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="grid grid-cols-2 gap-4 auto-rows-fr">
                <StatTile label="Active" value={String(activeCount)} note="In progress" className="h-full" />
                <StatTile label="Pending" value={String(pendingCount)} note="Not started" className="h-full" />
                <StatTile label="Completed" value={String(completedCount)} note="Closed" className="h-full" />
                <StatTile label="Unread" value={String(unreadCount)} note="New messages" className="h-full" />
              </div>

              <div className="mt-6 hidden lg:block">{MessagesCard}</div>
            </div>

            <div className="lg:hidden">{MessagesCard}</div>
          </div>

          {/* Desktop: Instant Estimate full card row */}
          <div className="hidden lg:block">
            <InstantEstimateCard basePath="/ho" />
          </div>

          {/* Active projects */}
          <DashboardSection
            title="Active projects shared with you"
            count={sortedWorkOrders.length}
            action={
              <Link href="/ho/jobs">
                <Button variant="secondary">View jobs</Button>
              </Link>
            }
          >
            {sortedWorkOrders.length ? (
              <div className="grid gap-2">
                {sortedWorkOrders.slice(0, 6).map((w) => (
                  <ListRow
                    key={w.id}
                    href={`/ho/work-orders/${w.id}`}
                    title={w.serviceSubcategory ? `${w.serviceCategory} / ${w.serviceSubcategory}` : w.serviceCategory}
                    subtitle={w.propertyAddress}
                    footnote={session?.partner?.partnerName ? `Team: ${session.partner.partnerName}` : undefined}
                    badge={<StatusChip>Status: {w.status}</StatusChip>}
                  />
                ))}
              </div>
            ) : (
              <div className="text-sm text-[var(--hw-muted)]">No active projects yet.</div>
            )}
          </DashboardSection>
        </div>
      </Container>
    </PortalShell>
  );
}
