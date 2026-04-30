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
      {
        label: "Matching",
        text: "We match your request with qualified, vetted providers in your area.",
      },
      {
        label: "Updates",
        text: "You will receive updates by email as the request moves forward.",
      },
      {
        label: "Control",
        text: "Review, approve, and schedule from your dashboard.",
      },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <Container className="py-16 md:py-20 lg:py-24">
        {/* ── Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
                Confirmed
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-[var(--hw-ink)] sm:text-3xl md:text-4xl md:leading-[1.15]">
              You&rsquo;re all set.
              <br className="hidden sm:block" />{" "}
              Here&rsquo;s what happens next.
            </h1>

            <p className="mt-3 text-base leading-relaxed text-[var(--hw-muted)] md:text-lg">
              Trust-first, no friction. You stay in control.
            </p>
          </div>

          <Pill>Next steps</Pill>
        </div>

        {/* ── Body grid ── */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Steps card */}
          <Card className="space-y-6 p-6 sm:p-8 lg:col-span-2">
            <h2 className="text-base font-bold tracking-tight text-[var(--hw-ink)]">
              What happens next
            </h2>

            <ol className="grid gap-4">
              {lines.map((step, i) => (
                <li
                  key={step.label}
                  className="flex gap-4 rounded-[var(--hw-radius)] border border-[var(--hw-line)] bg-white p-5 transition-shadow hover:shadow-sm"
                >
                  {/* Step number */}
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--hw-ink)] text-xs font-bold text-white">
                    {i + 1}
                  </span>

                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
                      {step.label}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--hw-muted)]">
                      {step.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            {/* Single primary action */}
            <div className="pt-2">
              <Link href="/ho/dashboard">
                <Button className="w-full sm:w-auto">
                  Go to Your Dashboard
                </Button>
              </Link>
            </div>
          </Card>

          {/* Summary card */}
          <Card className="self-start p-6 sm:p-8">
            <h2 className="text-base font-bold tracking-tight text-[var(--hw-ink)]">
              Request summary
            </h2>

            {session ? (
              <dl className="mt-5 space-y-4 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
                    Service
                  </dt>
                  <dd className="mt-0.5 font-medium text-[var(--hw-ink)]">
                    {session.service}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
                    Provider
                  </dt>
                  <dd className="mt-0.5 font-medium text-[var(--hw-ink)]">
                    {session.providerName}
                  </dd>
                </div>

                {session.workOrderId ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
                      Work Order
                    </dt>
                    <dd className="mt-0.5 font-medium text-[var(--hw-ink)]">
                      {session.workOrderId}
                    </dd>
                  </div>
                ) : null}

                <div>
                  <dt className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
                    Requested
                  </dt>
                  <dd className="mt-0.5 font-medium text-[var(--hw-ink)]">
                    {session.date}{" "}
                    <span className="font-normal text-[var(--hw-muted)]">
                      ({session.window})
                    </span>
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
                    Email
                  </dt>
                  <dd className="mt-0.5 font-medium text-[var(--hw-ink)]">
                    {session.email}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-5 text-sm leading-relaxed text-[var(--hw-muted)]">
                No session found. Continue to dashboard.
              </p>
            )}
          </Card>
        </div>
      </Container>
    </div>
  );
}
