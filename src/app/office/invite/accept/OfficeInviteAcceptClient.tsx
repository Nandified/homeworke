"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import Link from "next/link";

import { Button, Card, Container, Input } from "@/components/ui";

export function OfficeInviteAcceptClient() {
  const sp = useSearchParams();
  const inviteToken = sp.get("invite") || "";

  const [status, setStatus] = useState<"idle" | "accepting" | "accepted" | "needs-auth" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const nextPath = useMemo(() => {
    const t = inviteToken.trim();
    return t ? `/office/invite/accept?invite=${encodeURIComponent(t)}` : "/office/dashboard";
  }, [inviteToken]);

  useEffect(() => {
    if (!inviteToken) return;

    let cancelled = false;
    (async () => {
      try {
        setStatus("accepting");
        setError(null);

        const res = await fetch("/api/office/invites/accept", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ inviteToken }),
        });

        const j = (await res.json().catch(() => null)) as any;

        if (cancelled) return;

        if (res.status === 401) {
          setStatus("needs-auth");
          return;
        }

        if (!res.ok || !j?.ok) {
          setStatus("error");
          setError(j?.error || "Unable to accept invite");
          return;
        }

        setStatus("accepted");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setError("Unable to accept invite");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [inviteToken]);

  async function requestMagicLink() {
    setError(null);
    const res = await fetch("/api/auth/request-link", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, next: nextPath }),
    });

    const j = (await res.json().catch(() => null)) as any;
    if (!res.ok || !j?.ok) {
      setError(j?.error || "Unable to send magic link");
      return;
    }

    // v1: link is printed to server logs.
    setStatus("idle");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <Container className="py-14 md:py-20">
        <div className="max-w-xl">
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--hw-ink)] md:text-3xl">Accept office invite</h1>
          <p className="mt-2 text-sm text-[var(--hw-muted)]">
            This invite is magic-link compatible. If you're not signed in yet, we'll email you a link.
          </p>
        </div>

        <Card className="mt-8 max-w-xl p-6">
          {!inviteToken ? (
            <div className="text-sm text-[var(--hw-muted)]">Missing invite token.</div>
          ) : status === "accepted" ? (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-emerald-700">Invite accepted.</div>
              <Link href="/office/dashboard">
                <Button>Go to Office dashboard</Button>
              </Link>
            </div>
          ) : status === "needs-auth" ? (
            <div className="space-y-4">
              <div className="text-sm font-medium text-[var(--hw-ink)]">Sign in to accept</div>
              <div className="text-sm text-[var(--hw-muted)]">Enter the email address that received the invite.</div>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
              {error ? <div className="text-sm text-red-700">{error}</div> : null}
              <Button onClick={requestMagicLink} disabled={!email.includes("@")}>
                Email me a magic link
              </Button>
              <div className="text-xs text-[var(--hw-muted)]">
                Phase 2 v1: the link is printed in server logs (email delivery comes later).
              </div>
            </div>
          ) : status === "accepting" ? (
            <div className="text-sm text-[var(--hw-muted)]">Accepting invite…</div>
          ) : status === "error" ? (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-red-700">Unable to accept invite</div>
              <div className="text-sm text-[var(--hw-muted)]">{error}</div>
              <Link href="/">
                <Button variant="secondary">Back home</Button>
              </Link>
            </div>
          ) : (
            <div className="text-sm text-[var(--hw-muted)]">Waiting…</div>
          )}
        </Card>
      </Container>
    </div>
  );
}
