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

  React.useEffect(() => {
    if (!partnerId) return;
    const url = new URL("/api/messages", window.location.origin);
    url.searchParams.set("partnerId", partnerId);
    url.searchParams.set("limit", "30");
    if (isDemoMode()) url.searchParams.set("demo", "1");

    fetch(url)
      .then((r) => r.json())
      .then((j) => setMessages(j.messages || []))
      .catch(() => setMessages([]));
  }, [partnerId]);

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
    <div className="grid gap-3">
      {messages.map((m) => (
        <Card key={m.id} className={cn("p-5", !m.readAt ? "border-[rgba(229,57,53,.35)]" : "")}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-[var(--hw-ink)]">Thread {m.threadId.replace("thread_", "#")}</div>
                {!m.readAt ? <Chip className="border-[rgba(229,57,53,.35)] bg-[rgba(229,57,53,.06)] text-[var(--hw-red)]">Unread</Chip> : null}
                <Chip>{m.fromRole}</Chip>
              </div>
              <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">{m.body}</div>
            </div>
            <div className="shrink-0 text-xs font-medium text-[var(--hw-muted)]">{timeAgo(m.createdAt)}</div>
          </div>
          <Divider className="my-4" />
          <div className="flex flex-wrap gap-2">
            <button className="rounded-full border border-[var(--hw-line)] bg-white px-4 py-2 text-xs font-semibold text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]">
              Draft reply
            </button>
            <button className="rounded-full border border-[var(--hw-line)] bg-white px-4 py-2 text-xs font-semibold text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]">
              Request photos
            </button>
            <button className="rounded-full border border-[var(--hw-line)] bg-white px-4 py-2 text-xs font-semibold text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]">
              Mark read (stub)
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}
