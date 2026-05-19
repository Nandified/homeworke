"use client";
import { SP_NAV } from "@/components/sp/nav";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button, Container, EmptyState, Input, Pill } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { ListRow, StatusChip } from "@/components/dashboard/ListRow";

type Job = {
  id: string;
  createdAt: string;
  workOrderId: string;
  status: "active" | "completed";
  title: string;
  address?: string;
};

function fmtDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function ServiceProviderMyJobsPage() {
  const [items, setItems] = useState<Job[] | null>(null);
  const [tab, setTab] = useState<"active" | "completed" | "all">("active");
  const [q, setQ] = useState("");

  async function reload() {
    setItems(null);
    const res = await fetch(`/api/sp/jobs?status=${encodeURIComponent(tab)}&demo=1`);
    const j = (await res.json().catch(() => null)) as any;
    setItems(Array.isArray(j?.jobs) ? (j.jobs as Job[]) : []);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items || [];
    return (items || []).filter((x) => {
      const hay = [x.title, x.address, x.workOrderId, x.id].filter(Boolean).join(" | ").toLowerCase();
      return hay.includes(query);
    });
  }, [items, q]);

  async function complete(jobId: string) {
    await fetch("/api/sp/jobs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ demo: true, action: "complete", id: jobId }),
    });
    await reload();
  }

  return (
    <PortalShell role="SP" title="Service Provider" nav={SP_NAV} description="Track your active work and completed jobs." >
      <Container>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">My Jobs</div>
            <div className="mt-1 text-sm text-[var(--hw-muted)]">Demo mode: jobs appear after you submit an estimate.</div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Input value={q} onChange={(e) => setQ(e.currentTarget.value)} placeholder="Search jobs…" className="sm:w-[320px]" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {([
            ["active", "Active"],
            ["completed", "Completed"],
            ["all", "All"],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={
                "h-10 rounded-full border px-4 text-sm font-semibold transition " +
                (tab === k
                  ? "border-[rgba(229,57,53,.35)] bg-[rgba(229,57,53,.06)] text-[var(--hw-red)]"
                  : "border-[var(--hw-line)] bg-white text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]")
              }
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          <DashboardSection title="Jobs" count={items === null ? "—" : filtered.length}>
            <div className="grid gap-2">
              {items === null ? (
                <div className="text-sm text-[var(--hw-muted)]">Loading…</div>
              ) : filtered.length === 0 ? (
                <EmptyState title="No jobs" text="Submit an estimate from Find Work to create a job in this demo." />
              ) : (
                filtered.map((j) => (
                  <div key={j.id} className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="truncate text-sm font-semibold text-[var(--hw-ink)]">{j.title}</div>
                          <StatusChip>{j.status}</StatusChip>
                        </div>
                        <div className="mt-1 text-sm text-[var(--hw-muted)]">{j.address || "Address TBD"}</div>
                        <div className="mt-2 text-xs text-[var(--hw-muted)]">Created: {fmtDate(j.createdAt)}</div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Link href={`/sp/find-work/${encodeURIComponent(j.workOrderId)}`} className="no-underline">
                          <Button size="sm" variant="secondary">Job details</Button>
                        </Link>
                        {j.status === "active" ? (
                          <Button size="sm" onClick={() => complete(j.id)}>Mark complete</Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DashboardSection>
        </div>
      </Container>
    </PortalShell>
  );
}
