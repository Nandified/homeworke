"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button, Card, EmptyState, Pill } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";

const nav = [
  { href: "/ho/dashboard", label: "Dashboard" },
  { href: "/ho/messages", label: "Messages" },
  { href: "/ho/properties", label: "My Properties" },
  { href: "/ho/pro-team", label: "Pro Team" },
  { href: "/ho/support", label: "Support" },
  { href: "/ho/account", label: "My Account" },
];

type Session = {
  token: string;
  jobId: string;
  email: string;
  service: string;
  providerName: string;
  date: string;
  window: string;
};

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem("hw_session_v1");
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export default function Page() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    setSession(loadSession());
  }, []);

  return (
    <PortalShell role="HO" title="Homeowner" nav={nav}>
      <div className="grid gap-4">
        {session ? (
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm font-semibold">Your latest request</div>
              <Pill>Status: Pending</Pill>
            </div>
            <div className="mt-3 text-sm leading-7 text-[var(--hw-muted)]">
              <div>
                <span className="font-semibold text-[var(--hw-ink)]">Service:</span> {session.service}
              </div>
              <div>
                <span className="font-semibold text-[var(--hw-ink)]">Provider:</span> {session.providerName}
              </div>
              <div>
                <span className="font-semibold text-[var(--hw-ink)]">Requested:</span> {session.date} ({session.window})
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/marketplace/intake"><Button>Submit Work Order</Button></Link>
              <Button variant="secondary">Request Express Estimate</Button>
              <Button variant="ghost">Chat with Pro Team</Button>
            </div>
          </Card>
        ) : (
          <EmptyState
            title="No active services"
            text="Start by requesting service in the marketplace. Capture happens at scheduling confirmation."
            action={
              <Link href="/marketplace/request">
                <Button>Request service</Button>
              </Link>
            }
          />
        )}
      </div>
    </PortalShell>
  );
}
