"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button, Card, Chip, Container, Input, Pill, StatTile } from "@/components/ui";
import homepage from "@/content/homepage_v1_opus.json";

const aliveHints = [
  "Try: 'water under kitchen sink'",
  "Try: 'outlet stopped working'",
  "Try: 'AC not cooling'",
  "Try: 'need drywall patch and paint'",
];

function classifyIssue(text: string) {
  const t = text.toLowerCase();
  if (t.includes("leak") || t.includes("pipe") || t.includes("toilet") || t.includes("faucet")) return "Plumbing";
  if (t.includes("no power") || t.includes("outlet") || t.includes("breaker") || t.includes("electrical")) return "Electrical";
  if (t.includes("ac") || t.includes("heat") || t.includes("hvac") || t.includes("furnace")) return "HVAC";
  if (t.includes("roof") || t.includes("shingle")) return "Roofing";
  if (t.includes("paint") || t.includes("drywall")) return "Drywall/Paint";
  return "General";
}

export default function Page() {
  const [issue, setIssue] = useState("");
  const [hintIdx, setHintIdx] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => setHintIdx((i) => (i + 1) % aliveHints.length), 3500);
    return () => window.clearInterval(t);
  }, []);

  const suggested = useMemo(() => (issue.trim() ? classifyIssue(issue) : null), [issue]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <header className="sticky top-0 z-20 border-b border-[var(--hw-line)] bg-white/80 backdrop-blur">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" className="text-sm font-extrabold tracking-tight text-[var(--hw-ink)]">
            Homeworke
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            <Link href="/marketplace/intake">
              <Button variant="ghost">Marketplace</Button>
            </Link>
            <Link href="/real-estate-pros" aria-disabled>
              <Button variant="ghost" disabled>
                Real Estate Pros
              </Button>
            </Link>
            <Link href="/internal/portal">
              <Button variant="ghost">Internal</Button>
            </Link>
          </nav>
        </Container>
      </header>

      <main>
        <Container className="py-12">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <div className="flex flex-wrap gap-2">
                <Pill>Trust-first marketplace</Pill>
                <Pill>Relationship engine (permissioned)</Pill>
              </div>

              <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-tight text-[var(--hw-ink)] md:text-5xl">
                {homepage.hero.headline}
              </h1>
              <p className="mt-4 max-w-xl text-pretty text-base leading-7 text-[var(--hw-muted)]">
                {homepage.hero.subheadline}
              </p>

              <Card className="mt-8 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">{homepage.hero.chatLabel}</div>
                    <div className="mt-1 text-sm text-[var(--hw-muted)]">{homepage.hero.chatHelper}</div>
                  </div>
                  <Pill>Alive</Pill>
                </div>

                <div className="mt-4 flex items-center gap-3 rounded-[var(--hw-radius)] border border-[var(--hw-line)] bg-white p-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-[var(--hw-red)]" />
                  <Input
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    placeholder={homepage.hero.chatPlaceholder}
                    aria-label="Describe your issue"
                    className="border-0 focus:ring-0"
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[var(--hw-muted)]">
                  <span className="font-semibold">Hint:</span> <span>{aliveHints[hintIdx]}</span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Chip>Suggested: {suggested || "—"}</Chip>
                  <Chip>Capture at scheduling</Chip>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={{
                      pathname: "/marketplace/providers",
                      query: { service: suggested || homepage.quickSelect.options[0], issue: issue.trim() || undefined },
                    }}
                  >
                    <Button>{homepage.hero.primaryCta}</Button>
                  </Link>
                  <Link href="/marketplace/intake">
                    <Button variant="secondary">{homepage.hero.secondaryCta}</Button>
                  </Link>
                </div>

                <div className="mt-6">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">{homepage.quickSelect.label}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {homepage.quickSelect.options.slice(0, 8).map((o) => (
                      <Link
                        key={o}
                        href={{ pathname: "/marketplace/providers", query: { service: o } }}
                        className="no-underline"
                      >
                        <Chip>{o}</Chip>
                      </Link>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Card className="p-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Trust</div>
                <div className="mt-2 text-sm font-semibold">What you get</div>
                <div className="mt-4 grid grid-cols-1 gap-3">
                  {homepage.sellingPoints.slice(0, 4).map((s) => (
                    <div key={s.title} className="rounded-[var(--hw-radius)] border border-[var(--hw-line)] bg-white p-4">
                      <div className="text-sm font-semibold">{s.title}</div>
                      <div className="mt-1 text-sm leading-7 text-[var(--hw-muted)]">{s.text}</div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">How it works</div>
                <div className="mt-4 grid gap-3">
                  {homepage.howItWorks.map((s) => (
                    <div key={s.step} className="rounded-[var(--hw-radius)] border border-[var(--hw-line)] bg-white p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">{s.step}</div>
                      <div className="mt-1 text-sm font-semibold">{s.title}</div>
                      <div className="mt-1 text-sm leading-7 text-[var(--hw-muted)]">{s.text}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {(homepage.trust.tiles as any[]).slice(0, 3).map((t: any, idx: number) => (
              <StatTile key={idx} label={t.label || t.title || "Trust"} value={t.value || ""} note={t.note || t.text || ""} />
            ))}
          </div>

          <div className="mt-8 text-sm text-[var(--hw-muted)]">{homepage.trust.disclaimer}</div>
        </Container>
      </main>
    </div>
  );
}
