import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { Button, Card, Container, Pill } from "@/components/ui";
import { iconFor } from "@/components/icons";
import { SiteFooter, SiteHeader } from "@/components/site-shell";

import homepage from "@/content/homepage_opus.json";
import servicesData from "@/content/services.json";

export function Homepage() {
  const services = servicesData.services.slice(0, 6);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-[#fafafa]">
      <SiteHeader />

      <main>
        {/* Hero */}
        <Container className="py-12">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <div className="flex flex-wrap gap-2">
                <Pill>Chicago-first</Pill>
                <Pill>Free estimates</Pill>
                <Pill>Vetted local pros</Pill>
              </div>

              <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-tight text-[var(--hw-ink)] md:text-6xl">
                {homepage.hero.headline}
              </h1>
              <p className="mt-4 max-w-2xl text-pretty text-base leading-7 text-[var(--hw-muted)] md:text-lg">
                {homepage.hero.subheadline}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/estimate">
                  <Button>
                    {homepage.hero.primaryCta}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/services">
                  <Button variant="ghost">{homepage.hero.secondaryCta}</Button>
                </Link>
              </div>

              <div className="mt-4 text-sm text-[var(--hw-muted)]">{homepage.hero.disclaimer}</div>
            </div>

            <div className="lg:col-span-5">
              <Card className="p-6">
                <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Instant estimate</div>
                <div className="mt-2 text-xl font-bold text-[var(--hw-ink)]">Tell us what you need</div>
                <div className="mt-2 text-sm text-[var(--hw-muted)]">Answer a few quick questions and we’ll generate an instant estimate and next steps.</div>

                <div className="mt-5 grid grid-cols-1 gap-3">
                  {services.slice(0, 3).map((s) => {
                    const Icon = iconFor(s.icon);
                    return (
                      <Link
                        key={s.slug}
                        href={`/estimate?service=${encodeURIComponent(s.slug)}`}
                        className="group"
                      >
                        <div className="flex items-center gap-3 rounded-2xl border border-[var(--hw-line)] bg-white p-4 transition hover:bg-[var(--hw-soft)]">
                          <div className="rounded-2xl border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.08)] p-2">
                            <Icon className="h-5 w-5 text-[var(--hw-red)]" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-[var(--hw-ink)]">{s.name}</div>
                            <div className="mt-0.5 text-sm text-[var(--hw-muted)]">{s.summary}</div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-[var(--hw-muted)] transition group-hover:translate-x-0.5" />
                        </div>
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-2xl border border-[var(--hw-line)] bg-[var(--hw-soft)] p-4 text-sm text-[var(--hw-muted)]">
                  Chicago-first today. If you’re nearby, submit a request and we’ll confirm coverage.
                </div>
              </Card>
            </div>
          </div>
        </Container>

        {/* Trust */}
        <Container className="pb-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {homepage.trust.bullets.map((b) => {
              const Icon = iconFor(b.icon);
              return (
                <Card key={b.title} className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.08)] p-2">
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

        {/* How it works */}
        <Container className="py-10">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">{homepage.howItWorks.title}</div>
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
            {homepage.howItWorks.steps.map((s) => {
              const Icon = iconFor(s.icon);
              return (
                <Card key={s.title} className="p-6">
                  <div className="rounded-2xl border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.08)] p-2 w-fit">
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
        <Container className="py-4">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">{homepage.services.title}</div>
              <div className="mt-2 text-2xl font-bold text-[var(--hw-ink)]">Pick a category to get started</div>
            </div>
            <Link href="/services" className="hidden md:block">
              <Button variant="ghost">
                {homepage.services.cta}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => {
              const Icon = iconFor(s.icon);
              return (
                <Link key={s.slug} href={`/services/${s.slug}`} className="group">
                  <Card className="h-full p-6 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(17,24,39,.08)]">
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.08)] p-2">
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
        </Container>

        {/* FAQ */}
        <Container className="py-12">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">{homepage.faq.title}</div>
          <div className="mt-2 text-2xl font-bold text-[var(--hw-ink)]">Quick answers</div>
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {homepage.faq.items.map((item) => (
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
              <Button variant="ghost">Talk to us</Button>
            </Link>
          </div>
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}
