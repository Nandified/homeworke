"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { ArrowRight } from "lucide-react";

import { Button, Card, Container, Input, Pill } from "@/components/ui";
import { iconFor } from "@/components/icons";
import { SiteFooter, SiteHeader } from "@/components/site-shell";

import homepage from "@/../spec/homepage_marketing_v1.json";
import servicesData from "@/../spec/services.json";

type Service = (typeof servicesData.services)[number];

function classifyToServiceSlug(text: string, services: Service[]): string | null {
  const t = text.toLowerCase();
  const hit = (slug: string) => services.some((s) => s.slug === slug) ? slug : null;

  if (/(leak|clog|toilet|faucet|pipe|drain|garbage disposal)/i.test(t)) return hit("plumbing");
  if (/(outlet|breaker|electrical|wiring|switch|light fixture|ceiling fan)/i.test(t)) return hit("electrical");
  if (/(ac|a\/c|air conditioner|no heat|no cool|furnace|hvac|thermostat)/i.test(t)) return hit("hvac");
  if (/(washer|dryer|dishwasher|refrigerator|fridge|oven|range)/i.test(t)) return hit("appliance-repair");
  if (/(deep clean|cleaning|move out|move-in|turnover)/i.test(t)) return hit("cleaning");
  if (/(mount|hang|patch|drywall|door|shelf|assembly|handyman)/i.test(t)) return hit("handyman");

  return null;
}

