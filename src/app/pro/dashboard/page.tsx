"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, EmptyState, Chip, Pill, Button } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";
import { PARTNER_STORAGE_KEY } from "@/lib/partner-context";

const nav = [
  { href: "/pro/dashboard", label: "Dashboard" },
  { href: "/pro/estimates", label: "Estimates" },
  { href: "/pro/clients", label: "My Clients" },
  { href: "/pro/properties", label: "Properties" },
  { href: "/pro/messages", label: "Messages" },
  { href: "/pro/support", label: "Support" },
  { href: "/pro/account", label: "My Account" },
];

interface WorkOrder {
  id: string;
  title?: string;
  address?: string;
  status: string;
  clientName?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PartnerContext {
  partnerId: string;
  partnerName?: string;
  slug?: string;
}

const STATUS_GROUPS = ["Pending", "Scheduled", "In progress", "Completed"] as const;

type StatusGroup = (typeof STATUS_GROUPS)[number];

const STATUS_CLASS: Record<StatusGroup, string> = {
  Pending: "border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.05)] text-[var(--hw-ink)]",
  Scheduled: "border-[var(--hw-line)] bg-white text-[var(--hw-ink)]",
  "In progress": "border-[var(--hw-line)] bg-[var(--hw-soft)] text-[var(--hw-ink)]",
  Completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

function normalizeStatus(raw: string): StatusGroup {
  const lower = raw.toLowerCase().trim();
  if (lower === "pending") return "Pending";
  if (lower === "scheduled") return "Scheduled";
  if (lower === "in progress" || lower === "in_progress" || lower === "inprogress") return "In progress";
  if (lower === "completed" || lower === "complete" || lower === "done") return "Completed";
  return "Pending";
}

export default function Page() {
  const [partner, setPartner] = useState<PartnerContext | null | undefined>(undefined);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read partner context from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PARTNER_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PartnerContext;
        if (parsed?.partnerId) {
          setPartner(parsed);
          return;
        }
      }
    } catch {
      // ignore parse errors
    }
    setPartner(null);
  }, []);

  // Fetch work orders when partner is available
  useEffect(() => {
    if (!partner?.partnerId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/pro/work-orders?partnerId=${encodeURIComponent(partner.partnerId)}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load work orders (${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          const orders: WorkOrder[] = Array.isArray(data) ? data : data?.workOrders ?? data?.data ?? [];
          setWorkOrders(orders);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message ?? "Something went wrong");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [partner]);

  // Group work orders by status
  const grouped = useMemo(() => {
    const map: Record<StatusGroup, WorkOrder[]> = {
      Pending: [],
      Scheduled: [],
      "In progress": [],
      Completed: [],
    };
    for (const wo of workOrders) {
      const group = normalizeStatus(wo.status);
      map[group].push(wo);
    }
    return map;
  }, [workOrders]);

  const totalCount = workOrders.length;

  // Still reading localStorage
  if (partner === undefined) {
    return (
      <PortalShell role="PRO" title="Real Estate Pro" nav={nav}>
        <div className="flex items-center justify-center py-20">
          <div className="text-sm text-[var(--hw-muted)]">Loading…</div>
        </div>
      </PortalShell>
    );
  }

  // No partner context
  if (!partner) {
    return (
      <PortalShell role="PRO" title="Real Estate Pro" nav={nav}>
        <div className="grid gap-4">
          <EmptyState
            title="No partner link detected"
            text="To access your Pro dashboard, open the app using your unique partner link. This connects you to shared client projects and work orders."
            action={
              <div className="flex flex-col items-center gap-2">
                <Button onClick={() => (window.location.href = "/p/frj")}>
                  Open example partner link →
                </Button>
                <span className="text-xs text-[var(--hw-muted)]">e.g. yoursite.com/p/frj</span>
              </div>
            }
          />
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell role="PRO" title="Real Estate Pro" nav={nav}>
      <div className="grid gap-6">
        {/* Header */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Dashboard
            </h1>
            {partner.partnerName && (
              <p className="text-sm text-[var(--hw-muted)]">
                Partner: {partner.partnerName}
              </p>
            )}
          </div>
          <Pill className="self-start sm:self-auto">
            {totalCount} work order{totalCount !== 1 ? "s" : ""}
          </Pill>
        </div>

        {/* Loading state */}
        {loading && (
          <Card className="p-6">
            <div className="text-sm text-[var(--hw-muted)]">Loading work orders…</div>
          </Card>
        )}

        {/* Error state */}
        {error && (
          <Card className="border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
            <div className="text-sm font-medium text-red-700 dark:text-red-300">{error}</div>
          </Card>
        )}

        {/* Empty state after load */}
        {!loading && !error && totalCount === 0 && (
          <EmptyState
            title="No shared projects yet"
            text="When clients share work orders with you, they'll appear here grouped by status."
          />
        )}

        {/* Grouped work orders */}
        {!loading && !error && totalCount > 0 && (
          <div className="grid gap-5">
            {STATUS_GROUPS.map((status) => {
              const items = grouped[status];
              if (items.length === 0) return null;

              return (
                <section key={status}>
                  <div className="mb-3 flex items-center gap-2">
                    <h2 className="text-sm font-semibold">{status}</h2>
                    <Pill>{items.length}</Pill>
                  </div>
                  <div className="grid gap-3">
                    {items.map((wo) => (
                      <Card
                        key={wo.id}
                        className="flex flex-col gap-2 p-4 transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {wo.title || wo.address || `Work Order #${wo.id}`}
                            </span>
                            <Chip className={STATUS_CLASS[status]}>{status}</Chip>
                          </div>
                          {wo.clientName && (
                            <span className="text-xs text-[var(--hw-muted)]">
                              Client: {wo.clientName}
                            </span>
                          )}
                          {wo.address && wo.title && (
                            <span className="text-xs text-[var(--hw-muted)]">
                              {wo.address}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[var(--hw-muted)]">
                          {wo.updatedAt && (
                            <span>
                              Updated{" "}
                              {new Date(wo.updatedAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          )}
                          {wo.createdAt && !wo.updatedAt && (
                            <span>
                              Created{" "}
                              {new Date(wo.createdAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
