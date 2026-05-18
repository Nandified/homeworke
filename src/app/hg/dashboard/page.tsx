"use client";
import { HG_NAV } from "@/components/hg/nav";


import { useEffect, useMemo, useState } from "react";

import { EmptyState, StatTile } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { ListRow, StatusChip } from "@/components/dashboard/ListRow";

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
    <PortalShell role="HG" title="Home Guide" nav={HG_NAV} description="Monitor the triage queue, keep threads moving, and route work to the right team." >
      <div className="grid gap-6">
        <KpiGrid>
          <StatTile label="Work orders pending" value={String(pendingCount)} note="Triage queue (Phase 2: simplified)." />
          <StatTile label="Unread messages" value={String(unreadCount)} note="Across threads." />
          <StatTile label="Active projects" value={String(activeCount)} note="Non-completed work orders." />
        </KpiGrid>

        <DashboardSection title="Triage queue" count={workOrders?.length ?? "—"}>
          <div className="grid gap-2">
            {workOrders === null ? (
              <div className="text-sm text-[var(--hw-muted)]">Loading…</div>
            ) : workOrders.length === 0 ? (
              <EmptyState title="No work orders" text="Create a work order from the marketplace to populate this queue." />
            ) : (
              workOrders.slice(0, 8).map((w) => (
                <ListRow
                  key={w.id}
                  title={w.serviceCategory || "Work Order"}
                  subtitle={w.propertyAddress || w.id}
                  badge={w.status ? <StatusChip>{w.status}</StatusChip> : null}
                />
              ))
            )}
          </div>
        </DashboardSection>
      </div>
    </PortalShell>
  );
}
