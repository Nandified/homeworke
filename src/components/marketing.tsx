import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button, Card, Container, Pill } from "@/components/ui";
import { iconFor } from "@/components/icons";

type TrustBullet = { icon: string; text: string };

type Section = {
  title: string;
  subtitle: string;
  bullets: TrustBullet[];
};

type Faq = { q: string; a: string };

type Hero = {
  headline: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta: string;
  trustBullets: TrustBullet[];
};

type DemoForm = { fields: string[]; submitLabel: string };

type PageContent = {
  route: string;
  hero: Hero;
  sections: Section[];
  faq?: Faq[];
  demoForm?: DemoForm;
};

export function MarketingHero(props: { hero: Hero; primaryHref: string; secondaryHref: string }) {
  const { hero, primaryHref, secondaryHref } = props;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div>
        <Pill>Trust-first marketplace</Pill>
        <h1 className="mt-4 text-balance text-4xl font-extrabold tracking-tight text-[var(--hw-ink)] md:text-5xl">
          {hero.headline}
        </h1>
        <p className="mt-4 max-w-xl text-pretty text-base leading-7 text-[var(--hw-muted)]">{hero.subheadline}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={primaryHref}>
            <Button>
              {hero.primaryCta}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={secondaryHref}>
            <Button variant="ghost">{hero.secondaryCta}</Button>
          </Link>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {hero.trustBullets.map((b) => {
            const Icon = iconFor(b.icon);
            return (
              <div key={b.text} className="rounded-2xl border border-[var(--hw-line)] bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.08)] p-2">
                    <Icon className="h-5 w-5 text-[var(--hw-red)]" />
                  </div>
                  <div className="text-sm font-medium text-[var(--hw-ink)]">{b.text}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Card className="p-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Preview</div>
        <div className="mt-2 text-sm font-semibold">AI service picker + curated matching</div>
        <div className="mt-4 rounded-2xl border border-[var(--hw-line)] bg-white p-4">
          <div className="h-9 w-full rounded-xl hw-shimmer" />
          <div className="mt-3 flex flex-wrap gap-2">
            <div className="h-8 w-28 rounded-full hw-shimmer" />
            <div className="h-8 w-24 rounded-full hw-shimmer" />
            <div className="h-8 w-32 rounded-full hw-shimmer" />
          </div>
          <div className="mt-4 grid gap-3">
            <div className="h-14 w-full rounded-2xl hw-shimmer" />
            <div className="h-14 w-full rounded-2xl hw-shimmer" />
            <div className="h-14 w-full rounded-2xl hw-shimmer" />
          </div>
        </div>
        <div className="mt-3 text-sm text-[var(--hw-muted)]">
          Subtle AI breath only during thinking states. Icons only. No emojis.
        </div>
      </Card>
    </div>
  );
}

export function MarketingSections(props: { sections: Section[] }) {
  return (
    <div className="mt-10 grid grid-cols-1 gap-4">
      {props.sections.map((s) => (
        <Card key={s.title} className="p-6">
          <div className="text-xl font-extrabold tracking-tight">{s.title}</div>
          <div className="mt-2 max-w-3xl text-sm leading-7 text-[var(--hw-muted)]">{s.subtitle}</div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {s.bullets.map((b) => {
              const Icon = iconFor(b.icon);
              return (
                <div key={b.text} className="rounded-2xl border border-[var(--hw-line)] bg-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.08)] p-2">
                      <Icon className="h-5 w-5 text-[var(--hw-red)]" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{b.text}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}

export function MarketingFaq(props: { faq: Faq[] }) {
  return (
    <Card className="mt-10 p-6">
      <div className="text-xl font-extrabold tracking-tight">FAQ</div>
      <div className="mt-4 grid grid-cols-1 gap-3">
        {props.faq.map((f) => (
          <div key={f.q} className="rounded-2xl border border-[var(--hw-line)] bg-white p-4">
            <div className="text-sm font-semibold">{f.q}</div>
            <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">{f.a}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

import { DemoForm } from "@/components/demo-form";

export function DemoFormCard(props: { demoForm: DemoForm }) {
  void props.demoForm;
  return <DemoForm />;
}

export function MarketingPage(props: { content: Record<string, unknown> }) {
  const content = props.content as unknown as PageContent;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <header className="sticky top-0 z-20 border-b border-[var(--hw-line)] bg-white/80 backdrop-blur">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" className="text-sm font-extrabold tracking-tight">
            Homeworke
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
        <Container className="py-10">
          <MarketingHero hero={content.hero} primaryHref="#" secondaryHref="#" />
          <MarketingSections sections={content.sections} />
          {content.demoForm ? (
            <div id="demo">
              <DemoFormCard demoForm={content.demoForm} />
            </div>
          ) : null}
          <MarketingFaq faq={content.faq ?? []} />
        </Container>
      </main>

      <footer className="border-t border-[var(--hw-line)] bg-white">
        <Container className="flex flex-col gap-3 py-10 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-[var(--hw-muted)]">Homeworke 3.0 · Making Homeownership Easy</div>
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
