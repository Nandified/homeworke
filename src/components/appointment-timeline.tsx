"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { Button, Card, Container, Pill } from "@/components/ui";
import { iconFor } from "@/components/icons";
import spec from "@/content/appointment_timeline_opus.json";

type Step = (typeof spec.timelineStates)[number];

type LiveState = {
  stepKey: string;
  updatedAt: string;
  etaMinutes?: number;
  pmName?: string;
};

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export function AppointmentTimelinePage(props: { id: string }) {
  const steps = spec.timelineStates;

  const [live, setLive] = useState<LiveState>(() => ({
    stepKey: steps[0]?.key ?? "created",
    updatedAt: new Date().toISOString(),
    etaMinutes: 22,
    pmName: "Jordan Rivera",
  }));

  // v1: simulated real-time updates
  useEffect(() => {
    const order = steps.map((s) => s.key);
    let idx = Math.max(0, order.indexOf(live.stepKey));

    const timers: number[] = [];

    function advance(afterMs: number, nextKey: string, eta?: number) {
      const t = window.setTimeout(() => {
        setLive((prev) => ({
          ...prev,
          stepKey: nextKey,
          updatedAt: new Date().toISOString(),
          etaMinutes: eta,
        }));
      }, afterMs);
      timers.push(t);
    }

    // only simulate if we are at the start
    if (idx <= 0 && order.length >= 4) {
      // pm_assigned → pm_on_the_way → arrived → completed
      advance(2800, order[1], 18);
      advance(6000, order[2], 7);
      advance(9800, order[3], 0);
    }

    return () => timers.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeIndex = useMemo(() => steps.findIndex((s) => s.key === live.stepKey), [steps, live.stepKey]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <header className="sticky top-0 z-20 border-b border-[var(--hw-line)] bg-white/80 backdrop-blur">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-8 w-36">
              <Image
                src="/brand/Homeworke - Logo Main W Slogan (Black & Red).png"
                alt="Homeworke"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            <Link href="/marketplace">
              <Button variant="ghost">Marketplace</Button>
            </Link>
            <Link href="/homeowners">
              <Button variant="ghost">Homeowners</Button>
            </Link>
          </nav>
        </Container>
      </header>

      <main>
        <Container className="py-10">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">
                Appointment
              </div>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{spec.pageTitle}</h1>
              <div className="mt-2 text-sm text-[var(--hw-muted)]">Appointment ID: {props.id}</div>
            </div>
            <Pill>{spec.header.statusPill}</Pill>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="p-6 lg:col-span-2">
              <div className="text-sm font-semibold">{spec.header.title}</div>
              <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">{spec.header.subtitle}</div>

              <div className="mt-6 grid gap-3">
                {steps.map((s, i) => {
                  const Icon = iconFor(s.icon);
                  const isActive = i === activeIndex;
                  const isDone = i < activeIndex;

                  return (
                    <div
                      key={s.key}
                      className={[
                        "rounded-2xl border bg-white p-4 transition",
                        isActive
                          ? "border-[rgba(229,57,53,.35)] shadow-[0_10px_20px_rgba(229,57,53,.10)]"
                          : "border-[var(--hw-line)]",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={[
                            "rounded-2xl border p-2",
                            isActive
                              ? "border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.08)]"
                              : "border-[var(--hw-line)] bg-[var(--hw-soft)]",
                          ].join(" ")}
                        >
                          <Icon className={isActive ? "h-5 w-5 text-[var(--hw-red)]" : "h-5 w-5 text-[var(--hw-muted)]"} />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-sm font-semibold text-[var(--hw-ink)]">{s.label}</div>
                            <div className="text-xs text-[var(--hw-muted)]">
                              {isActive ? `Updated ${formatTime(live.updatedAt)}` : isDone ? "Completed" : ""}
                            </div>
                          </div>
                          <div className="mt-1 text-sm leading-6 text-[var(--hw-muted)]">{s.description}</div>
                          {isActive && s.key === "pm_on_the_way" ? (
                            <div className="mt-3 rounded-2xl border border-[var(--hw-line)] bg-[var(--hw-soft)] p-3 text-sm text-[var(--hw-muted)]">
                              ETA: {live.etaMinutes} minutes
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <div className="grid gap-4">
              <Card className="p-6">
                <div className="text-sm font-semibold">{spec.pmCard.title}</div>
                <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">{spec.pmCard.identityNote}</div>
                <div className="mt-4 grid gap-3">
                  {spec.pmCard.fields.map((f) => (
                    <div key={f.label} className="rounded-2xl border border-[var(--hw-line)] bg-white p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">{f.label}</div>
                      <div className="mt-2 text-sm font-semibold">
                        {f.label.toLowerCase().includes("name") ? live.pmName : f.valueExample}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <div className="text-sm font-semibold">Real-time readiness</div>
                <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">{spec.realtime.principle}</div>
                <div className="mt-3 text-sm font-semibold">Transport</div>
                <div className="mt-1 text-sm text-[var(--hw-muted)]">{spec.realtime.transport}</div>
              </Card>

              <Card className="p-6">
                <div className="text-sm font-semibold">Next</div>
                <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">
                  Next step is to replace simulation with real events via the event stream and a realtime transport.
                </div>
                <div className="mt-4">
                  <Link href="/marketplace">
                    <Button variant="ghost">
                      Back to Marketplace
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </main>

      <footer className="border-t border-[var(--hw-line)] bg-white">
        <Container className="flex flex-col gap-3 py-10 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-[var(--hw-muted)]">Homeworke · Making Homeownership Easy</div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost">Privacy</Button>
            <Button variant="ghost">Terms</Button>
            <Button variant="ghost">Contact</Button>
          </div>
        </Container>
      </footer>
    </div>
  );
}
