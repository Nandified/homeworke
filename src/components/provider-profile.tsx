"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star } from "lucide-react";

import { Button, Card, Container, Pill } from "@/components/ui";
import { iconFor } from "@/components/icons";
import spec from "@/content/provider_profile_opus.json";

function RatingRow(props: { rating: number; reviews: number; jobs: number }) {
  const { rating, reviews, jobs } = props;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--hw-muted)]">
      <span className="inline-flex items-center gap-1">
        <Star className="h-4 w-4 text-[var(--hw-red)]" />
        <span className="font-semibold text-[var(--hw-red)]">{rating.toFixed(1)}</span>
      </span>
      <span>· {reviews} reviews</span>
      <span>· {jobs} jobs</span>
    </div>
  );
}

export function ProviderProfilePage(props: { id: string }) {
  const provider =
    (spec as any).sampleProviders?.find((p: any) => p.id === props.id) ?? (spec as any).sampleProviders?.[0];

  const displayName = provider?.displayName ?? spec.identity.gatedLabel;

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
            <Link href="/real-estate-pros">
              <Button variant="ghost">Real Estate Pros</Button>
            </Link>
          </nav>
        </Container>
      </header>

      <main>
        <Container className="py-10">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Provider</div>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{displayName}</h1>
              <div className="mt-2 text-sm text-[var(--hw-muted)]">
                {provider?.city ? `${provider.city} · ` : ""}
                {provider?.specialty ?? "Verified specialist"}
              </div>
              <RatingRow rating={provider?.rating ?? 4.8} reviews={provider?.reviews ?? 200} jobs={provider?.jobs ?? 300} />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button>{spec.ctas.primary}</Button>
              <Button variant="ghost">{spec.ctas.secondary}</Button>
            </div>
          </div>

          <Card className="mt-6 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Identity gating</div>
                <div className="mt-1 text-sm text-[var(--hw-muted)]">{spec.identity.revealRuleText}</div>
              </div>
              <Pill>{spec.identity.gatedLabel}</Pill>
            </div>
          </Card>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="p-6 lg:col-span-2">
              <div className="text-sm font-semibold">Verified badges</div>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {spec.identity.verifiedBadges.map((b) => {
                  const Icon = iconFor(b.icon);
                  return (
                    <div key={b.label} className="rounded-2xl border border-[var(--hw-line)] bg-white p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.08)] p-2">
                          <Icon className="h-5 w-5 text-[var(--hw-red)]" />
                        </div>
                        <div className="text-sm font-semibold">{b.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
                {spec.stats.map((s) => (
                  <div key={s.label} className="rounded-2xl border border-[var(--hw-line)] bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">{s.label}</div>
                    <div className="mt-2 text-lg font-extrabold tracking-tight">{s.value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-4">
                {spec.sections.map((sec) => (
                  <Card key={sec.title} className="p-6">
                    <div className="text-base font-extrabold tracking-tight">{sec.title}</div>
                    <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">{sec.subtitle}</div>
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                      {sec.bullets.map((b) => {
                        const Icon = iconFor(b.icon);
                        return (
                          <div key={b.text} className="rounded-2xl border border-[var(--hw-line)] bg-white p-4">
                            <div className="flex items-start gap-3">
                              <div className="rounded-2xl border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.08)] p-2">
                                <Icon className="h-5 w-5 text-[var(--hw-red)]" />
                              </div>
                              <div className="text-sm font-semibold">{b.text}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                ))}
              </div>
            </Card>

            <div className="grid gap-4">
              <Card className="p-6">
                <div className="text-sm font-semibold">{spec.reviewModule.title}</div>
                <div className="mt-4 grid gap-3">
                  {spec.reviewModule.rows.map((r) => (
                    <div key={r.summary} className="rounded-2xl border border-[var(--hw-line)] bg-white p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-2xl border border-[var(--hw-line)] bg-[var(--hw-soft)] text-xs font-extrabold flex items-center justify-center">
                            {r.authorInitials}
                          </div>
                          <div className="text-sm font-semibold">{r.summary}</div>
                        </div>
                        <div className="inline-flex items-center gap-1 text-sm">
                          <Star className="h-4 w-4 text-[var(--hw-red)]" />
                          <span className="font-semibold">{r.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">{r.text}</div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <div className="text-sm font-semibold">Next</div>
                <div className="mt-2 text-sm text-[var(--hw-muted)]">{spec.ctas.note}</div>
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
