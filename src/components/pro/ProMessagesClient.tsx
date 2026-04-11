"use client";

import * as React from "react";

import { Button, Card, Chip, Divider } from "@/components/ui";
import { useStoredProfile } from "@/components/user-avatar";
import { isDemoMode } from "@/lib/demo";
import { cn } from "@/lib/utils";

import { usePartnerContext } from "./usePartnerContext";

type ApiMessage = {
  id: string;
  createdAt: string;
  threadId: string;
  threadTitle?: string;
  propertyAddress?: string;
  ownerName?: string;
  propertyId?: string | null;
  workOrderId?: string | null;
  reportId?: string | null;
  fromRole: string;
  fromName?: string | null;
  body: string;
  readAt?: string | null;
  attachments?: Array<{ id?: string; url: string; mimeType?: string | null; fileName?: string | null; bytes?: number | null }>;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  return `${d}d ago`;
}

export function ProMessagesClient(props: { empty: React.ReactNode }) {
  const { partnerId } = usePartnerContext();

  const initialThreadIdFromUrl = React.useMemo(() => {
    if (typeof window === "undefined") return "";
    try {
      const params = new URLSearchParams(window.location.search);
      return (params.get("threadId") || "").trim();
    } catch {
      return "";
    }
  }, []);
  const profile = useStoredProfile();
  const [messages, setMessages] = React.useState<ApiMessage[] | null>(null);
  const [activeThreadId, setActiveThreadId] = React.useState<string>(initialThreadIdFromUrl || "");
  const [composer, setComposer] = React.useState<string>("");
  const [pendingFiles, setPendingFiles] = React.useState<File[]>([]);
  const [query, setQuery] = React.useState<string>("");
  const [filter, setFilter] = React.useState<"all" | "unread" | "needs_attention">("all");

  const [newOpen, setNewOpen] = React.useState(false);
  const [newOwnerName, setNewOwnerName] = React.useState("");
  const [newPropertyAddress, setNewPropertyAddress] = React.useState("");
  const [newPropertyId, setNewPropertyId] = React.useState<string>("");
  const [newTitle, setNewTitle] = React.useState("");
  const [newFirstMessage, setNewFirstMessage] = React.useState("");

  const DEMO_LOCAL_KEY = React.useMemo(() => (partnerId ? `hw.messages.local.${partnerId}` : ""), [partnerId]);

  const readLocalMessages = React.useCallback((): ApiMessage[] => {
    if (!partnerId) return [];
    try {
      const raw = window.localStorage.getItem(DEMO_LOCAL_KEY) || "[]";
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? (arr as ApiMessage[]) : [];
    } catch {
      return [];
    }
  }, [DEMO_LOCAL_KEY, partnerId]);

  const writeLocalMessages = React.useCallback(
    (next: ApiMessage[]) => {
      if (!partnerId) return;
      try {
        window.localStorage.setItem(DEMO_LOCAL_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
    },
    [DEMO_LOCAL_KEY, partnerId]
  );

  const syncUnreadBadge = React.useCallback(
    (next: ApiMessage[]) => {
      if (!partnerId) return;
      try {
        const unreadThreads = new Set<string>();
        for (const m of next as ApiMessage[]) {
          if (!m.readAt) unreadThreads.add(m.threadId);
        }
        window.localStorage.setItem(`hw.messages.unreadThreads.${partnerId}`, String(unreadThreads.size));
      } catch {
        // ignore
      }
    },
    [partnerId]
  );

  const reload = React.useCallback(() => {
    if (!partnerId) return;
    const url = new URL("/api/messages", window.location.origin);
    url.searchParams.set("partnerId", partnerId);
    url.searchParams.set("limit", "250");
    if (isDemoMode()) url.searchParams.set("demo", "1");

    fetch(url)
      .then((r) => r.json())
      .then((j) => {
        const next = (j.messages || []) as ApiMessage[];

        // When DB is disabled, the server uses an in-memory mock store which can reset between requests
        // on Vercel/serverless. To prevent “everything disappeared”, we mirror the most recent message
        // list into localStorage and fall back to it if the API returns empty.
        const local = readLocalMessages();
        const chosen = next.length ? next : local;

        setMessages(chosen);
        if (next.length) writeLocalMessages(next);
        syncUnreadBadge(chosen);
      })
      .catch(() => {
        const local = readLocalMessages();
        setMessages(local);
        syncUnreadBadge(local);
      });
  }, [partnerId, readLocalMessages, syncUnreadBadge, writeLocalMessages]);

  React.useEffect(() => {
    reload();
  }, [reload]);

  const allThreads = React.useMemo(() => {
    const list = messages || [];
    const by = new Map<string, ApiMessage[]>();
    for (const m of list) {
      const arr = by.get(m.threadId) || [];
      arr.push(m);
      by.set(m.threadId, arr);
    }

    const out = Array.from(by.entries()).map(([threadId, arr]) => {
      const sorted = [...arr].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const last = sorted[sorted.length - 1];
      const unread = sorted.some((x) => !x.readAt);
      const ownerName = last?.ownerName || sorted.find((x) => x.ownerName)?.ownerName || "";
      const propertyAddress = last?.propertyAddress || sorted.find((x) => x.propertyAddress)?.propertyAddress || "";
      const title = last?.threadTitle || ownerName || propertyAddress || `Thread ${threadId.replace("thread_", "#")}`;
      const unreadCount = sorted.reduce((acc, x) => acc + (!x.readAt ? 1 : 0), 0);
      const needsAttention = !!last && last.fromRole === "HO" && !last.readAt;
      const propertyId = last?.propertyId || sorted.find((x) => x.propertyId)?.propertyId || null;
      const workOrderId = last?.workOrderId || sorted.find((x) => x.workOrderId)?.workOrderId || null;
      const reportId = last?.reportId || sorted.find((x) => x.reportId)?.reportId || null;
      return { threadId, messages: sorted, last, unread, unreadCount, needsAttention, ownerName, propertyAddress, propertyId, workOrderId, reportId, title };
    });

    out.sort((a, b) => (b.last ? new Date(b.last.createdAt).getTime() : 0) - (a.last ? new Date(a.last.createdAt).getTime() : 0));
    return out;
  }, [messages]);

  const threads = React.useMemo(() => {
    const out = allThreads;
    const q = (query || "").trim().toLowerCase();
    return out.filter((t) => {
      if (filter === "unread" && !t.unread) return false;
      if (filter === "needs_attention" && !t.needsAttention) return false;
      if (!q) return true;
      const hay = `${t.ownerName} ${t.propertyAddress} ${t.title} ${t.last?.body || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [allThreads, query, filter]);

  React.useEffect(() => {
    if (activeThreadId) {
      // If a thread was deep-linked, keep it as long as it exists.
      if (allThreads.some((t) => t.threadId === activeThreadId)) return;
    }
    if (allThreads.length) setActiveThreadId(allThreads[0].threadId);
  }, [allThreads, activeThreadId]);

  const active = allThreads.find((t) => t.threadId === activeThreadId) || null;

  const unreadThreadsCount = React.useMemo(() => allThreads.filter((t) => t.unread).length, [allThreads]);
  const needsAttentionCount = React.useMemo(() => allThreads.filter((t) => t.needsAttention).length, [allThreads]);

  // Mark thread as read when opened (DB when available; also mirror locally so UI doesn't “jump”)
  React.useEffect(() => {
    if (!partnerId || !activeThreadId) return;

    // Local mirror
    setMessages((prev) => {
      if (!prev) return prev;
      const now = new Date().toISOString();
      const next = prev.map((m) => (m.threadId === activeThreadId && !m.readAt ? { ...m, readAt: now } : m));
      try {
        writeLocalMessages(next);
        syncUnreadBadge(next);
      } catch {}
      return next;
    });

    // Server attempt (ignored if DB/mock isn't persistent)
    fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markRead", partnerId, threadId: activeThreadId }),
    })
      .then(() => reload())
      .catch(() => {});
  }, [partnerId, activeThreadId, reload, syncUnreadBadge, writeLocalMessages]);

  const loadDemo = React.useCallback(() => {
    if (!partnerId) return;
    const url = new URL("/api/messages", window.location.origin);
    url.searchParams.set("partnerId", partnerId);
    url.searchParams.set("limit", "250");
    url.searchParams.set("demo", "1");
    fetch(url)
      .then((r) => r.json())
      .then((j) => setMessages(j.messages || []))
      .catch(() => setMessages([]));
  }, [partnerId]);

  // Pull local properties (created/used elsewhere in the portal) for the New Thread picker.
  // NOTE: Must be declared before any early returns to keep hook order stable.
  const propertyOptions = React.useMemo(() => {
    if (typeof window === "undefined") return [] as Array<{ id?: string; ownerName?: string; address: string }>;
    const keys = ["hw_props_client_v1", "hw_props_custom_v1"];
    const out: Array<{ id?: string; ownerName?: string; address: string }> = [];
    try {
      for (const k of keys) {
        const raw = window.localStorage.getItem(k) || "[]";
        const arr = (JSON.parse(raw) as any[]) || [];
        for (const p of arr) {
          if (!p || typeof p.address !== "string") continue;
          out.push({
            id: typeof p.id === "string" ? p.id : undefined,
            ownerName: typeof p.ownerName === "string" ? p.ownerName : undefined,
            address: p.address,
          });
        }
      }
    } catch {}
    // de-dupe
    const seen = new Set<string>();
    return out.filter((p) => {
      const key = `${(p.id || "").trim()}|${(p.ownerName || "").trim()}|${p.address.trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, []);

  if (!partnerId) {
    return (
      <div className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-4 text-sm text-[var(--hw-muted)]">
        Missing partner context. Open your partner link first (e.g. <span className="font-semibold">/p/frj</span>) or use <span className="font-semibold">?demo=1</span>.
      </div>
    );
  }

  if (messages === null) {
    return (
      <div className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-5 text-sm text-[var(--hw-muted)]">
        Loading messages…
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
      {newOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setNewOpen(false)} aria-label="Close" />
          <Card className="relative w-full max-w-xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-[var(--hw-ink)]">Start a new thread</div>
                <div className="mt-1 text-sm text-[var(--hw-muted)]">Create a message thread tied to an owner + property.</div>
              </div>
              <button
                type="button"
                className="rounded-full border border-[var(--hw-line)] bg-white px-4 py-2 text-xs font-semibold text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]"
                onClick={() => setNewOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              {propertyOptions.length ? (
                <div className="grid gap-1">
                  <div className="text-xs font-semibold text-[var(--hw-muted)]">Choose from Properties</div>
                  <select
                    className="h-10 w-full rounded-[14px] border border-[var(--hw-line)] bg-white px-3 text-sm font-semibold text-[var(--hw-ink)] outline-none focus:border-[rgba(229,57,53,.35)] focus:ring-4 focus:ring-[rgba(229,57,53,.10)]"
                    value={""}
                    onChange={(e) => {
                      const idx = Number(e.target.value);
                      const opt = Number.isFinite(idx) ? propertyOptions[idx] : null;
                      if (!opt) return;
                      setNewOwnerName(opt.ownerName || "");
                      setNewPropertyAddress(opt.address || "");
                      setNewPropertyId(opt.id || "");
                    }}
                  >
                    <option value="" disabled>
                      Select a property…
                    </option>
                    {propertyOptions.map((p, idx) => (
                      <option key={idx} value={String(idx)}>
                        {(p.ownerName ? `${p.ownerName} — ` : "") + p.address}
                      </option>
                    ))}
                  </select>
                  <div className="text-[11px] font-semibold text-[var(--hw-muted)]">
                    Pulls from your saved Properties in this browser.
                  </div>
                </div>
              ) : null}

              <div className="grid gap-1">
                <div className="text-xs font-semibold text-[var(--hw-muted)]">Owner name</div>
                <input
                  value={newOwnerName}
                  onChange={(e) => setNewOwnerName(e.target.value)}
                  placeholder="e.g. Desyi Mejia"
                  className="h-10 w-full rounded-[14px] border border-[var(--hw-line)] bg-[var(--hw-soft)] px-3 text-sm outline-none focus:border-[rgba(229,57,53,.35)] focus:ring-4 focus:ring-[rgba(229,57,53,.10)]"
                />
              </div>

              <div className="grid gap-1">
                <div className="text-xs font-semibold text-[var(--hw-muted)]">Property address</div>
                <input
                  value={newPropertyAddress}
                  onChange={(e) => setNewPropertyAddress(e.target.value)}
                  placeholder="e.g. 2310 Cuyler Avenue, Berwyn, IL 60402"
                  className="h-10 w-full rounded-[14px] border border-[var(--hw-line)] bg-[var(--hw-soft)] px-3 text-sm outline-none focus:border-[rgba(229,57,53,.35)] focus:ring-4 focus:ring-[rgba(229,57,53,.10)]"
                />
              </div>

              <div className="grid gap-1">
                <div className="text-xs font-semibold text-[var(--hw-muted)]">Thread title (optional)</div>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Seller credits packet"
                  className="h-10 w-full rounded-[14px] border border-[var(--hw-line)] bg-[var(--hw-soft)] px-3 text-sm outline-none focus:border-[rgba(229,57,53,.35)] focus:ring-4 focus:ring-[rgba(229,57,53,.10)]"
                />
              </div>

              <div className="grid gap-1">
                <div className="text-xs font-semibold text-[var(--hw-muted)]">First message</div>
                <textarea
                  value={newFirstMessage}
                  onChange={(e) => setNewFirstMessage(e.target.value)}
                  placeholder="Write the first message…"
                  className="min-h-[96px] w-full resize-none rounded-[14px] border border-[var(--hw-line)] bg-[var(--hw-soft)] px-3 py-3 text-sm outline-none focus:border-[rgba(229,57,53,.35)] focus:ring-4 focus:ring-[rgba(229,57,53,.10)]"
                />
              </div>

              <div className="mt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="xs"
                  onClick={() => {
                    setNewOwnerName("");
                    setNewPropertyAddress("");
                    setNewPropertyId("");
                    setNewTitle("");
                    setNewFirstMessage("");
                  }}
                >
                  Clear
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="xs"
                  disabled={!newOwnerName.trim() || !newPropertyAddress.trim() || !newFirstMessage.trim()}
                  onClick={() => {
                    const threadId = `thread_${Math.random().toString(36).slice(2, 10)}`;
                    fetch("/api/messages", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        action: "send",
                        partnerId,
                        threadId,
                        fromRole: "PARTNER",
                        fromName: profile.fullName || "",
                        text: newFirstMessage.trim(),
                        threadTitle: newTitle.trim() || undefined,
                        propertyAddress: newPropertyAddress.trim(),
                        ownerName: newOwnerName.trim(),
                        propertyId: newPropertyId.trim() || undefined,
                      }),
                    })
                      .then(() => {
                        const now = new Date().toISOString();
                        // Optimistic local insert so threads never “disappear” even if mock API resets.
                        setMessages((prev) => {
                          const base = prev || [];
                          const next = [
                            {
                              id: `msg_local_${Math.random().toString(36).slice(2, 10)}`,
                              createdAt: now,
                              threadId,
                              threadTitle: newTitle.trim() || undefined,
                              propertyAddress: newPropertyAddress.trim(),
                              ownerName: newOwnerName.trim(),
                              propertyId: newPropertyId.trim() || null,
                              workOrderId: null,
                              reportId: null,
                              fromRole: "PARTNER",
                              fromName: profile.fullName || null,
                              body: newFirstMessage.trim(),
                              readAt: now,
                              attachments: [],
                            } as ApiMessage,
                            ...base,
                          ];
                          writeLocalMessages(next);
                          syncUnreadBadge(next);
                          return next;
                        });

                        setNewOpen(false);
                        setNewOwnerName("");
                        setNewPropertyAddress("");
                        setNewTitle("");
                        setNewFirstMessage("");
                        setNewPropertyId("");
                        setActiveThreadId(threadId);
                        reload();
                      })
                      .catch(() => {});
                  }}
                >
                  Create thread
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {/* Inbox */}
      <Card className="overflow-hidden">
        <div className="border-b border-[var(--hw-line)] px-4 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-[var(--hw-ink)]">Inbox</div>
              {unreadThreadsCount ? <Chip className="border-[rgba(229,57,53,.25)] bg-[rgba(229,57,53,.06)] text-[var(--hw-red)]">{unreadThreadsCount} unread</Chip> : null}
              {needsAttentionCount ? <Chip>{needsAttentionCount} needs attention</Chip> : null}
            </div>

            <div className="flex items-center gap-1.5">
              <Button type="button" variant="primary" size="xs" onClick={() => setNewOpen(true)}>
                + New
              </Button>
              <Button type="button" variant="secondary" size="xs" onClick={loadDemo}>
                Demo
              </Button>
              <Button type="button" variant="ghost" size="xs" onClick={reload}>
                Refresh
              </Button>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search threads…"
              className="h-9 w-full rounded-full border border-[var(--hw-line)] bg-[var(--hw-soft)] px-3 text-sm outline-none focus:border-[rgba(229,57,53,.35)] focus:ring-4 focus:ring-[rgba(229,57,53,.10)]"
            />

            <div className="flex w-full items-center gap-1 rounded-full border border-[var(--hw-line)] bg-white p-1">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={
                  "h-8 flex-1 rounded-full px-3 text-xs font-semibold transition " +
                  (filter === "all" ? "bg-[rgba(229,57,53,.10)] text-[var(--hw-red)]" : "text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]")
                }
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilter("unread")}
                className={
                  "h-8 flex-1 rounded-full px-3 text-xs font-semibold transition " +
                  (filter === "unread" ? "bg-[rgba(229,57,53,.10)] text-[var(--hw-red)]" : "text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]")
                }
              >
                Unread
              </button>
              <button
                type="button"
                onClick={() => setFilter("needs_attention")}
                className={
                  "h-8 flex-1 rounded-full px-3 text-xs font-semibold transition " +
                  (filter === "needs_attention" ? "bg-[rgba(229,57,53,.10)] text-[var(--hw-red)]" : "text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]")
                }
              >
                Needs attention
              </button>
            </div>
          </div>
        </div>

        <div className="max-h-[66vh] overflow-y-auto p-2">
          {!threads.length ? (
            <div className="rounded-[14px] border border-dashed border-[var(--hw-line)] bg-[var(--hw-soft)] p-4 text-sm text-[var(--hw-muted)]">
              No threads yet. Create one, or load demo.
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" variant="primary" size="xs" onClick={() => setNewOpen(true)}>
                  New thread
                </Button>
                <Button type="button" variant="secondary" size="xs" onClick={loadDemo}>
                  Load demo
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-1">
              {threads.map((t) => {
                const selected = t.threadId === activeThreadId;
                return (
                  <button
                    key={t.threadId}
                    type="button"
                    onClick={() => setActiveThreadId(t.threadId)}
                    className={
                      "w-full rounded-[14px] px-3 py-3 text-left transition " +
                      (selected ? "bg-[rgba(229,57,53,.08)]" : "hover:bg-[var(--hw-soft)]")
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className={cn("truncate text-sm font-semibold", selected ? "text-[var(--hw-red)]" : "text-[var(--hw-ink)]")}>
                            {t.ownerName || t.title}
                          </div>
                          {t.unread ? (
                            <Chip className="border-[rgba(229,57,53,.35)] bg-[rgba(229,57,53,.06)] text-[var(--hw-red)]">{t.unreadCount}</Chip>
                          ) : null}
                          {t.needsAttention ? <Chip>Needs attention</Chip> : null}
                        </div>
                        {t.propertyAddress ? (
                          <div className="mt-0.5 truncate text-xs font-medium text-[var(--hw-muted)]">{t.propertyAddress}</div>
                        ) : null}
                        <div className="mt-1 truncate text-xs text-[var(--hw-muted)]">{t.last?.body || ""}</div>
                      </div>
                      <div className="shrink-0 text-[11px] font-semibold text-[var(--hw-muted)]">{t.last ? timeAgo(t.last.createdAt) : ""}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Thread */}
      <Card className="overflow-hidden">
        <div className="border-b border-[var(--hw-line)] px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <div className="text-sm font-semibold text-[var(--hw-ink)]">
                  {active?.ownerName || active?.title || "Conversation"}
                </div>
                {active?.title && active.ownerName ? (
                  <div className="text-xs font-semibold text-[var(--hw-muted)]">{active.title}</div>
                ) : null}
              </div>

              {active?.propertyAddress ? (
                <div className="mt-1 truncate text-sm text-[var(--hw-muted)]">{active.propertyAddress}</div>
              ) : (
                <div className="mt-1 text-sm text-[var(--hw-muted)]">Select a thread to view messages.</div>
              )}

              <div className="mt-2 flex flex-wrap gap-2">
                {active?.propertyId ? (
                  <a
                    href={`/pro/properties/${encodeURIComponent(active.propertyId)}`}
                    className="rounded-full border border-[var(--hw-line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]"
                  >
                    Property
                  </a>
                ) : null}
                {active?.workOrderId ? (
                  <a
                    href={`/pro/jobs/${encodeURIComponent(active.workOrderId)}`}
                    className="rounded-full border border-[var(--hw-line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]"
                  >
                    Job
                  </a>
                ) : null}
                {active?.reportId ? (
                  <a
                    href={`/pro/express-estimate/${encodeURIComponent(active.reportId)}`}
                    className="rounded-full border border-[var(--hw-line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]"
                  >
                    Report
                  </a>
                ) : null}
              </div>
            </div>
            <div className="shrink-0 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="xs"
                onClick={() => {
                  setComposer("Can you upload 2–3 photos of the area + 1 wide shot so we can tighten the price range?");
                }}
              >
                Photos
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="xs"
                onClick={() => {
                  setComposer(
                    "Quick update: we’re lining up the next step now. What deadline are you working against (inspection response / attorney review / closing)?"
                  );
                }}
              >
                Deadline
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="xs"
                onClick={() => {
                  setComposer(
                    "I can package this into a clean seller-credits summary (Safety + Repairs + assumptions). Want that as a PDF?"
                  );
                }}
              >
                Packet
              </Button>
            </div>
          </div>
        </div>

        <div className="max-h-[56vh] overflow-y-auto bg-white p-5">
          <div className="grid gap-3">
            {(active?.messages || []).map((m) => {
              const mine = m.fromRole === "PARTNER";
              return (
                <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div
                    className={
                      "max-w-[640px] rounded-[18px] px-4 py-3 text-sm leading-relaxed shadow-sm " +
                      (mine
                        ? "bg-[rgba(229,57,53,.10)] text-[var(--hw-ink)] border border-[rgba(229,57,53,.18)]"
                        : "bg-[var(--hw-soft)] text-[var(--hw-ink)] border border-[var(--hw-line)]")
                    }
                  >
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">{m.fromRole}</div>
                      <div className="text-[11px] font-semibold text-[var(--hw-muted)]">{timeAgo(m.createdAt)}</div>
                    </div>
                    <div className="whitespace-pre-wrap">{m.body}</div>

                    {Array.isArray((m as any).attachments) && (m as any).attachments.length ? (
                      <div className="mt-3 grid gap-2">
                        {(m as any).attachments.map((a: any) => (
                          <a
                            key={a.id || a.url}
                            href={a.url}
                            target="_blank"
                            rel="noreferrer"
                            className="overflow-hidden rounded-[14px] border border-[var(--hw-line)] bg-white"
                            title={a.fileName || "Attachment"}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={a.url} alt={a.fileName || "Attachment"} className="h-40 w-full object-cover" />
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Divider />
        <div className="p-4">
          <form
            className="grid gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const text = composer.trim();
              if ((!text && pendingFiles.length === 0) || !active) return;

              try {
                const now = new Date().toISOString();

                // Optimistic local insert first (prevents “vanish” if mock store resets between requests)
                setMessages((prev) => {
                  const base = prev || [];
                  const next = [
                    {
                      id: `msg_local_${Math.random().toString(36).slice(2, 10)}`,
                      createdAt: now,
                      threadId: active.threadId,
                      threadTitle: active.title,
                      propertyAddress: active.propertyAddress,
                      ownerName: active.ownerName,
                      propertyId: active.propertyId || null,
                      workOrderId: active.workOrderId || null,
                      reportId: active.reportId || null,
                      fromRole: "PARTNER",
                      fromName: profile.fullName || null,
                      body: text,
                      readAt: now,
                      attachments: [],
                    } as ApiMessage,
                    ...base,
                  ];
                  writeLocalMessages(next);
                  syncUnreadBadge(next);
                  return next;
                });

                const r = await fetch("/api/messages", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    action: "send",
                    partnerId,
                    threadId: active.threadId,
                    fromRole: "PARTNER",
                    fromName: profile.fullName || "",
                    text,
                    threadTitle: active.title,
                    propertyAddress: active.propertyAddress,
                    ownerName: active.ownerName,
                    propertyId: active.propertyId || undefined,
                    workOrderId: active.workOrderId || undefined,
                    reportId: active.reportId || undefined,
                  }),
                });
                const j = await r.json();
                const messageId = String(j.messageId || "");

                if (messageId && pendingFiles.length) {
                  for (const f of pendingFiles) {
                    const fd = new FormData();
                    fd.set("messageId", messageId);
                    fd.set("file", f);
                    await fetch("/api/messages/upload", { method: "POST", body: fd });
                  }
                }

                setComposer("");
                setPendingFiles([]);
                reload();
              } catch {
                // ignore
              }
            }}
          >
            {pendingFiles.length ? (
              <div className="flex flex-wrap gap-2">
                {pendingFiles.map((f, idx) => (
                  <div key={idx} className="inline-flex items-center gap-2 rounded-full border border-[var(--hw-line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--hw-ink)]">
                    <span className="max-w-[220px] truncate">{f.name}</span>
                    <button
                      type="button"
                      className="text-[var(--hw-muted)] hover:text-[var(--hw-ink)]"
                      onClick={() => setPendingFiles((prev) => prev.filter((_, i) => i !== idx))}
                      aria-label="Remove attachment"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex items-end gap-2">
              <textarea
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
                placeholder="Write a message…"
                className="min-h-[44px] flex-1 resize-none rounded-[18px] border border-[var(--hw-line)] bg-[var(--hw-soft)] px-4 py-3 text-sm outline-none focus:border-[rgba(229,57,53,.35)] focus:ring-4 focus:ring-[rgba(229,57,53,.10)]"
              />
              <label className="inline-flex h-[44px] cursor-pointer select-none items-center justify-center gap-2 rounded-full border border-[var(--hw-line)] bg-white px-5 text-sm font-semibold text-[var(--hw-ink)] shadow-sm transition hover:bg-[var(--hw-soft)] hover:border-[color-mix(in_srgb,var(--hw-line)_80%,transparent)] active:scale-[.97]">
                Attach
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length) setPendingFiles((prev) => [...prev, ...files].slice(0, 6));
                    e.currentTarget.value = "";
                  }}
                />
              </label>
              <Button type="submit" variant="primary" size="md">
                Send
              </Button>
            </div>
          </form>
          <div className="mt-2 text-[11px] font-semibold text-[var(--hw-muted)]">
            Attachments require Vercel Blob config (BLOB_READ_WRITE_TOKEN). In demo mode, use “Load demo.”
          </div>
        </div>
      </Card>
    </div>
  );
}
