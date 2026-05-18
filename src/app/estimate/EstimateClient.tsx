"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { Button, Card, Container, Pill, Textarea, Input } from "@/components/ui";
import { iconFor } from "@/components/icons";
import { SiteFooter, SiteHeader } from "@/components/site-shell";

import servicesData from "@/../spec/services.json";

type EstimateResult = {
  title: string;
  detail: string;
  finePrint: string;
};

function buildEstimate(serviceSlug: string | undefined, details: string): EstimateResult {
  const service = servicesData.services.find((s) => s.slug === serviceSlug);
  const name = service?.name ?? "Your project";

  // MVP: avoid hard price claims. The “instant estimate” is a scope expectation + next-step.
  const urgency = /leak|no heat|no cool|sparking|smell gas|flood/i.test(details);

  return {
    title: urgency ? `${name}: prioritize ASAP` : `${name}: estimate ready`,
    detail:
      "Your estimate is free. Next, we’ll confirm a couple of details (photos if helpful) and route you to a vetted local pro for scheduling.",
    finePrint:
      "Final pricing varies by scope, access, and materials. If this is an emergency, call a local emergency service provider immediately.",
  };
}

export function EstimateClient() {
  const params = useSearchParams();
  const presetService = params.get("service") ?? "";

  const [service, setService] = useState(presetService);
  const [address, setAddress] = useState("");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const selected = useMemo(() => servicesData.services.find((s) => s.slug === service), [service]);
  const Icon = iconFor(selected?.icon ?? "sparkles");

  const estimate = useMemo(() => buildEstimate(service || undefined, details), [service, details]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <SiteHeader />

      <main>
        <Container className="py-12">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2">
              <Pill>Free estimate</Pill>
              <Pill>Chicago-first</Pill>
              <Pill>Fast scheduling</Pill>
            </div>

            <h1 className="mt-6 text-balance text-4xl font-extrabold tracking-tight text-[var(--hw-ink)]">Get an Instant Estimate</h1>
            <p className="mt-4 text-pretty text-base leading-7 text-[var(--hw-muted)]">
              Answer a few quick questions. Your estimate is free — every job is different, and final pricing depends on the confirmed scope.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-12">
              <Card className="p-6 lg:col-span-7">
                <div className="text-sm font-semibold text-[var(--hw-ink)]">Step 1: Pick a service</div>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {servicesData.services.map((s) => {
                    const SIcon = iconFor(s.icon);
                    const active = s.slug === service;
                    return (
                      <button
                        key={s.slug}
                        onClick={() => setService(s.slug)}
                        className={`text-left rounded-[var(--hw-radius-lg)] border p-4 transition ${
                          active
                            ? "border-[rgba(229,57,53,.45)] bg-[rgba(229,57,53,.06)]"
                            : "border-[var(--hw-line)] bg-white hover:bg-[var(--hw-soft)]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="rounded-[var(--hw-radius)] border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.08)] p-2">
                            <SIcon className="h-5 w-5 text-[var(--hw-red)]" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-[var(--hw-ink)]">{s.name}</div>
                            <div className="mt-1 text-sm leading-6 text-[var(--hw-muted)]">{s.summary}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 text-sm font-semibold text-[var(--hw-ink)]">Step 2: Where is it?</div>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Address or neighborhood (Chicago)"
                  aria-label="Address"
                />

                <div className="mt-6 text-sm font-semibold text-[var(--hw-ink)]">Step 3: A few details</div>
                <Textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="What’s going on? Include urgency, symptoms, and any constraints (parking, pets, building rules)."
                  aria-label="Project details"
                />

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button onClick={() => setSubmitted(true)} disabled={!service || !details}>
                    Generate estimate
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Link href="/work-order">
                    <Button variant="secondary">Browse services</Button>
                  </Link>
                </div>

                <div className="mt-4 text-sm text-[var(--hw-muted)]">Estimates are free. We’ll never sell your contact info.</div>
              </Card>

              <Card className="p-6 lg:col-span-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-[var(--hw-radius)] border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.08)] p-2">
                    <Icon className="h-5 w-5 text-[var(--hw-red)]" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[var(--hw-ink)]">Instant estimate</div>
                    <div className="mt-1 text-sm text-[var(--hw-muted)]">Free, fast expectations — final pricing after scope confirmation.</div>
                  </div>
                </div>

                {!submitted ? (
                  <div className="mt-6 rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-5">
                    <div className="text-sm font-semibold text-[var(--hw-ink)]">Preview</div>
                    <div className="mt-2 text-sm leading-6 text-[var(--hw-muted)]">Choose a service and add details to generate your estimate.</div>
                  </div>
                ) : (
                  <div className="mt-6">
                    <div className="rounded-[var(--hw-radius-lg)] border border-[rgba(229,57,53,.35)] bg-[rgba(229,57,53,.06)] p-5">
                      <div className="text-sm font-semibold text-[var(--hw-ink)]">{estimate.title}</div>
                      <div className="mt-2 text-sm leading-6 text-[var(--hw-muted)]">{estimate.detail}</div>
                    </div>

                    <div className="mt-4 text-sm text-[var(--hw-muted)]">{estimate.finePrint}</div>

                    <div className="mt-6 flex flex-col gap-3">
                      <Button onClick={() => alert("Next: wire scheduling + contact capture.")}
                      >
                        Continue to scheduling
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                      <Button variant="secondary" onClick={() => setSubmitted(false)}>
                        Adjust details
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}
