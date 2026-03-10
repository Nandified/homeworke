"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button, Card, Container, Pill } from "@/components/ui";

type Session = {
  token: string;
  jobId: string;
  workOrderId?: string;
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

  const lines = useMemo(
    () => [
      "We match your request with qualified, vetted providers in your area.",
      "You will receive updates by email as the request moves forward.",
      "Review, approve, and schedule from your dashboard.",
    ],
    []
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <Container className="py-12 md:py-14">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Confirmed</div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">You are all set. Here is what happens next.</h1>
            <div className="mt-2 max-w-3xl text-sm leading-7 text-[var(--hw-muted)]">
              Trust-first, no friction. You stay in control.
            </div>
          </div>
          <Pill>Next steps</Pill>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="p-6 md:p-7 lg:col-span-2">
            <div className="text-sm font-semibold">What happens next</div>
            <div className="mt-4 grid gap-3">
              {lines.map((t, i) => (
                <div key={t} className="rounded-[var(--hw-radius)] border border-[var(--hw-line)] bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Step {i + 1}</div>
                  <div className="mt-1 text-sm leading-7 text-[var(--hw-muted)]">{t}</div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Link href="/ho/dashboard">
                <Button>Go to Your Dashboard</Button>
              </Link>
            </div>
          </Card>

          <Card className="p-6 md:p-7">
            <div className="text-sm font-semibold">Request summary</div>
            {session ? (
              <div className="mt-3 text-sm leading-7 text-[var(--hw-muted)]">
                <div>
                  <span className="font-semibold text-[var(--hw-ink)]">Service:</span> {session.service}
                </div>
                <div>
                  <span className="font-semibold text-[var(--hw-ink)]">Provider:</span> {session.providerName}
                </div>
                {session.workOrderId ? (
                  <div>
                    <span className="font-semibold text-[var(--hw-ink)]">Work order:</span> {session.workOrderId}
                  </div>
                ) : null}

                <div>
                  <span className="font-semibold text-[var(--hw-ink)]">Requested:</span> {session.date} ({session.window})
                </div>
                <div>
                  <span className="font-semibold text-[var(--hw-ink)]">Email:</span> {session.email}
                </div>
              </div>
            ) : (
              <div className="mt-3 text-sm leading-7 text-[var(--hw-muted)]">No session found. Continue to dashboard.</div>
            )}
          </Card>
        </div>
      </Container>
    </div>
  );
}
