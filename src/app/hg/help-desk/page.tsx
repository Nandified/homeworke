"use client";
import { HG_NAV } from "@/components/hg/nav";

import { useEffect, useMemo, useState } from "react";

import { Button, Card, Container, Divider, EmptyState, Input } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { ListRow, StatusChip } from "@/components/dashboard/ListRow";

type Ticket = {
  id: string;
  createdAt: string;
  assignedAt?: string;
  status: "pending" | "accepted" | "solved";
  userName: string;
  userRole: string;
  userEmail?: string;
  userPhone?: string;
  message: string;
  homeGuideName?: string;
  notes?: Array<{ id: string; body: string; createdAt: string }>;
};

function fmtDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function HomeGuideHelpDeskPage() {
  const [items, setItems] = useState<Ticket[] | null>(null);
  const [status, setStatus] = useState<"pending" | "accepted" | "all">("pending");
  const [q, setQ] = useState("");

  const [openId, setOpenId] = useState<string>("");
  const openTicket = useMemo(() => (items || []).find((t) => t.id === openId) || null, [items, openId]);
  const [noteText, setNoteText] = useState("");

  async function reload(nextStatus = status) {
    setItems(null);
    const res = await fetch(`/api/hg/help-desk?status=${encodeURIComponent(nextStatus)}&demo=1`);
    const j = (await res.json().catch(() => null)) as any;
    setItems(Array.isArray(j?.tickets) ? (j.tickets as Ticket[]) : []);
  }

  useEffect(() => {
    reload(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items || [];
    return (items || []).filter((t) => {
      const hay = [t.userName, t.userRole, t.userEmail, t.userPhone, t.message, t.homeGuideName, t.id]
        .filter(Boolean)
        .join(" | ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [items, q]);

  async function act(action: "accept" | "solve" | "add_note", id: string, extra?: any) {
    await fetch("/api/hg/help-desk", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ demo: true, action, id, ...extra }),
    });
    await reload(status);
  }

  return (
    <PortalShell role="HG" title="Home Guide" nav={HG_NAV} description="Support tickets across the platform. Triage → accept → solve." >
      <Container>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">Help Desk</div>
            <div className="mt-1 text-sm text-[var(--hw-muted)]">Use Pending to triage new requests, then accept and resolve.</div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Input value={q} onChange={(e) => setQ(e.currentTarget.value)} placeholder="Search tickets…" className="sm:w-[320px]" />
            <div className="flex items-center gap-2">
              {([
                ["pending", "Pending"],
                ["accepted", "Accepted"],
                ["all", "All"],
              ] as const).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setStatus(k)}
                  className={
                    "h-10 rounded-full border px-4 text-sm font-semibold transition " +
                    (status === k
                      ? "border-[rgba(229,57,53,.35)] bg-[rgba(229,57,53,.06)] text-[var(--hw-red)]"
                      : "border-[var(--hw-line)] bg-white text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]")
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <DashboardSection title="Tickets" count={items === null ? "—" : filtered.length}>
            <div className="grid gap-2">
              {items === null ? (
                <div className="text-sm text-[var(--hw-muted)]">Loading…</div>
              ) : filtered.length === 0 ? (
                <EmptyState title="No tickets" text="You’re caught up." />
              ) : (
                filtered.map((t) => (
                  <div key={t.id} className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="truncate text-sm font-semibold text-[var(--hw-ink)]">{t.userName}</div>
                          <StatusChip>{t.status}</StatusChip>
                          <div className="text-xs text-[var(--hw-muted)]">{t.userRole}</div>
                        </div>
                        <div className="mt-1 text-sm text-[var(--hw-muted)] line-clamp-2">{t.message}</div>
                        <div className="mt-2 text-xs text-[var(--hw-muted)]">
                          Created: {fmtDate(t.createdAt)}{t.homeGuideName ? ` • HG: ${t.homeGuideName}` : ""}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button variant="secondary" size="sm" onClick={() => setOpenId(t.id)}>
                          View
                        </Button>
                        {t.status === "pending" ? (
                          <Button size="sm" onClick={() => act("accept", t.id, { homeGuideName: "Fernando" })}>
                            Accept
                          </Button>
                        ) : null}
                        {t.status !== "solved" ? (
                          <Button variant="destructive" size="sm" onClick={() => act("solve", t.id)}>
                            Solve
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DashboardSection>
        </div>

        {/* Modal (legacy-style) */}
        {openTicket ? (
          <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-[rgba(229,57,53,.18)] bg-white shadow-[0_18px_60px_rgba(17,24,39,.18)]">
              <div className="flex items-center justify-between border-b border-[var(--hw-line)] px-6 py-4">
                <div>
                  <div className="text-sm font-semibold text-[var(--hw-ink)]">Support Request Overview</div>
                  <div className="mt-0.5 text-xs text-[var(--hw-muted)]">Ticket: {openTicket.id}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenId("")}
                  className="rounded-full border border-[var(--hw-line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--hw-ink)]"
                >
                  Close
                </button>
              </div>

              <div className="grid gap-4 p-6 lg:grid-cols-2">
                <Card className="p-4">
                  <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">User</div>
                  <div className="mt-2 text-sm font-semibold text-[var(--hw-ink)]">{openTicket.userName}</div>
                  <div className="mt-1 text-xs text-[var(--hw-muted)]">{openTicket.userRole}</div>
                  <Divider className="my-4" />
                  <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Contact</div>
                  <div className="mt-2 text-sm text-[var(--hw-ink)]">{openTicket.userEmail || "—"}</div>
                  <div className="mt-1 text-sm text-[var(--hw-ink)]">{openTicket.userPhone || "—"}</div>
                </Card>

                <Card className="p-4">
                  <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Message</div>
                  <div className="mt-2 whitespace-pre-wrap text-sm text-[var(--hw-ink)]">{openTicket.message}</div>
                  <div className="mt-3 text-xs text-[var(--hw-muted)]">Created: {fmtDate(openTicket.createdAt)}</div>
                </Card>

                <Card className="p-4 lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Notes</div>
                    <Button
                      size="xs"
                      variant="secondary"
                      onClick={async () => {
                        const text = noteText.trim();
                        if (!text) return;
                        setNoteText("");
                        await act("add_note", openTicket.id, { text });
                      }}
                    >
                      Add note
                    </Button>
                  </div>
                  <div className="mt-3 grid gap-2">
                    <Input value={noteText} onChange={(e) => setNoteText(e.currentTarget.value)} placeholder="Write a note…" />
                    {(openTicket.notes || []).length ? (
                      <div className="grid gap-2">
                        {(openTicket.notes || []).map((n) => (
                          <div key={n.id} className="rounded-2xl border border-[var(--hw-line)] bg-white px-4 py-3">
                            <div className="text-sm text-[var(--hw-ink)]">{n.body}</div>
                            <div className="mt-1 text-xs text-[var(--hw-muted)]">{fmtDate(n.createdAt)}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-[var(--hw-muted)]">No notes yet.</div>
                    )}
                  </div>
                </Card>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[var(--hw-line)] px-6 py-4">
                <Button variant="secondary" onClick={() => setOpenId("")}>Cancel</Button>
                {openTicket.status !== "solved" ? (
                  <Button variant="destructive" onClick={async () => {
                    await act("solve", openTicket.id);
                    setOpenId("");
                  }}>Solve</Button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </Container>
    </PortalShell>
  );
}