export default function Page() {
  const services = servicesData.services.slice(0, 6);
  const [issue, setIssue] = useState("");
  const [focused, setFocused] = useState(false);

  // Typewriter-style rotating hint
  const hints = useMemo(
    () => ["water under kitchen sink", "outlet stopped working", "AC not cooling", "need drywall patch"],
    []
  );
  const [demoIdx, setDemoIdx] = useState(0);
  const [demoText, setDemoText] = useState("");
  const demoPhase = useRef<"typing" | "pause" | "deleting">("typing");
  const pauseUntil = useRef<number>(0);

  useEffect(() => {
    if (issue.trim()) return; // user typed something

    const tick = () => {
      const now = Date.now();
      const full = hints[demoIdx] ?? "";

      if (demoPhase.current === "pause") {
        if (now >= pauseUntil.current) demoPhase.current = "deleting";
        return;
      }

      if (demoPhase.current === "typing") {
        const next = full.slice(0, demoText.length + 1);
        setDemoText(next);
        if (next.length >= full.length) {
          demoPhase.current = "pause";
          pauseUntil.current = now + 1100;
        }
        return;
      }

      // deleting
      const next = full.slice(0, Math.max(0, demoText.length - 1));
      setDemoText(next);
      if (next.length === 0) {
        demoPhase.current = "typing";
        setDemoIdx((i) => (i + 1) % hints.length);
      }
    };

    const speed = demoPhase.current === "deleting" ? 26 : 34;
    const t = window.setInterval(tick, speed);
    return () => window.clearInterval(t);
  }, [issue, demoIdx, demoText.length, hints]);

  const suggestedSlug = useMemo(() => {
    if (!issue.trim()) return null;
    return classifyToServiceSlug(issue, servicesData.services);
  }, [issue]);

  const suggestedService = useMemo(() => {
    if (!suggestedSlug) return null;
    return servicesData.services.find((s) => s.slug === suggestedSlug) ?? null;
  }, [suggestedSlug]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-[#fafafa]">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-[var(--hw-red)] opacity-[0.05] blur-[120px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-48 top-32 h-[560px] w-[560px] rounded-full bg-black opacity-[0.03] blur-[140px]"
          />

          <Container className="relative py-12 md:py-16">
            <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <Pill className="bg-white">
                <span className="hw-breath-dot" aria-hidden />
                Now Servicing Chicago
              </Pill>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-5">
                <h1 className="text-balance text-4xl font-extrabold tracking-tight text-[var(--hw-ink)] md:text-6xl">
                  {homepage.hero.headline}
                </h1>
                <p className="mt-4 max-w-xl text-pretty text-base leading-7 text-[var(--hw-muted)] md:text-lg">
                  {homepage.hero.subheadline}
                </p>
                <div className="mt-4 text-sm text-[var(--hw-muted)]">{homepage.hero.disclaimer}</div>
              </div>

              {/* Chat-style hero search */}
              <div className="lg:col-span-7">
                <div className="mt-5 rounded-[var(--hw-radius-lg)] p-5 hw-glass">
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Estimate request</div>
                  <div className="mt-1 text-xl font-extrabold tracking-tight text-[var(--hw-ink)] sm:text-2xl">
                    What’s going on with your home?
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="relative flex-1">
                      <Input
                        value={issue}
                        onChange={(e) => setIssue(e.target.value)}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        placeholder=""
                        aria-label="Describe your issue"
                        className="h-20 w-full rounded-[var(--hw-radius-lg)] px-5 text-[17px] border-0 outline-none hw-glass-field sm:h-16"
                      />

                      {/* Typewriter hint + caret (visible even before focus) */}
                      {!issue ? (
                        <div
                          aria-hidden
                          className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[16px] text-[var(--hw-muted)]"
                        >
                          <span className="opacity-70">Try:</span>
                          <span className="font-medium text-[#4b5563]">{demoText}</span>
                          <span className="hw-caret" />
                        </div>
                      ) : null}
                    </div>

                    {suggestedService ? (
                      <span className="hidden sm:inline-flex items-center rounded-full border border-[var(--hw-line)] bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#374151]">
                        {suggestedService.name}
                      </span>
                    ) : null}
                  </div>

                  {/* Popover suggestions while focused */}
                  {focused ? (
                    <div className="mt-4">
                      <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Suggested categories</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {services.map((s) => {
                          const Icon = iconFor(s.icon);
                          return (
                            <Link key={s.slug} href={`/estimate?service=${encodeURIComponent(s.slug)}`}>
                              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--hw-line)] bg-white px-3 py-2 text-xs font-semibold text-[#374151] hover:bg-[var(--hw-soft)]">
                                <Icon className="h-4 w-4 text-[var(--hw-red)]" />
                                {s.name}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Link href={suggestedService ? `/estimate?service=${encodeURIComponent(suggestedService.slug)}` : "/estimate"}>
                      <Button className="w-full sm:w-auto">
                        {homepage.hero.primaryCta}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/services" className="w-full sm:w-auto">
                      <Button variant="secondary" className="w-full sm:w-auto">Browse services</Button>
                    </Link>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Or pick a category</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {services.map((s) => {
                      const Icon = iconFor(s.icon);
                      return (
                        <Link key={s.slug} href={`/estimate?service=${encodeURIComponent(s.slug)}`}>
                          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--hw-line)] bg-white px-3 py-2 text-xs font-semibold text-[#374151] hover:bg-[var(--hw-soft)]">
                            <Icon className="h-4 w-4 text-[var(--hw-red)]" />
                            {s.name}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Trust */}
        <Container className="pb-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {homepage.trust.bullets.map((b) => {
              const Icon = iconFor(b.icon);
              return (
                <Card key={b.title} className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="rounded-[var(--hw-radius)] border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.08)] p-2">
                      <Icon className="h-5 w-5 text-[var(--hw-red)]" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--hw-ink)]">{b.title}</div>
                      <div className="mt-1 text-sm leading-6 text-[var(--hw-muted)]">{b.text}</div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Container>

        {/* How it works */}
        <Container className="py-10">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">{homepage.howItWorks.title}</div>
              <div className="mt-2 text-2xl font-bold text-[var(--hw-ink)]">From request to done — fast.</div>
            </div>
            <Link href="/how-it-works" className="hidden md:block">
              <Button variant="ghost">
                Learn more
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {homepage.howItWorks.steps.map((s) => {
              const Icon = iconFor(s.icon);
              return (
                <Card key={s.title} className="p-6">
                  <div className="rounded-[var(--hw-radius)] border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.08)] p-2 w-fit">
                    <Icon className="h-5 w-5 text-[var(--hw-red)]" />
                  </div>
                  <div className="mt-4 text-sm font-semibold text-[var(--hw-ink)]">{s.title}</div>
                  <div className="mt-1 text-sm leading-6 text-[var(--hw-muted)]">{s.text}</div>
                </Card>
              );
            })}
          </div>
        </Container>

        {/* Services grid */}
        <Container className="py-4">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">{homepage.services.title}</div>
              <div className="mt-2 text-2xl font-bold text-[var(--hw-ink)]">Pick a category to get started</div>
            </div>
            <Link href="/services" className="hidden md:block">
              <Button variant="ghost">
                {homepage.services.cta}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => {
              const Icon = iconFor(s.icon);
              return (
                <Link key={s.slug} href={`/services/${s.slug}`} className="group">
                  <Card className="h-full p-6 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(17,24,39,.08)]">
                    <div className="flex items-start gap-3">
                      <div className="rounded-[var(--hw-radius)] border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.08)] p-2">
                        <Icon className="h-5 w-5 text-[var(--hw-red)]" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[var(--hw-ink)]">{s.name}</div>
                        <div className="mt-1 text-sm leading-6 text-[var(--hw-muted)]">{s.summary}</div>
                        <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--hw-red)]">
                          Get an instant estimate
                          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </Container>

        {/* FAQ */}
        <Container className="py-12">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">{homepage.faq.title}</div>
          <div className="mt-2 text-2xl font-bold text-[var(--hw-ink)]">Quick answers</div>
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {homepage.faq.items.map((item) => (
              <Card key={item.q} className="p-6">
                <div className="text-sm font-semibold text-[var(--hw-ink)]">{item.q}</div>
                <div className="mt-2 text-sm leading-6 text-[var(--hw-muted)]">{item.a}</div>
              </Card>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/estimate">
              <Button>
                Get an Instant Estimate
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="secondary">Talk to us</Button>
            </Link>
          </div>
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}
