"use client";

import * as React from "react";

import { Card, Chip, Divider } from "@/components/ui";
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
  fromRole: string;
  body: string;
  readAt?: string | null;
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
  const [messages, setMessages] = React.useState<ApiMessage[] | null>(null);
  const [activeThreadId, setActiveThreadId] = React.useState<string>("");
  const [composer, setComposer] = React.useState<string>("");

  const reload = React.useCallback(() => {
    if (!partnerId) return;
    const url = new URL("/api/messages", window.location.origin);
    url.searchParams.set("partnerId", partnerId);
    url.searchParams.set("limit", "250");
    if (isDemoMode()) url.searchParams.set("demo", "1");

    fetch(url)
      .then((r) => r.json())
      .then((j) => setMessages(j.messages || []))
      .catch(() => setMessages([]));
  }, [partnerId]);

  React.useEffect(() => {
    reload();
  }, [reload]);

  const threads = React.useMemo(() => {
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
      return { threadId, messages: sorted, last, unread, ownerName, propertyAddress, title };
    });

    out.sort((a, b) => (b.last ? new Date(b.last.createdAt).getTime() : 0) - (a.last ? new Date(a.last.createdAt).getTime() : 0));
    return out;
  }, [messages]);

  React.useEffect(() => {
    if (activeThreadId) return;
    if (threads.length) setActiveThreadId(threads[0].threadId);
  }, [threads, activeThreadId]);

  const active = threads.find((t) => t.threadId === activeThreadId) || null;

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

  if (!messages.length) return <>{props.empty}</>;

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
      {/* Inbox */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--hw-line)] px-4 py-3">
          <div className="text-sm font-semibold text-[var(--hw-ink)]">Inbox</div>
          <button
            type="button"
            className="rounded-full border border-[var(--hw-line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]"
            onClick={reload}
          >
            Refresh
          </button>
        </div>

        <div className="max-h-[66vh] overflow-y-auto p-2">
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
                          <Chip className="border-[rgba(229,57,53,.35)] bg-[rgba(229,57,53,.06)] text-[var(--hw-red)]">Unread</Chip>
                        ) : null}
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
        </div>
      </Card>

      {/* Thread */}
      <Card className="overflow-hidden">
        <div className="border-b border-[var(--hw-line)] px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[var(--hw-ink)]">{active?.ownerName || active?.title || "Thread"}</div>
              {active?.propertyAddress ? <div className="mt-1 truncate text-sm text-[var(--hw-muted)]">{active.propertyAddress}</div> : null}
              {active?.title && active.ownerName ? <div className="mt-1 text-xs font-semibold text-[var(--hw-muted)]">{active.title}</div> : null}
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <button className="rounded-full border border-[var(--hw-line)] bg-white px-3 py-2 text-xs font-semibold text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]">
                Request photos
              </button>
              <button className="rounded-full border border-[var(--hw-line)] bg-white px-3 py-2 text-xs font-semibold text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]">
                Create task
              </button>
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
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Divider />
        <div className="p-4">
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const text = composer.trim();
              if (!text || !active) return;

              // Demo-only send: hit the same endpoint to append to the mock store.
              fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  partnerId,
                  threadId: active.threadId,
                  fromRole: "PARTNER",
                  text,
                  threadTitle: active.title,
                  propertyAddress: active.propertyAddress,
                  ownerName: active.ownerName,
                }),
              })
                .then(() => {
                  setComposer("");
                  reload();
                })
                .catch(() => {
                  // ignore
                });
            }}
          >
            <textarea
              value={composer}
              onChange={(e) => setComposer(e.target.value)}
              placeholder="Write a message…"
              className="min-h-[44px] flex-1 resize-none rounded-[18px] border border-[var(--hw-line)] bg-[var(--hw-soft)] px-4 py-3 text-sm outline-none focus:border-[rgba(229,57,53,.35)] focus:ring-4 focus:ring-[rgba(229,57,53,.10)]"
            />
            <button
              type="submit"
              className="h-[44px] rounded-full bg-[var(--hw-red)] px-5 text-sm font-semibold text-white shadow-sm hover:opacity-95"
            >
              Send
            </button>
          </form>
          <div className="mt-2 text-[11px] font-semibold text-[var(--hw-muted)]">
            Demo UI: send appends to mock store when DB is disabled.
          </div>
        </div>
      </Card>
    </div>
  );
}
