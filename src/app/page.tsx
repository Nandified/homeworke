"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button, Card, Chip, Container, Input, Pill, StatTile } from "@/components/ui";
import { loadPartner } from "@/lib/partner-context";
import homepage from "@/../spec/homepage_v1_opus.json";

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
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-[#f7f7f8]">
      {/* ── Header ── */}
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
        {/* ══════════════════════════════════════════════
            HERO — full-width band with generous vertical rhythm
            ══════════════════════════════════════════════ */}
        <section className="relative overflow-hidden">
          {/* subtle decorative gradient orb */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-[var(--hw-red)] opacity-[0.04] blur-[120px]"
          />

          <Container className="relative py-16 md:py-24 lg:py-28">
            {/* Pills row */}
            <div className="flex flex-wrap gap-2">
              <Pill>Trust-first marketplace</Pill>
              <Pill>Relationship engine (permissioned)</Pill>
              {(() => {
                try {
                  const partner = loadPartner();
                  if (!partner) return null;
                  return <Pill>Recommended by {partner.partnerName}</Pill>;
                } catch {
                  return null;
                }
              })()}
            </div>

            {/* Headline */}
            <h1 className="mt-6 max-w-3xl text-balance text-4xl font-extrabold leading-[1.08] tracking-tight text-[var(--hw-ink)] sm:text-5xl md:text-6xl lg:text-7xl">
              {homepage.hero.headline}
            </h1>

            {/* Sub-headline */}
            <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-[var(--hw-muted)] md:text-lg md:leading-8">
              {homepage.hero.subheadline}
            </p>

            {/* ── Alive intake card ── */}
            <Card className="mt-10 max-w-2xl p-5 sm:p-7 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
                    {homepage.hero.chatLabel}
                  </div>
                  <div className="mt-1 text-sm text-[var(--hw-muted)]">{homepage.hero.chatHelper}</div>
                </div>
                <Pill>Alive</Pill>
              </div>

              {/* Input row */}
              <div className="mt-5 flex items-center gap-3 rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-3 transition-shadow focus-within:shadow-md sm:p-4">
                <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--hw-red)]" />
                <Input
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  placeholder={homepage.hero.chatPlaceholder}
                  aria-label="Describe your issue"
                  className="border-0 focus:ring-0"
                />
              </div>

              {/* Rotating hint */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-[var(--hw-muted)] sm:text-sm">
                <span className="font-semibold">Hint:</span>
                <span className="transition-opacity duration-300">{aliveHints[hintIdx]}</span>
              </div>

              {/* Chips */}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Chip>Suggested: {suggested || "—"}</Chip>
                <Chip>Capture at scheduling</Chip>
              </div>

              {/* ── CTA block — visually separated ── */}
              <div className="mt-7 flex flex-col gap-3 border-t border-[var(--hw-line)] pt-6 sm:flex-row sm:items-center">
                <Link
                  href={{
                    pathname: "/marketplace/providers",
                    query: { service: suggested || homepage.quickSelect.options[0], issue: issue.trim() || undefined },
                  }}
                >
                  <Button className="w-full sm:w-auto">{homepage.hero.primaryCta}</Button>
                </Link>
                <Link href="/marketplace/intake">
                  <Button variant="secondary" className="w-full sm:w-auto">{homepage.hero.secondaryCta}</Button>
                </Link>
              </div>

              {/* Quick-select */}
              <div className="mt-8">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
                  {homepage.quickSelect.label}
                </div>
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
          </Container>
        </section>

        {/* ══════════════════════════════════════════════
            TRUST + HOW IT WORKS — two-column on desktop
            ══════════════════════════════════════════════ */}
        <section className="border-t border-[var(--hw-line)] bg-[#fafafa]">
          <Container className="py-14 md:py-20">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Trust / Selling points */}
              <Card className="p-5 sm:p-7 md:p-8">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Trust</div>
                <div className="mt-2 text-base font-semibold text-[var(--hw-ink)]">What you get</div>
                <div className="mt-5 grid grid-cols-1 gap-3">
                  {homepage.sellingPoints.slice(0, 4).map((s) => (
                    <div
                      key={s.title}
                      className="rounded-[var(--hw-radius)] border border-[var(--hw-line)] bg-white p-4"
                    >
                      <div className="text-sm font-semibold text-[var(--hw-ink)]">{s.title}</div>
                      <div className="mt-1 text-sm leading-relaxed text-[var(--hw-muted)]">{s.text}</div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* How it works */}
              <Card className="p-5 sm:p-7 md:p-8">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">How it works</div>
                <div className="mt-5 grid gap-3">
                  {homepage.howItWorks.map((s) => (
                    <div
                      key={s.step}
                      className="rounded-[var(--hw-radius)] border border-[var(--hw-line)] bg-white p-4"
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
                        {s.step}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-[var(--hw-ink)]">{s.title}</div>
                      <div className="mt-1 text-sm leading-relaxed text-[var(--hw-muted)]">{s.text}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </Container>
        </section>

        {/* ══════════════════════════════════════════════
            STAT TILES + DISCLAIMER
            ══════════════════════════════════════════════ */}
        <section>
          <Container className="py-14 md:py-20">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(homepage.trust.tiles as any[]).slice(0, 3).map((t: any, idx: number) => (
                <StatTile
                  key={idx}
                  label={t.label || t.title || "Trust"}
                  value={t.value || ""}
                  note={t.note || t.text || ""}
                />
              ))}
            </div>

            <p className="mt-8 max-w-3xl text-xs leading-relaxed text-[var(--hw-muted)] sm:text-sm">
              {homepage.trust.disclaimer}
            </p>
          </Container>
        </section>
      </main>
    </div>
  );
}
