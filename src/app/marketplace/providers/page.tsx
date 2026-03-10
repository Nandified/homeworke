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
      <Container className="py-12 md:py-14">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Matches</div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">Providers for {service}</h1>
            <div className="mt-2 max-w-3xl text-sm leading-7 text-[var(--hw-muted)]">
              Curated list first. You decide who to book. Identity gating and deeper profiles come next.
            </div>
            {issue ? <div className="mt-2 text-sm text-[var(--hw-muted)]">Issue: “{issue}”</div> : null}
          </div>
          <Pill>v1 curated</Pill>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <StatTile label="Selection" value="Report-style" note="Pick a provider, then schedule." />
          <StatTile label="Trust" value="Visible" note="Ratings, reviews, verified notes." />
          <StatTile label="Capture" value="At schedule" note="Email at confirmation step." />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {providers.map((p) => (
            <Card key={p.id} className="p-6 md:p-7">
              <div className="text-sm font-semibold">{p.name}</div>
              <div className="mt-2 text-sm text-[var(--hw-muted)]">{p.note}</div>
              <div className="mt-4 text-sm text-[var(--hw-muted)]">
                Rating {p.rating} · {p.reviews} reviews
              </div>
              <div className="mt-6">
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

        <div className="mt-6 text-sm text-[var(--hw-muted)]">
          <Link href="/marketplace/request">Back</Link>
        </div>
      </Container>
    </div>
  );
}
