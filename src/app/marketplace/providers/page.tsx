import Link from "next/link";

import { Button, Card, Container, Pill, StatTile } from "@/components/ui";

function providersFor(service: string) {
  // v1: curated demo cards; wiring comes later
  const base = [
    { id: "alpha", name: "Alpha Home Services", rating: "4.9", reviews: "312", note: "Licensed and insured" },
    { id: "oak", name: "Oak & Stone", rating: "4.8", reviews: "201", note: "Fast scheduling" },
    { id: "north", name: "Northside Pros", rating: "4.7", reviews: "158", note: "Great communication" },
  ];
  return base.map((p) => ({ ...p, service }));
}

export default async function Page(props: { searchParams: Promise<{ service?: string; issue?: string }> }) {
  const sp = await props.searchParams;
  const service = sp.service || "General";
  const issue = sp.issue;
  const providers = providersFor(service);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <Container className="py-16 md:py-20 lg:py-24">
        {/* ── Header ── */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
              Matches
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
              Providers for {service}
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-[var(--hw-muted)]">
              Curated list first. You decide who to book. Identity gating and deeper profiles come next.
            </p>
            {issue && (
              <p className="text-sm text-[var(--hw-muted)]">
                Issue:&nbsp;&ldquo;{issue}&rdquo;
              </p>
            )}
          </div>
          <Pill>v1 curated</Pill>
        </div>

        {/* ── Stat tiles ── */}
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <StatTile label="Selection" value="Report-style" note="Pick a provider, then schedule." />
          <StatTile label="Trust" value="Visible" note="Ratings, reviews, verified notes." />
          <StatTile label="Capture" value="At schedule" note="Email at confirmation step." />
        </div>

        {/* ── Provider cards ── */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((p) => (
            <Card key={p.id} className="flex flex-col justify-between p-7 md:p-8">
              <div>
                <h2 className="text-base font-bold leading-snug">{p.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--hw-muted)]">{p.note}</p>

                <div className="mt-5 flex items-center gap-1.5 text-sm text-[var(--hw-muted)]">
                  <span className="font-semibold text-[var(--hw-foreground)]">{p.rating}</span>
                  <span>·</span>
                  <span>{p.reviews} reviews</span>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  href={{
                    pathname: "/marketplace/schedule",
                    query: { provider: p.id, service },
                  }}
                >
                  <Button>Schedule</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>

        {/* ── Back link ── */}
        <div className="mt-14">
          <Link
            href="/marketplace/request"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--hw-muted)] transition-colors hover:text-[var(--hw-foreground)]"
          >
            <span aria-hidden="true">&larr;</span>
            Back
          </Link>
        </div>
      </Container>
    </div>
  );
}
