"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Filter, Search, Sparkles, Star } from "lucide-react";

import { Button, Card, Container, Pill } from "@/components/ui";
import { iconFor } from "@/components/icons";
import spec from "@/content/marketplace_opus.json";

type CuratedCard = (typeof spec.curated.cards)[number];

function RatingRow(props: { rating: number; reviews: number; jobs: number }) {
  const { rating, reviews, jobs } = props;
  return (
    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--hw-muted)]">
      <span className="inline-flex items-center gap-1">
        <Star className="h-3.5 w-3.5 text-[var(--hw-red)]" />
        <span className="font-semibold text-[var(--hw-red)]">{rating.toFixed(1)}</span>
      </span>
      <span>· {reviews} reviews</span>
      <span>· {jobs} jobs</span>
    </div>
  );
}

function ProviderCard(props: CuratedCard & { compact?: boolean }) {
  const { badge, displayName, identityGated, rating, reviews, jobs, highlights, cta, compact } = props;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[var(--hw-line)] bg-white p-4">
      <div className="h-11 w-11 rounded-2xl border border-[rgba(229,57,53,.18)] bg-gradient-to-br from-[rgba(229,57,53,.16)] to-[rgba(17,24,39,.06)]" />
      <div className="flex-1">
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">{badge}</div>
        <div className="mt-1 text-sm font-semibold text-[var(--hw-ink)]">
          {displayName} {identityGated ? <span className="text-[var(--hw-muted)]">(identity gated)</span> : null}
        </div>
        <RatingRow rating={rating} reviews={reviews} jobs={jobs} />

        {!compact ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {highlights.map((h) => (
              <span
                key={h}
                className="inline-flex items-center rounded-full border border-[var(--hw-line)] bg-white px-3 py-2 text-xs font-medium text-[var(--hw-muted)]"
              >
                {h}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <Link href="/providers/alpha">
          <Button variant="ghost">{cta}</Button>
        </Link>
        <Link href="/appointments/demo">
          <Button variant="ghost">Track appointment</Button>
        </Link>
      </div>
    </div>
  );
}

export function MarketplacePage() {
  const [query, setQuery] = useState("");
  const [showMore, setShowMore] = useState(false);
  const chips = spec.search.chips;

  const effectiveQuery = query.trim() || chips[0];

  const rows = useMemo(() => {
    // Mock: In v1 we display the spec rows. Later this becomes AI+matching.
    return spec.viewMore.rows;
  }, []);

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
            <Link href="/homeowners">
              <Button variant="ghost">Homeowners</Button>
            </Link>
            <Link href="/real-estate-pros">
              <Button variant="ghost">Real Estate Pros</Button>
            </Link>
            <Link href="/service-providers">
              <Button variant="ghost">Service Providers</Button>
            </Link>
          </nav>
        </Container>
      </header>

      <main>
        <Container className="py-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Marketplace</div>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{spec.pageTitle}</h1>
            </div>
            <Pill>
              <Sparkles className="h-4 w-4" />
              AI-assisted matching
            </Pill>
          </div>

          <Card className="mt-6 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{spec.search.label}</div>
                <div className="mt-1 text-sm text-[var(--hw-muted)]">{spec.search.helper}</div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[var(--hw-line)] bg-white p-3">
              <Search className="h-4 w-4 text-[var(--hw-muted)]" />
              <input
                className="w-full bg-transparent text-sm outline-none"
                placeholder={spec.search.placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Describe your issue"
              />
              <Button>Get options</Button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {chips.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setQuery(c)}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--hw-line)] bg-white px-3 py-2 text-xs font-medium text-[var(--hw-muted)] hover:bg-[var(--hw-soft)]"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[var(--hw-muted)]" />
                  {c}
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-[var(--hw-line)] bg-[var(--hw-soft)] p-4 text-sm text-[var(--hw-muted)]">
              {spec.search.disclaimer}
            </div>
          </Card>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="p-6 lg:col-span-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">{spec.curated.title}</div>
                  <div className="mt-1 text-sm text-[var(--hw-muted)]">{spec.curated.subtitle}</div>
                </div>
                <Button variant="ghost" onClick={() => setShowMore(true)}>
                  {spec.viewMore.buttonLabel}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-4 grid gap-3">
                {spec.curated.cards.map((c) => (
                  <ProviderCard key={c.displayName} {...c} />
                ))}
              </div>

              {!showMore ? null : (
                <div className="mt-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{spec.viewMore.listTitle}</div>
                      <div className="mt-1 text-sm text-[var(--hw-muted)]">{spec.viewMore.listSubtitle}</div>
                    </div>
                    <Pill>
                      <Filter className="h-4 w-4" />
                      Filters
                    </Pill>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {spec.viewMore.filters.map((f) => (
                      <span
                        key={f.key}
                        className="inline-flex items-center rounded-full border border-[var(--hw-line)] bg-white px-3 py-2 text-xs font-medium text-[var(--hw-muted)]"
                      >
                        {f.label}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-3">
                    {rows.map((r) => (
                      <div
                        key={r.displayName + r.etaLabel}
                        className="flex items-center gap-3 rounded-2xl border border-[var(--hw-line)] bg-white p-4"
                      >
                        <div className="h-10 w-10 rounded-2xl border border-[rgba(229,57,53,.18)] bg-gradient-to-br from-[rgba(229,57,53,.16)] to-[rgba(17,24,39,.06)]" />
                        <div className="flex-1">
                          <div className="text-sm font-semibold">
                            {r.displayName}{" "}
                            {r.identityGated ? (
                              <span className="text-[var(--hw-muted)]">(identity gated)</span>
                            ) : null}
                          </div>
                          <RatingRow rating={r.rating} reviews={r.reviews} jobs={r.jobs} />
                          <div className="mt-1 text-xs text-[var(--hw-muted)]">
                            {r.etaLabel} · {r.priceBand}
                          </div>
                        </div>
                        <Link href="/providers/alpha">
                          <Button variant="ghost">{r.cta}</Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <div className="grid gap-4">
              <Card className="p-6">
                <div className="text-sm font-semibold">Trust and control</div>
                <div className="mt-4 grid gap-3">
                  {Array.isArray((spec as any).trust) && (spec as any).trust.length ? (
                    (spec as any).trust.map((t: any) => {
                      const Icon = iconFor(t.icon);
                      return (
                        <div key={t.title} className="rounded-2xl border border-[var(--hw-line)] bg-white p-4">
                          <div className="flex items-start gap-3">
                            <div className="rounded-2xl border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.08)] p-2">
                              <Icon className="h-5 w-5 text-[var(--hw-red)]" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold">{t.title}</div>
                              <div className="mt-1 text-sm leading-6 text-[var(--hw-muted)]">{t.text}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <>
                      <div className="rounded-2xl border border-[var(--hw-line)] bg-white p-4">
                        <div className="text-sm font-semibold">Verified providers</div>
                        <div className="mt-1 text-sm leading-6 text-[var(--hw-muted)]">
                          Providers are vetted before assignment. Identity can remain gated until confirmation.
                        </div>
                      </div>
                      <div className="rounded-2xl border border-[var(--hw-line)] bg-white p-4">
                        <div className="text-sm font-semibold">Milestone-based draws</div>
                        <div className="mt-1 text-sm leading-6 text-[var(--hw-muted)]">
                          Payments release only as milestones are verified to protect homeowners and keep execution accountable.
                        </div>
                      </div>
                      <div className="rounded-2xl border border-[var(--hw-line)] bg-white p-4">
                        <div className="text-sm font-semibold">Project Manager support</div>
                        <div className="mt-1 text-sm leading-6 text-[var(--hw-muted)]">
                          Dedicated oversight for scope clarity, scheduling, and completion verification.
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <div className="text-sm font-semibold">Next</div>
                <div className="mt-2 text-sm text-[var(--hw-muted)]">
                  Next step is wiring this to a real taxonomy, availability rules, and AI classification.
                </div>
              </Card>
            </div>
          </div>

          <div className="mt-6 text-sm text-[var(--hw-muted)]">
            Showing results for <span className="font-semibold text-[var(--hw-ink)]">{effectiveQuery}</span>.
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
