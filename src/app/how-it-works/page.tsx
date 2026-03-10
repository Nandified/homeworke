import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button, Card, Container, Pill } from "@/components/ui";
import { iconFor } from "@/components/icons";
import { SiteFooter, SiteHeader } from "@/components/site-shell";

const steps = [
  {
    icon: "cursor",
    title: "Tell us what you need",
    text: "Pick a category and answer a few quick questions. We keep it short — just enough to estimate scope.",
  },
  {
    icon: "calculator",
    title: "Get a free instant estimate",
    text: "We generate a fast estimate and recommended next steps. Final pricing depends on exact scope, access, and materials.",
  },
  {
    icon: "calendar",
    title: "Schedule with a vetted pro",
    text: "Choose a time that works. We coordinate scheduling and keep communication organized in one place.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <SiteHeader />

      <main>
        <Container className="py-12">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2">
              <Pill>Chicago-first</Pill>
              <Pill>Free estimates</Pill>
              <Pill>Fast scheduling</Pill>
            </div>

            <h1 className="mt-6 text-balance text-4xl font-extrabold tracking-tight text-[var(--hw-ink)]">How Homeworke works</h1>
            <p className="mt-4 text-pretty text-base leading-7 text-[var(--hw-muted)]">
              Homeworke is built to feel simple: quick intake, a free instant estimate, and a clean path to scheduling with a vetted local pro.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              {steps.map((s) => {
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

            <Card className="mt-8 p-6">
              <div className="text-sm font-semibold text-[var(--hw-ink)]">What we mean by “instant estimate”</div>
              <div className="mt-2 text-sm leading-6 text-[var(--hw-muted)]">
                It’s a fast, free estimate based on the details you provide. It’s designed to set expectations and speed up scheduling — not to lock you into a number before the scope is confirmed.
              </div>
            </Card>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/estimate">
                <Button>
                  Get an Instant Estimate
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/services">
                <Button variant="secondary">Browse services</Button>
              </Link>
            </div>
          </div>
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}
