"use client";
import { SP_NAV } from "@/components/sp/nav";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button, Card, Container, Divider, EmptyState, Input } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";
import { StatusChip } from "@/components/dashboard/ListRow";

type Msg = {
  id: string;
  createdAt: string;
  fromRole: string;
  body: string;
  ownerName?: string;
  propertyAddress?: string;
  threadTitle?: string;
};

function fmtTime(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function ServiceProviderThreadPage({ params }: { params: { threadId: string } }) {
  const threadId = params.threadId;
  const [items, setItems] = useState<Msg[] | null>(null);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");

  async function reload() {
    const res = await fetch(`/api/hg/messages/thread/${encodeURIComponent(threadId)}?demo=1`);
    const j = (await res.json().catch(() => null)) as any;
    setItems(Array.isArray(j?.messages) ? (j.messages as Msg[]) : []);
  }

  useEffect(() => {
    reload();
    const id = window.setInterval(reload, 4000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  const meta = useMemo(() => {
    const first = (items || [])[0];
    return {
      title: first?.threadTitle || "Thread",
      owner: first?.ownerName || "",
      address: first?.propertyAddress || "",
    };
  }, [items]);

  return (
    <PortalShell role="SP" title="Service Provider" nav={SP_NAV}>
      <Container>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Messages</div>
            <div className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">{meta.title}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--hw-muted)]">
              <span className="font-mono text-xs">{threadId}</span>
              {meta.owner ? <StatusChip>{meta.owner}</StatusChip> : null}
            </div>
            {meta.address ? <div className="mt-1 text-sm text-[var(--hw-muted)]">{meta.address}</div> : null}
          </div>
          <Link href="/sp/messages" className="no-underline">
            <Button variant="secondary">Back</Button>
          </Link>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2">
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Thread</div>
            <div className="mt-4 grid gap-3">
              {items === null ? (
                <div className="text-sm text-[var(--hw-muted)]">Loading…</div>
              ) : items.length === 0 ? (
                <EmptyState title="No messages" text="This thread is empty." />
              ) : (
                items.map((m) => (
                  <div key={m.id} className="rounded-2xl border border-[var(--hw-line)] bg-white px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">{m.fromRole}</div>
                      <div className="text-xs text-[var(--hw-muted)]">{fmtTime(m.createdAt)}</div>
                    </div>
                    <div className="mt-2 whitespace-pre-wrap text-sm text-[var(--hw-ink)]">{m.body}</div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Reply</div>
            <div className="mt-3 grid gap-2">
              <Input value={text} onChange={(e) => setText(e.currentTarget.value)} placeholder="Write a reply…" />
              <Button
                disabled={!text.trim() || sending}
                onClick={async () => {
                  const t = text.trim();
                  if (!t) return;
                  setSending(true);
                  try {
                    await fetch(`/api/hg/messages/thread/${encodeURIComponent(threadId)}`, {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ demo: true, text: t }),
                    });
                    setText("");
                    await reload();
                  } finally {
                    setSending(false);
                  }
                }}
              >
                {sending ? "Sending…" : "Send"}
              </Button>
              <Divider className="my-2" />
              <div className="text-xs text-[var(--hw-muted)]">Demo mode: replies are stored in the demo store.</div>
            </div>
          </Card>
        </div>
      </Container>
    </PortalShell>
  );
}
