"use client";

import { useEffect, useMemo, useState } from "react";

import { Card, EmptyState, Pill, StatTile } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";

type WorkOrder = {
  id: string;
  createdAt: string;
  serviceCategory?: string;
  propertyAddress?: string;
  status?: string;
};

type Message = {
  id: string;
  createdAt: string;
  body: string;
  readAt?: string | null;
};

const nav = [
  { href: "/hg/dashboard", label: "Dashboard" },
  { href: "/hg/projects", label: "My Projects" },
  { href: "/hg/estimates", label: "Estimates" },
  { href: "/hg/messages", label: "Messages" },
  { href: "/hg/service-providers", label: "Service Providers" },
  { href: "/hg/customers", label: "Customers" },
  { href: "/hg/real-estate-pros", label: "Real Estate Pros" },
  { href: "/hg/help-desk", label: "Help Desk" },
  { href: "/hg/support", label: "Support" },
  { href: "/hg/account", label: "My Account" },
];

export default function HomeGuideDashboardPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[] | null>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [woRes, msgRes] = await Promise.all([
          fetch("/api/work-orders/recent?limit=20"),
          fetch("/api/messages?limit=20"),
        ]);

        const woJson = (await woRes.json()) as { ok: boolean; workOrders?: WorkOrder[] };
        const msgJson = (await msgRes.json()) as { ok: boolean; messages?: Message[] };

        if (!woRes.ok || !woJson.ok) throw new Error("failed_work_orders");
        if (!msgRes.ok || !msgJson.ok) throw new Error("failed_messages");

        if (!cancelled) {
          setWorkOrders(woJson.workOrders || []);
          setMessages(msgJson.messages || []);
        }
      } catch {
        if (!cancelled) {
          setWorkOrders([]);
          setMessages([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const pendingCount = useMemo(
    () => (workOrders || []).filter((w) => (w.status || "").toLowerCase() === "pending").length,
    [workOrders]
  );

  const activeCount = useMemo(
    () => (workOrders || []).filter((w) => {
      const s = (w.status || "").toLowerCase();
      return s !== "completed" && s !== "cancelled";
    }).length,
    [workOrders]
  );

  const unreadCount = useMemo(() => (messages || []).filter((m) => !m.readAt).length, [messages]);

  return (
    <PortalShell role="HG" title="Home Guide" nav={nav}>
      <div className="grid gap-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <StatTile label="Work orders pending" value={String(pendingCount)} note="Triage queue (Phase 2: simplified)." />
          <StatTile label="Unread messages" value={String(unreadCount)} note="Across threads." />
          <StatTile label="Active projects" value={String(activeCount)} note="Non-completed work orders." />
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold">Triage queue</div>
            <Pill>{workOrders?.length ?? "—"}</Pill>
          </div>

          <div className="mt-4 grid gap-2">
            {workOrders === null ? (
              <div className="text-sm text-[var(--hw-muted)]">Loading…</div>
            ) : workOrders.length === 0 ? (
              <EmptyState title="No work orders" text="Create a work order from the marketplace to populate this queue." />
            ) : (
              workOrders.slice(0, 8).map((w) => (
                <div key={w.id} className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[var(--hw-ink)]">{w.serviceCategory || "Work order"}</div>
                    <Pill>{w.status || "—"}</Pill>
                  </div>
                  <div className="mt-1 text-xs text-[var(--hw-muted)]">{w.propertyAddress || w.id}</div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </PortalShell>
  );
}
