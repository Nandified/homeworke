"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { Button, Card, Chip, EmptyState, Pill, StatTile } from "@/components/ui";
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
};

type WorkOrder = {
  id: string;
  createdAt: string;
  serviceCategory: string;
  serviceSubcategory?: string;
  issueDescription?: string;
  urgencyLevel?: string;
  propertyAddress?: string;
  propertyType?: string;
  preferredDate?: string;
  preferredWindow?: string;
  status: string;
  originPartnerId?: string | null;
  shareWithPartner?: boolean | null;
};

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem("hw_session_v1");
    if (!raw) return null;
    const s = JSON.parse(raw) as { token?: string };
    return s.token ? { token: s.token } : null;
  } catch {
    return null;
  }
}

export default function Page() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [token, setToken] = useState<string | null>(null);
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = loadSession();
    setToken(s?.token || null);
    if (!s?.token) {
      setError("missing_session");
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/work-orders/${encodeURIComponent(id)}?token=${encodeURIComponent(s.token)}`);
        const data = (await res.json()) as { ok: boolean; workOrder?: WorkOrder; error?: string };
        if (!res.ok || !data.ok || !data.workOrder) {
          setError(data.error || "not_found");
          return;
        }
        setWorkOrder(data.workOrder);
      } catch {
        setError("network_error");
      }
    })();
  }, [id]);

  const title = useMemo(() => {
    if (!workOrder) return "Work order";
    return workOrder.serviceSubcategory ? `${workOrder.serviceCategory} · ${workOrder.serviceSubcategory}` : workOrder.serviceCategory;
  }, [workOrder]);

  return (
    <PortalShell role="HO" title="Homeowner" nav={nav}>
      {!token ? (
        <EmptyState
          title="No session"
          text="Start in the marketplace so we can attach your work orders to your session."
          action={
            <Link href="/marketplace/intake">
              <Button>Request service</Button>
            </Link>
          }
        />
      ) : error ? (
        <EmptyState
          title="Work order not available"
          text="We could not load this work order."
          action={
            <Link href="/ho/dashboard">
              <Button variant="secondary">Back to dashboard</Button>
            </Link>
          }
        />
      ) : !workOrder ? (
        <Card className="p-6 md:p-7">
          <div className="text-sm font-semibold">Loading…</div>
          <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">Fetching your work order.</div>
        </Card>
      ) : (
        <div className="grid gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Work order</div>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <Chip>ID: {workOrder.id}</Chip>
                <Chip>Created: {new Date(workOrder.createdAt).toLocaleString()}</Chip>
              </div>
            </div>
            <Pill>Status: {workOrder.status}</Pill>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <StatTile label="Service" value={workOrder.serviceCategory} note={workOrder.serviceSubcategory || ""} />
            <StatTile
              label="Preferred"
              value={workOrder.preferredDate || "—"}
              note={workOrder.preferredWindow ? `Window: ${workOrder.preferredWindow}` : ""}
            />
            <StatTile label="Sharing" value={workOrder.shareWithPartner ? "On" : "Off"} note="Per-request control" />
          </div>

          <Card className="p-6 md:p-7">
            <div className="text-sm font-semibold">Details</div>
            <div className="mt-3 grid gap-2 text-sm leading-7 text-[var(--hw-muted)]">
              {workOrder.issueDescription ? (
                <div>
                  <span className="font-semibold text-[var(--hw-ink)]">Issue:</span> {workOrder.issueDescription}
                </div>
              ) : null}
              {workOrder.urgencyLevel ? (
                <div>
                  <span className="font-semibold text-[var(--hw-ink)]">Urgency:</span> {workOrder.urgencyLevel}
                </div>
              ) : null}
              {workOrder.propertyAddress ? (
                <div>
                  <span className="font-semibold text-[var(--hw-ink)]">Address:</span> {workOrder.propertyAddress}
                </div>
              ) : null}
              {workOrder.propertyType ? (
                <div>
                  <span className="font-semibold text-[var(--hw-ink)]">Property type:</span> {workOrder.propertyType}
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/ho/dashboard">
                <Button variant="secondary">Back to dashboard</Button>
              </Link>
              <Link href="/marketplace/intake">
                <Button variant="ghost">Start a new request</Button>
              </Link>
            </div>
          </Card>
        </div>
      )}
    </PortalShell>
  );
}
