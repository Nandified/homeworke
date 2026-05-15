"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { ArrowRight, MapPin } from "lucide-react";

import { Button, Card, Container, Input, Pill } from "@/components/ui";
import { iconFor } from "@/components/icons";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { AIWorkOrderIntakeCard } from "@/components/ai/AIWorkOrderIntakeCard";
import { getSupabaseBrowserClient } from "@/lib/supabase";

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

  // Manual booking (non-AI) lead capture
  const [manualStep, setManualStep] = useState<1 | 2>(1);
  const [manualService, setManualService] = useState<string>("Plumbing");
  const [manualIssue, setManualIssue] = useState<string>("");
  const [manualAddress, setManualAddress] = useState<string>("");
  const [manualName, setManualName] = useState<string>("");
  const [manualEmail, setManualEmail] = useState<string>("");
  const [manualPhone, setManualPhone] = useState<string>("");
  const [manualSending, setManualSending] = useState(false);
  const [manualError, setManualError] = useState<string>("");
  const [manualSent, setManualSent] = useState(false);

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

  async function submitManualLead() {
    if (manualSending) return;
    setManualError("");

    const name = manualName.trim();
    const email = manualEmail.trim().toLowerCase();
    const phone = manualPhone.trim();

    if (!name) return setManualError("Please enter your name.");
    if (!email || !email.includes("@")) return setManualError("Please enter a valid email.");
    if (!phone) return setManualError("Please enter a phone number.");

    setManualSending(true);
    try {
      // 1) Create pending confirmation record (server)
      const pendingRes = await fetch("/api/pending-confirmations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          phone,
          leadRole: "homeowner",
          redirectAfterConfirm: "/confirm/next-steps",
          intake: {
            originPartnerId: null,
            shareWithPartner: true,
            service_category: manualService || "General",
            service_subcategory: "",
            issue_description: (manualIssue || "").trim(),
            urgency_level: "this_week",
            property_address: (manualAddress || "").trim(),
            property_type: "",
            preferred_date: "",
            preferred_time_window: "",
            contact_method: "email",
          },
        }),
      });
      const pendingJson = await pendingRes.json().catch(() => null);
      if (!pendingRes.ok || !pendingJson?.ok) {
        setManualError("Could not start confirmation. Please try again.");
        return;
      }

      // 2) Send Supabase OTP link
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/confirm/next-steps")}`,
          shouldCreateUser: true,
        },
      });
      if (error) throw error;

      try {
        window.localStorage.setItem(
          "hw_session_v1",
          JSON.stringify({
            token: "manual",
            jobId: "manual",
            email,
            service: manualService,
            providerName: "",
            date: new Date().toLocaleDateString(),
            window: "",
          })
        );
      } catch {}

      setManualSent(true);
    } catch (e: any) {
      setManualError(e?.message || "Could not send confirmation email.");
    } finally {
      setManualSending(false);
    }
  }

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
                <h1 className="text-balance text-4xl font-extrabold tracking-[-0.04em] text-[var(--hw-ink)] md:text-6xl">
                  {homepage.hero.headline}
                </h1>

                <p className="mt-4 max-w-xl text-pretty text-base leading-7 text-[var(--hw-muted)] md:text-lg">
                  {homepage.hero.subheadline}
                </p>

                <div className="mt-5 text-sm font-semibold text-[var(--hw-ink)]">
                  {city && state ? (
                    <span>
                      Pros for every project in <span className="text-[var(--hw-red)]">{city}, {state}</span>.
                    </span>
                  ) : (
                    <span>Pros for every project in your area.</span>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/estimate">
                    <Button variant="secondary">
                      Get an Instant Estimate
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/services">
                    <Button variant="ghost">Browse services</Button>
                  </Link>
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

            {/* Manual booking (non-AI) */}
            <div className="mt-10">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
                  Manual booking
                </div>
                <Link href="/services" className="hidden md:block">
                  <Button variant="ghost">
                    Browse more
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <Card className="mt-4 border border-[rgba(17,24,39,.08)] bg-white/75 p-6 shadow-[0_22px_70px_rgba(17,24,39,.10)] backdrop-blur">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
                  <div className="lg:col-span-7">
                    <div className="text-xl font-extrabold tracking-tight text-[var(--hw-ink)]">
                      Prefer not to use Homeworke AI?
                    </div>
                    <div className="mt-2 text-sm leading-6 text-[var(--hw-muted)]">
                      Pick a service and enter a few details. We’ll email you a magic link to confirm.
                    </div>

                    {/* Step 1: Trade chips */}
                    <div className="mt-5">
                      <div className="text-xs font-semibold text-[var(--hw-muted)]">Trade</div>
                      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {[
                          "Plumbing",
                          "Electrical",
                          "HVAC",
                          "Handyman / General",
                          "Cleaning / Turnover",
                          "Remodeling",
                          "Roofing",
                          "Flooring",
                          "Inspections",
                          "Drywall",
                          "Painting",
                          "Windows & Doors",
                        ].map((name) => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => {
                              setManualService(name);
                              setManualStep(2);
                            }}
                            className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                              manualService === name
                                ? "border-[rgba(229,57,53,.35)] bg-[rgba(229,57,53,.08)] text-[var(--hw-ink)]"
                                : "border-[rgba(17,24,39,.08)] bg-white/70 text-[var(--hw-muted)] hover:bg-white"
                            }`}
                          >
                            {name}
                          </button>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <div className="text-xs text-[var(--hw-muted)]">
                          Selected: <span className="font-semibold text-[var(--hw-ink)]">{manualService}</span>
                        </div>
                        <button
                          type="button"
                          className="text-xs font-semibold text-[var(--hw-red)]"
                          onClick={() => setManualStep(1)}
                        >
                          Change
                        </button>
                      </div>
                    </div>

                    {/* Step 2: Details */}
                    <div className="mt-5">
                      <div className="text-xs font-semibold text-[var(--hw-muted)]">Property address</div>
                      <Input
                        placeholder="Street, City, State, ZIP"
                        value={manualAddress}
                        onChange={(e) => setManualAddress(e.target.value)}
                      />

                      <div className="mt-4">
                        <label className="text-xs font-semibold text-[var(--hw-muted)]">Details</label>
                        <textarea
                          value={manualIssue}
                          onChange={(e) => setManualIssue(e.target.value)}
                          placeholder="What do you need help with? (Optional, but helpful)"
                          className="mt-2 w-full resize-none rounded-2xl border border-[rgba(17,24,39,.10)] bg-white/80 px-4 py-3 text-sm text-[var(--hw-ink)] shadow-[0_18px_60px_rgba(17,24,39,.06)] outline-none placeholder:text-[rgba(107,114,128,.9)] focus:border-[rgba(229,57,53,.30)]"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5">
                    {manualSent ? (
                      <div className="rounded-2xl border border-[rgba(17,24,39,.08)] bg-white/70 p-5">
                        <div className="text-sm font-semibold text-[var(--hw-ink)]">Check your email</div>
                        <div className="mt-2 text-sm leading-6 text-[var(--hw-muted)]">
                          We sent a confirmation link to <span className="font-semibold text-[var(--hw-ink)]">{manualEmail.trim()}</span>.
                          Open it to confirm your request.
                        </div>
                        <div className="mt-3 text-xs leading-5 text-[var(--hw-muted)]">
                          After you confirm, you’ll see next steps and we’ll begin coordinating your request.
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-[rgba(17,24,39,.08)] bg-white/70 p-5">
                        <div className="grid grid-cols-1 gap-3">
                          <Input placeholder="Name" value={manualName} onChange={(e) => setManualName(e.target.value)} />
                          <Input placeholder="Email" value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} />
                          <Input placeholder="Phone" value={manualPhone} onChange={(e) => setManualPhone(e.target.value)} />

                          {manualError ? (
                            <div className="text-sm font-semibold text-[var(--hw-red)]">{manualError}</div>
                          ) : null}

                          <Button onClick={submitManualLead} disabled={manualSending}>
                            {manualSending ? "Sending…" : "Send me a confirmation link"}
                            <ArrowRight className="h-4 w-4" />
                          </Button>

                          <div className="text-xs leading-5 text-[var(--hw-muted)]">
                            Nothing is submitted until you confirm via email.
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 md:hidden">
                      <Link href="/services">
                        <Button className="w-full" variant="secondary">Browse more services</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
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
        <Container className="py-10 md:py-12">
          <div className="relative overflow-hidden rounded-[28px] border border-[rgba(17,24,39,.08)] bg-white/75 p-6 shadow-[0_28px_100px_rgba(17,24,39,.12)] backdrop-blur supports-[backdrop-filter]:bg-white/65 md:p-10">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-32 -top-40 h-[520px] w-[520px] rounded-full bg-[var(--hw-red)] opacity-[0.14] blur-[140px]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-40 -bottom-48 h-[560px] w-[560px] rounded-full bg-black opacity-[0.10] blur-[160px]"
            />

            <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start lg:gap-10">
              <div className="lg:col-span-5">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
                  Why Homeworke
                </div>
                <div className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-[var(--hw-ink)] md:text-4xl">
                  Not a lead form. <span className="text-[var(--hw-red)]">A coordinated outcome.</span>
                </div>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--hw-muted)]">
                  Get a clear plan, fast next steps, and a single thread from request → estimate → scheduling. We prioritize vetted pros and scope clarity so projects don’t drift.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <Link href="/estimate" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto">
                      Get an Instant Estimate
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/how-it-works" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto" variant="secondary">See how it works</Button>
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="grid grid-cols-1 gap-3">
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
                        className="border border-[rgba(17,24,39,.08)] bg-white/80 p-5 shadow-[0_22px_70px_rgba(17,24,39,.10)] backdrop-blur supports-[backdrop-filter]:bg-white/70"
                      >
                        <div className="flex items-start gap-4">
                          <div className="mt-0.5 rounded-[14px] border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.08)] p-2">
                            <Icon className="h-5 w-5 text-[var(--hw-red)]" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-base font-semibold leading-6 text-[var(--hw-ink)]">{b.title}</div>
                            <div className="mt-1 text-sm leading-6 text-[var(--hw-muted)]">{b.text}</div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {["Clear scope before you approve work.", "One thread from request to completion.", "Vetted pros — no lead spam.", "Fast next steps, fewer missed details."].map(
                    (t) => (
                      <div
                        key={t}
                        className="rounded-2xl border border-[rgba(17,24,39,.08)] bg-white/70 px-4 py-3 shadow-[0_18px_60px_rgba(17,24,39,.08)]"
                      >
                        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--hw-ink)]">
                          <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--hw-red)]" />
                          {t}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </Container>

        {/* How it works */}
        <Container className="relative py-10">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-6 rounded-[28px] bg-[radial-gradient(600px_240px_at_30%_0%,rgba(229,57,53,0.14),transparent_60%),radial-gradient(520px_240px_at_110%_30%,rgba(17,24,39,0.10),transparent_55%)]"
          />
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

          <div className="relative mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {homepage.howItWorks.steps.map((s: any) => {
              const Icon = iconFor(s.icon);
              return (
                <Card
                  key={s.title}
                  className="relative overflow-hidden border border-[rgba(17,24,39,.08)] bg-white/75 p-6 shadow-[0_22px_70px_rgba(17,24,39,.10)] backdrop-blur transition hover:-translate-y-0.5 hover:shadow-[0_28px_90px_rgba(17,24,39,.14)]"
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100"
                  />
                  <div className="rounded-[14px] border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.08)] p-2 w-fit">
                    <Icon className="h-5 w-5 text-[var(--hw-red)]" />
                  </div>
                  <div className="mt-4 text-base font-semibold text-[var(--hw-ink)]">{s.title}</div>
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
        <Container className="relative py-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-6 rounded-[28px] bg-[radial-gradient(600px_240px_at_30%_0%,rgba(229,57,53,0.12),transparent_60%),radial-gradient(520px_240px_at_110%_30%,rgba(17,24,39,0.10),transparent_55%)]"
          />

          <div className="relative">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">{homepage.faq.title}</div>
            <div className="mt-2 text-2xl font-bold text-[var(--hw-ink)]">Quick answers</div>

            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
              {homepage.faq.items.map((item: any) => (
                <Card
                  key={item.q}
                  className="border border-[rgba(17,24,39,.08)] bg-white/75 p-6 shadow-[0_22px_70px_rgba(17,24,39,.10)] backdrop-blur"
                >
                  <div className="text-sm font-semibold text-[var(--hw-ink)]">{item.q}</div>
                  <div className="mt-2 text-sm leading-6 text-[var(--hw-muted)]">{item.a}</div>
                </Card>
              ))}
            </div>

            {/* Final CTA panel */}
            <div className="mt-10 overflow-hidden rounded-[28px] border border-[rgba(17,24,39,.08)] bg-white/75 p-6 shadow-[0_28px_100px_rgba(17,24,39,.12)] backdrop-blur md:p-8">
              <div
                aria-hidden
                className="pointer-events-none absolute"
              />
              <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-center">
                <div className="md:col-span-7">
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Ready when you are</div>
                  <div className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">Get a clear plan and next steps today.</div>
                  <div className="mt-2 text-sm leading-6 text-[var(--hw-muted)]">
                    Start with an instant estimate for inspections/appraisals, or request a visit for confirmed scope.
                  </div>
                </div>
                <div className="md:col-span-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <Link href="/estimate" className="w-full sm:w-auto">
                      <Button className="w-full sm:w-auto">
                        Get an Instant Estimate
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/marketplace/intake" className="w-full sm:w-auto">
                      <Button className="w-full sm:w-auto" variant="secondary">Request a visit</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}
