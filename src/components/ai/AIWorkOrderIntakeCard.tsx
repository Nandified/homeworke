"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { ArrowRight, MapPin } from "lucide-react";

import { Button, Input, Pill } from "@/components/ui";
import { iconFor } from "@/components/icons";

import servicesData from "@/../spec/services.json";

type Service = (typeof servicesData.services)[number];

function classifyToServiceSlug(text: string, services: Service[]): string | null {
  const t = text.toLowerCase();
  const hit = (slug: string) => (services.some((s) => s.slug === slug) ? slug : null);

  if (/(leak|clog|toilet|faucet|pipe|drain|garbage disposal)/i.test(t)) return hit("plumbing");
  if (/(outlet|breaker|electrical|wiring|switch|light fixture|ceiling fan)/i.test(t)) return hit("electrical");
  if (/(ac|a\/c|air conditioner|no heat|no cool|furnace|hvac|thermostat)/i.test(t)) return hit("hvac");
  if (/(washer|dryer|dishwasher|refrigerator|fridge|oven|range)/i.test(t)) return hit("appliance-repair");
  if (/(deep clean|cleaning|move out|move-in|turnover)/i.test(t)) return hit("cleaning");
  if (/(mount|hang|patch|drywall|door|shelf|assembly|handyman)/i.test(t)) return hit("handyman");

  return null;
}

/**
 * Reusable replica of the homepage “What’s going on with your home?” intake card.
 * Intended to be embedded inside dashboards (Pro, Homeowner, Office).
 */
export function AIWorkOrderIntakeCard(props: {
  eyebrow?: string;
  title?: string;
  primaryCta?: string;
  secondaryCta?: string;
  /** Show the “Now servicing …” pill in the header (defaults true). */
  showServicingPill?: boolean;
}) {
  const services = servicesData.services.slice(0, 6);

  const [issue, setIssue] = useState("");
  const [zip, setZip] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [state, setState] = useState<string>("");
  const [locLoading, setLocLoading] = useState(false);

  // Typewriter-style rotating hint
  const hints = useMemo(() => ["water under kitchen sink", "outlet stopped working", "AC not cooling", "need drywall patch"], []);
  const [demoIdx, setDemoIdx] = useState(0);
  const [demoText, setDemoText] = useState("");
  const demoPhase = useRef<"typing" | "pause" | "deleting">("typing");
  const pauseUntil = useRef<number>(0);

  const issueRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (issue.trim()) return;

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
          window.localStorage.setItem("hw_location_v1", JSON.stringify({ zip: z, city: j.city || "", state: j.state || "" }));
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
    <div className="rounded-[var(--hw-radius-lg)] p-5 hw-glass">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
            {props.eyebrow || "Estimate request"}
          </div>
          <div className="mt-1 text-xl font-extrabold tracking-tight text-[var(--hw-ink)] sm:text-2xl">
            {props.title || "What’s going on with your home?"}
          </div>
        </div>
        {props.showServicingPill === false ? null : (
          <Pill className="bg-white">
            <span className="hw-breath-dot" aria-hidden />
            {city ? `Now Servicing ${city}` : locLoading ? "Finding your location…" : "Set your location"}
          </Pill>
        )}
      </div>

      <div className="mt-4">
        <div className="relative flex flex-col sm:flex-row sm:items-stretch rounded-[var(--hw-radius-lg)] hw-glass-field">
          <div className="flex-1">
            <textarea
              ref={issueRef}
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder=""
              aria-label="Describe your issue"
              rows={2}
              className="w-full resize-none rounded-[var(--hw-radius-lg)] bg-transparent px-4 py-2.5 text-[17px] leading-7 border-0 outline-none sm:py-2.5"
              style={{ minHeight: 80 }}
            />

            {!issue ? (
              <div
                aria-hidden
                className="pointer-events-none absolute left-4 top-[12px] flex items-baseline gap-1 text-[16px] leading-7 text-[var(--hw-muted)]"
              >
                <span className="opacity-70">Try:</span>
                <span className="font-medium text-[#4b5563]">{demoText}</span>
                <span className="hw-caret" />
              </div>
            ) : null}
          </div>

          {/* Mobile ZIP row */}
          <div className="sm:hidden border-t border-[rgba(107,114,128,.18)] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex flex-1 items-baseline gap-2">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)] whitespace-nowrap">
                  <MapPin className="h-3.5 w-3.5 text-[rgba(229,57,53,.85)]" aria-hidden />
                  ZIPCODE:
                </div>
                <Input
                  value={zip}
                  onChange={(e) => setZip(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
                  inputMode="numeric"
                  pattern="[0-9]{5}"
                  placeholder="60616"
                  aria-label="ZIP code"
                  className="h-auto w-[78px] border-0 bg-transparent p-0 pl-[2px] text-[16px] font-semibold leading-6 text-[var(--hw-ink)] underline decoration-[rgba(229,57,53,.45)] decoration-2 underline-offset-4 outline-none focus:outline-none focus:ring-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none selection:bg-[rgba(229,57,53,.18)]"
                  style={{ textDecorationSkipInk: "none" }}
                />
              </div>

              {city && state ? (
                <div className="text-xs font-medium text-[var(--hw-muted)] whitespace-nowrap">
                  {city}, {state}
                </div>
              ) : null}
            </div>
          </div>

          {/* Desktop ZIP column */}
          <div className="hidden sm:flex items-center px-3">
            <div className="h-[52px] w-px bg-[rgba(107,114,128,.22)]" />
          </div>
          <div className="hidden sm:flex flex-col items-start pr-3 pt-2.5 pl-1">
            <Input
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
              inputMode="numeric"
              pattern="[0-9]{5}"
              placeholder="60616"
              aria-label="ZIP code"
              className="h-auto w-[96px] border-0 bg-transparent p-0 pl-[18px] text-[16px] font-semibold leading-7 text-[var(--hw-ink)] outline-none focus:outline-none focus:ring-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none selection:bg-[rgba(229,57,53,.18)]"
            />
            <div className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
              <MapPin className="h-3.5 w-3.5 text-[rgba(229,57,53,.85)]" aria-hidden />
              Zipcode
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">OR PICK A CATEGORY</div>
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
          <Link href="/services">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--hw-line)] bg-white px-3 py-2 text-xs font-semibold text-[#374151] hover:bg-[var(--hw-soft)]">
              More
              <ArrowRight className="h-4 w-4 text-[var(--hw-muted)]" />
            </span>
          </Link>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          href={{
            pathname: "/marketplace/intake",
            query: {
              issue: issue.trim() || undefined,
              zip: zip || undefined,
              service: suggestedService?.slug || undefined,
            },
          }}
        >
          <Button className="w-full sm:w-auto">
            {props.primaryCta || "Get an Instant Estimate"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link href="/marketplace/intake" className="w-full sm:w-auto">
          <Button variant="secondary" className="w-full sm:w-auto">
            {props.secondaryCta || "Browse marketplace"}
          </Button>
        </Link>
      </div>
    </div>
  );
}
