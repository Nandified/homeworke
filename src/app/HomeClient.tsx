"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { ArrowRight, MapPin } from "lucide-react";

import { Button, Card, Container, Input, Pill } from "@/components/ui";
import { iconFor } from "@/components/icons";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { AIWorkOrderIntakeCard } from "@/components/ai/AIWorkOrderIntakeCard";

import homepageDefault from "@/../spec/homepage_marketing_v1.json";
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

export default function HomeClient(props: { homepage?: any }) {
  const homepage = props.homepage ?? homepageDefault;

  const services = servicesData.services.slice(0, 6);
  const [issue, setIssue] = useState("");
  const [focused, setFocused] = useState(false);

  const [zip, setZip] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [state, setState] = useState<string>("");
  const [locLoading, setLocLoading] = useState(false);

  // Typewriter-style rotating hint
  const hints = useMemo(
    () => ["water under kitchen sink", "outlet stopped working", "AC not cooling", "need drywall patch"],
    []
  );
  const [demoIdx, setDemoIdx] = useState(0);
  const [demoText, setDemoText] = useState("");
  const demoPhase = useRef<"typing" | "pause" | "deleting">("typing");
  const pauseUntil = useRef<number>(0);

  const issueRef = useRef<HTMLTextAreaElement | null>(null);

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

  useEffect(() => {
    const el = issueRef.current;
    if (!el) return;
    // auto-grow
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [issue]);

  // Load stored location; if missing, request browser location once.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("hw_location_v1");
      if (saved) {
        const j = JSON.parse(saved);
        if (j?.zip) setZip(j.zip);
        if (j?.city) setCity(j.city);
        if (j?.state) setState(j.state);
        return;
      }
    } catch {}

    if (!navigator.geolocation) return;

    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`/api/geo/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
          const j = await res.json();
          if (j?.ok) {
            if (j.zip) setZip(String(j.zip).slice(0, 5));
            if (j.city) setCity(j.city);
            if (j.state) setState(j.state);
            window.localStorage.setItem(
              "hw_location_v1",
              JSON.stringify({ zip: j.zip ? String(j.zip).slice(0, 5) : "", city: j.city || "", state: j.state || "" })
            );
          }
        } catch {
          // ignore
        } finally {
          setLocLoading(false);
        }
      },
      () => setLocLoading(false),
      { enableHighAccuracy: false, maximumAge: 1000 * 60 * 60, timeout: 8000 }
    );
  }, []);

  // When ZIP changes (user edits), resolve city/state.
  useEffect(() => {
    const z = (zip || "").trim();
    if (!/^\d{5}$/.test(z)) return;

    const run = async () => {
      try {
        const res = await fetch(`/api/geo/zip?zip=${encodeURIComponent(z)}`);
        const j = await res.json();
        if (j?.ok) {
          if (j.city) setCity(j.city);
          if (j.state) setState(j.state);
          window.localStorage.setItem(
            "hw_location_v1",
            JSON.stringify({ zip: z, city: j.city || "", state: j.state || "" })
          );
        }
      } catch {}
    };

    run();
  }, [zip]);

  const suggestedSlug = useMemo(() => {
    if (!issue.trim()) return null;
    return classifyToServiceSlug(issue, servicesData.services);
  }, [issue]);

  const suggestedService = useMemo(() => {
    if (!suggestedSlug) return null;
    return servicesData.services.find((s) => s.slug === suggestedSlug) ?? null;
  }, [suggestedSlug]);

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(229,57,53,0.10),transparent_60%),radial-gradient(900px_500px_at_110%_0%,rgba(17,24,39,0.06),transparent_55%),linear-gradient(to_bottom,#ffffff,#fbfbfb)]">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-40 -top-40 h-[620px] w-[620px] rounded-full bg-[var(--hw-red)] opacity-[0.10] blur-[130px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-56 top-24 h-[640px] w-[640px] rounded-full bg-black opacity-[0.05] blur-[160px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(17,24,39,.10) 1px, transparent 0)",
              backgroundSize: "26px 26px",
              maskImage: "radial-gradient(500px 240px at 50% 15%, black, transparent 70%)",
              WebkitMaskImage: "radial-gradient(500px 240px at 50% 15%, black, transparent 70%)",
            }}
          />

          <Container className="relative py-12 md:py-16">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Pill className="bg-white">
                <span className="hw-breath-dot" aria-hidden />
                {city ? `Now Servicing ${city}` : locLoading ? "Finding your location…" : "Set your location"}
              </Pill>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-5">
                <h1 className="text-balance text-4xl font-extrabold tracking-[-0.03em] text-[var(--hw-ink)] md:text-6xl">
                  {homepage.hero.headline}
                </h1>
                <p className="mt-4 max-w-xl text-pretty text-base leading-7 text-[var(--hw-muted)] md:text-lg">
                  {homepage.hero.subheadline}
                </p>
                <div className="mt-4 text-sm text-[var(--hw-muted)]">{homepage.hero.disclaimer}</div>
                <div className="mt-6 text-base font-semibold text-[var(--hw-ink)]">
                  {city && state ? (
                    <span>
                      Pros for every project in <span className="text-[var(--hw-red)]">{city}, {state}</span>.
                    </span>
                  ) : (
                    <span>Pros for every project in your area.</span>
                  )}
                </div>
              </div>

              {/* Homepage AI Work Submittal (confirmation required) */}
              <div className="lg:col-span-7">
                <AIWorkOrderIntakeCard
                  eyebrow="Job work order"
                  title="What do you need help with?"
                  primaryCta="Schedule a visit"
                  requireConfirmation
                  showServicingPill
                />
              </div>
            </div>

            {/* Trust (keep within first scroll on mobile) */}
            <div className="mt-10">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
                  {homepage.trust.title}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                {homepage.trust.bullets.map((b: any) => {
                  const Icon = iconFor(b.icon);
                  return (
                    <Card
                      key={b.title}
                      className="p-5 border border-[rgba(17,24,39,.08)] bg-white/80 shadow-[0_22px_60px_rgba(17,24,39,.08)] backdrop-blur supports-[backdrop-filter]:bg-white/70"
                    >
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
            </div>
          </Container>
        </section>

        {/* Trust */}
        <Container className="pb-4">
          <div className="hidden grid-cols-1 gap-4 lg:grid-cols-3">
            {homepage.trust.bullets.map((b: any) => {
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

        {/* Why Homeworke */}
        <Container className="py-12">
          <div className="relative overflow-hidden rounded-[28px] border border-[rgba(17,24,39,.08)] bg-white/75 p-8 shadow-[0_28px_100px_rgba(17,24,39,.12)] backdrop-blur supports-[backdrop-filter]:bg-white/65 md:p-10">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-32 -top-40 h-[520px] w-[520px] rounded-full bg-[var(--hw-red)] opacity-[0.14] blur-[140px]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-40 -bottom-48 h-[560px] w-[560px] rounded-full bg-black opacity-[0.10] blur-[160px]"
            />

            <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-5">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
                  Why Homeworke
                </div>
                <div className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--hw-ink)]">
                  Not a lead form. A coordinated outcome.
                </div>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--hw-muted)]">
                  Get a clear plan, fast next steps, and a single thread from request → estimate → scheduling. We prioritize vetted pros and scope clarity so projects don’t drift.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/estimate">
                    <Button>
                      Get an Instant Estimate
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/how-it-works">
                    <Button variant="secondary">See how it works</Button>
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {[
                    {
                      icon: "shield",
                      title: "Quality over quantity",
                      text: "We focus on vetted pros — not blasting your info to dozens of contractors.",
                    },
                    {
                      icon: "list",
                      title: "Scope-first estimates",
                      text: "Clear inclusions, assumptions, and next steps so you can approve confidently.",
                    },
                    {
                      icon: "message-circle",
                      title: "One place to manage it",
                      text: "Messages, scheduling, and updates stay organized from start to finish.",
                    },
                  ].map((b) => {
                    const Icon = iconFor(b.icon);
                    return (
                      <Card
                        key={b.title}
                        className="p-6 border border-[rgba(17,24,39,.08)] bg-white/80 shadow-[0_22px_70px_rgba(17,24,39,.10)] backdrop-blur supports-[backdrop-filter]:bg-white/70"
                      >
                        <div className="flex items-start gap-3">
                          <div className="rounded-[14px] border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.08)] p-2">
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

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    { k: "1", v: "Primary action per page", d: "Cleaner conversions" },
                    { k: "2", v: "Evidence + assumptions", d: "More trust" },
                    { k: "3", v: "Progressive disclosure", d: "Less friction" },
                  ].map((s) => (
                    <div
                      key={s.k}
                      className="rounded-2xl border border-[rgba(17,24,39,.08)] bg-white/70 px-4 py-3 shadow-[0_18px_60px_rgba(17,24,39,.08)]"
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">{s.d}</div>
                      <div className="mt-1 text-sm font-semibold text-[var(--hw-ink)]">{s.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
            {homepage.howItWorks.steps.map((s: any) => {
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
        <Container className="py-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-6">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">{homepage.services.title}</div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-[var(--hw-ink)] md:text-3xl">Pick a category to get started</div>
              <div className="mt-2 max-w-2xl text-sm leading-6 text-[var(--hw-muted)]">
                Tell us what you need — we’ll route you to vetted pros and keep the project organized end-to-end.
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/services" className="hidden md:block">
                <Button variant="ghost">
                  {homepage.services.cta}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/services" className="md:hidden">
                <Button variant="secondary">See all services</Button>
              </Link>
            </div>
          </div>

          <div className="relative mt-6">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-6 rounded-[28px] bg-[radial-gradient(600px_240px_at_30%_0%,rgba(229,57,53,0.14),transparent_60%),radial-gradient(520px_240px_at_110%_30%,rgba(17,24,39,0.10),transparent_55%)]"
            />

            <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s) => {
                const Icon = iconFor(s.icon);
                return (
                  <Link key={s.slug} href={`/services/${s.slug}`} className="group">
                    <Card className="relative h-full overflow-hidden border border-[rgba(17,24,39,.08)] bg-white/75 p-6 shadow-[0_22px_70px_rgba(17,24,39,.10)] backdrop-blur transition will-change-transform hover:-translate-y-0.5 hover:shadow-[0_28px_90px_rgba(17,24,39,.14)]">
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100"
                        style={{
                          background:
                            "radial-gradient(380px 180px at 20% 0%, rgba(229,57,53,0.18), transparent 60%), radial-gradient(380px 200px at 110% 30%, rgba(17,24,39,0.10), transparent 60%)",
                        }}
                      />

                      <div className="relative flex items-start gap-3">
                        <div className="rounded-[14px] border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.08)] p-2">
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
          </div>
        </Container>

        {/* FAQ */}
        <Container className="py-12">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">{homepage.faq.title}</div>
          <div className="mt-2 text-2xl font-bold text-[var(--hw-ink)]">Quick answers</div>
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {homepage.faq.items.map((item: any) => (
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
