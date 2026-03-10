"use client";

import { useEffect, useMemo, useState } from "react";

import { Button, Card, EmptyState, Input } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";

const nav = [
  { href: "/office/dashboard", label: "Dashboard" },
  { href: "/office/partners", label: "Partners" },
  { href: "/office/work-orders", label: "Work Orders" },
  { href: "/office/messages", label: "Messages" },
  { href: "/office/support", label: "Support" },
  { href: "/office/account", label: "Office Settings" },
];

type MemberRow = {
  userId: string;
  email: string;
  role: string;
  createdAt: string;
};

type InviteRow = {
  id: string;
  email: string;
  role: string;
  token: string;
  createdAt: string;
  expiresAt: string;
};

export default function OfficePartnersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [officeName, setOfficeName] = useState<string>("Office");
  const [officeId, setOfficeId] = useState<string>("");
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);

  const [inviteEmail, setInviteEmail] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/office/partners");
        const j = (await res.json()) as any;
        if (!res.ok || !j?.ok) throw new Error(j?.error || "failed_to_load");

        if (!cancelled) {
          setOfficeName(j.office?.name || "Office");
          setOfficeId(j.office?.id || "");
          setMembers(j.members || []);
          setInvites(j.invites || []);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message || "Unable to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const inviteLinkHint = useMemo(() => {
    if (!invites[0]?.token) return null;
    return `/office/invite/accept?invite=${encodeURIComponent(invites[0].token)}`;
  }, [invites]);

  async function requestInvite() {
    try {
      setError(null);
      const res = await fetch("/api/office/invites/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ officeId, email: inviteEmail, role: "MEMBER" }),
      });
      const j = (await res.json().catch(() => null)) as any;
      if (!res.ok || !j?.ok) throw new Error(j?.error || "failed_to_invite");

      // refresh list
      const reload = await fetch("/api/office/partners");
      const rj = (await reload.json()) as any;
      if (reload.ok && rj?.ok) {
        setInvites(rj.invites || []);
        setMembers(rj.members || []);
      }

      setInviteEmail("");
    } catch (e) {
      setError((e as Error).message || "Unable to send invite");
    }
  }

  return (
    <PortalShell role="OFFICE" title={officeName} nav={nav} description="Office membership and partner seats (Phase 2).">
      <div className="grid gap-6">
        <Card className="p-6">
          <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Invite a partner</div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="partner@company.com"
              className="sm:max-w-sm"
            />
            <Button onClick={requestInvite} disabled={!officeId || !inviteEmail.includes("@")}>
              Send invite
            </Button>
          </div>
          <div className="mt-2 text-xs text-[var(--hw-muted)]">
            v1: invite links are printed to server logs. (Email delivery later.)
          </div>
          {inviteLinkHint ? <div className="mt-2 text-xs text-[var(--hw-muted)]">Example accept URL: {inviteLinkHint}</div> : null}
          {error ? <div className="mt-3 text-sm text-red-700">{error}</div> : null}
        </Card>

        <Card className="p-6">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Members</div>
              <div className="mt-1 text-sm text-[var(--hw-muted)]">Users with access to this office.</div>
            </div>
            <div className="text-sm font-semibold text-[var(--hw-ink)]">{loading ? "—" : members.length}</div>
          </div>

          {loading ? (
            <div className="mt-4 text-sm text-[var(--hw-muted)]">Loading…</div>
          ) : members.length === 0 ? (
            <div className="mt-6">
              <EmptyState title="No members yet" text="Create an invite to add partners to this office." />
            </div>
          ) : (
            <div className="mt-4 grid gap-2">
              {members.map((m) => (
                <div key={m.userId} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--hw-radius)] border border-[var(--hw-line)] bg-white px-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[var(--hw-ink)]">{m.email}</div>
                    <div className="text-xs text-[var(--hw-muted)]">Joined {new Date(m.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">{m.role}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Pending invites</div>
              <div className="mt-1 text-sm text-[var(--hw-muted)]">Invites not yet accepted.</div>
            </div>
            <div className="text-sm font-semibold text-[var(--hw-ink)]">{loading ? "—" : invites.length}</div>
          </div>

          {loading ? (
            <div className="mt-4 text-sm text-[var(--hw-muted)]">Loading…</div>
          ) : invites.length === 0 ? (
            <div className="mt-6">
              <EmptyState title="No pending invites" text="Send an invite above to add a partner." />
            </div>
          ) : (
            <div className="mt-4 grid gap-2">
              {invites.map((i) => (
                <div key={i.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--hw-radius)] border border-[var(--hw-line)] bg-white px-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[var(--hw-ink)]">{i.email}</div>
                    <div className="text-xs text-[var(--hw-muted)]">Expires {new Date(i.expiresAt).toLocaleDateString()}</div>
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">{i.role}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PortalShell>
  );
}
