import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button, Card, Container, Pill } from "@/components/ui";
import { iconFor } from "@/components/icons";
import homepage from "@/content/homepage_opus.json";

export function Homepage() {
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
            <Link href="/real-estate-pros#demo">
              <Button variant="ghost">Schedule a Demo</Button>
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
                <Pill>Relationship-first by design</Pill>
              </div>

              <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-tight text-[var(--hw-ink)] md:text-5xl">
                {homepage.hero.headline}
              </h1>
              <p className="mt-4 max-w-xl text-pretty text-base leading-7 text-[var(--hw-muted)]">
                {homepage.hero.subheadline}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/homeowners">
                  <Button>
                    {homepage.hero.primaryCta}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/homeowners">
                  <Button variant="ghost">{homepage.hero.secondaryCta}</Button>
                </Link>
              </div>

              <Card className="mt-8 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">
                      Marketplace
                    </div>
                    <div className="mt-1 text-sm font-semibold text-[var(--hw-ink)]">{homepage.marketplace.label}</div>
                  </div>
                  <Pill>
                    <Sparkles className="h-4 w-4" />
                    AI-assisted
                  </Pill>
                </div>

                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[var(--hw-line)] bg-white p-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-[var(--hw-red)]" />
                  <input
                    className="w-full bg-transparent text-sm outline-none"
                    placeholder={homepage.marketplace.placeholder}
                    aria-label="Marketplace input"
                  />
                  <Link href="/marketplace">
                    <Button>Get options</Button>
                  </Link>
                </div>

                <div className="mt-3 text-sm text-[var(--hw-muted)]">{homepage.marketplace.helper}</div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {homepage.marketplace.suggestionChips.map((chip) => (
                    <span
                      key={chip}
                      className="inline-flex items-center rounded-full border border-[var(--hw-line)] bg-white px-3 py-2 text-xs font-medium text-[var(--hw-muted)]"
                    >
                      {chip}
                    </span>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl border border-[var(--hw-line)] bg-[var(--hw-soft)] p-4 text-sm text-[var(--hw-muted)]">
                  {homepage.marketplace.trustLine}
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Card className="p-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Who this is for</div>
                <div className="mt-2 text-sm font-semibold">Choose your lane</div>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {homepage.audienceTiles.map((t) => {
                    const Icon = iconFor(t.icon);
                    return (
                      <Link key={t.audience} href={t.route} className="group">
                        <div className="h-full rounded-2xl border border-[var(--hw-line)] bg-white p-4 transition hover:bg-[var(--hw-soft)]">
                          <div className="flex items-start gap-3">
                            <div className="rounded-2xl border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.08)] p-2">
                              <Icon className="h-5 w-5 text-[var(--hw-red)]" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-[var(--hw-ink)]">{t.title}</div>
                              <div className="mt-1 text-sm leading-6 text-[var(--hw-muted)]">{t.text}</div>
                              <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--hw-red)]">
                                {t.cta}
                                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">How Homeworke works</div>
                <div className="mt-2 text-sm font-semibold">Three-sided marketplace, one clean workflow</div>
                <div className="mt-4 grid grid-cols-1 gap-3">
                  {["Homeowners request service", "Project Managers guide execution", "Vetted providers do the work", "Partners stay in the loop when allowed"].map(
                    (s) => (
                      <div key={s} className="rounded-2xl border border-[var(--hw-line)] bg-white p-4">
                        <div className="text-sm font-semibold">{s}</div>
                        <div className="mt-1 text-sm text-[var(--hw-muted)]">
                          Designed for speed-to-book and accountability, with privacy controls and milestone-based payments.
                        </div>
                      </div>
                    )
                  )}
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
