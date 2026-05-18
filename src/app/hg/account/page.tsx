"use client";
import { HG_NAV } from "@/components/hg/nav";

import { useMemo } from "react";

import { Button, Card, Container, Pill } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";

export default function HomeGuideAccountPage() {
  const user = useMemo(() => {
    // Best-effort display only (until auth/session role is fully wired)
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem("hw_session_v1");
      return raw ? (JSON.parse(raw) as any) : null;
    } catch {
      return null;
    }
  }, []);

  return (
    <PortalShell role="HG" title="Home Guide" nav={HG_NAV} description="Account & preferences." >
      <Container>
        <div className="text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">My Account</div>
        <div className="mt-1 text-sm text-[var(--hw-muted)]">Basic profile display (v1). Preferences and notifications next.</div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Profile</div>
            <div className="mt-4 grid gap-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[var(--hw-muted)]">Portal role</div>
                <Pill>HG</Pill>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="text-[var(--hw-muted)]">Email</div>
                <div className="font-semibold text-[var(--hw-ink)]">{String(user?.email || "—")}</div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="text-[var(--hw-muted)]">Session token</div>
                <div className="font-mono text-xs text-[var(--hw-muted)] truncate max-w-[220px]">{String(user?.token || "—")}</div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Preferences</div>
            <div className="mt-2 text-sm text-[var(--hw-muted)]">Coming next: notification preferences (email/SMS) + team visibility.</div>
            <div className="mt-4">
              <Button variant="secondary" disabled>
                Edit preferences (coming soon)
              </Button>
            </div>
          </Card>
        </div>
      </Container>
    </PortalShell>
  );
}
