import Image from "next/image";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  MapPin,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";

import { Button, Card, Container, Pill } from "@/components/ui";

function ProviderCard(props: {
  title: string;
  rating: number;
  reviews: number;
  jobs: number;
  badge: string;
}) {
  const { title, rating, reviews, jobs, badge } = props;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--hw-line)] bg-white p-3">
      <div className="h-10 w-10 rounded-2xl border border-[rgba(229,57,53,.18)] bg-gradient-to-br from-[rgba(229,57,53,.16)] to-[rgba(17,24,39,.06)]" />
      <div className="flex-1">
        <div className="text-sm font-semibold text-[var(--hw-ink)]">{badge}</div>
        <div className="text-sm font-semibold text-[var(--hw-ink)]">{title}</div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--hw-muted)]">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-[var(--hw-red)]" />
            <span className="font-semibold text-[var(--hw-red)]">{rating.toFixed(1)}</span>
          </span>
          <span>· {reviews} reviews</span>
          <span>· {jobs} jobs</span>
        </div>
      </div>
      <Button variant="ghost">View</Button>
    </div>
  );
}

function SuggestionChip(props: { label: string; active?: boolean }) {
  const { label, active } = props;
  return (
    <button
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition",
        active
          ? "border-[rgba(229,57,53,.25)] bg-[rgba(229,57,53,.08)] text-[var(--hw-ink)]"
          : "border-[var(--hw-line)] bg-white text-[var(--hw-muted)] hover:bg-[var(--hw-soft)]",
      ].join(" ")}
      type="button"
    >
      <Sparkles className={active ? "h-3.5 w-3.5 text-[var(--hw-red)]" : "h-3.5 w-3.5 text-[var(--hw-muted)]"} />
      {label}
    </button>
  );
}

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <header className="sticky top-0 z-20 border-b border-[var(--hw-line)] bg-white/80 backdrop-blur">
        <Container className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-36">
              <Image
                src="/brand/Homeworke - Logo Main W Slogan (Black & Red).png"
                alt="Homeworke"
                fill
                className="object-contain"
                priority
              />
            </div>
            <Pill>
              <ShieldCheck className="h-4 w-4" />
              Trust-first marketplace
            </Pill>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            <Button variant="ghost">Homeowners</Button>
            <Button variant="ghost">Real Estate Pros</Button>
            <Button variant="ghost">Service Providers</Button>
            <Button variant="ghost">Schedule a Demo</Button>
          </nav>
        </Container>
      </header>

      <main>
        <Container className="py-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="pt-2">
              <div className="flex flex-wrap gap-2">
                <Pill>
                  <CheckCircle2 className="h-4 w-4" />
                  Making Homeownership Easy
                </Pill>
                <Pill>
                  <MapPin className="h-4 w-4" />
                  Chicago-first, expands everywhere
                </Pill>
              </div>

              <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-tight text-[var(--hw-ink)] md:text-5xl">
                Clean, trust-first, red-led.
                <span className="block">Marketplace + relationship engine.</span>
              </h1>

              <p className="mt-4 max-w-xl text-pretty text-base leading-7 text-[var(--hw-muted)]">
                Book home maintenance and repairs with a frictionless funnel. Keep the right professionals in the loop
                when you choose. Designed to feel premium and alive without being noisy.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button>
                  Get service options
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost">How it works</Button>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Card className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.08)] p-2">
                      <Bot className="h-5 w-5 text-[var(--hw-red)]" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">AI service picker</div>
                      <div className="mt-1 text-sm text-[var(--hw-muted)]">
                        Describe the issue. Get a few smart suggestions. Select or let the system choose.
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.08)] p-2">
                      <MessageSquareText className="h-5 w-5 text-[var(--hw-red)]" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Live feel</div>
                      <div className="mt-1 text-sm text-[var(--hw-muted)]">
                        Day-of tracking for appointments and project updates, similar to a delivery timeline.
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">
                    AI service picker
                  </div>
                  <div className="mt-1 text-sm font-semibold text-[var(--hw-ink)]">Whats going on?</div>
                </div>
                <Pill>
                  <Sparkles className="h-4 w-4" />
                  Suggestions
                </Pill>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[var(--hw-line)] bg-white p-3">
                <div className="h-2.5 w-2.5 rounded-full bg-[var(--hw-red)]" />
                <input
                  className="w-full bg-transparent text-sm outline-none"
                  defaultValue="My kitchen sink is leaking under the cabinet…"
                  aria-label="Describe your issue"
                />
                <Button>Get options</Button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <SuggestionChip label="Plumbing" active />
                <SuggestionChip label="Leak repair" />
                <SuggestionChip label="Emergency?" />
                <SuggestionChip label="Under-sink" />
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Recommended pros</div>
                  <button className="text-sm font-semibold text-[var(--hw-red)]" type="button">
                    View more
                  </button>
                </div>

                <div className="mt-3 grid gap-3">
                  <ProviderCard
                    badge="Top match · identity gated"
                    title='"A. Plumbing"'
                    rating={4.9}
                    reviews={312}
                    jobs={184}
                  />
                  <ProviderCard
                    badge="Fastest response"
                    title='"Northside Pros"'
                    rating={4.8}
                    reviews={141}
                    jobs={96}
                  />
                  <ProviderCard
                    badge="Best value"
                    title='"City Fix"'
                    rating={4.7}
                    reviews={88}
                    jobs={51}
                  />
                </div>

                <div className="mt-4 rounded-2xl border border-[var(--hw-line)] bg-[var(--hw-soft)] p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl border border-[rgba(229,57,53,.18)] bg-white p-2">
                      <Sparkles className="h-5 w-5 text-[var(--hw-red)]" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Subtle AI breath</div>
                      <div className="mt-1 text-sm text-[var(--hw-muted)]">
                        When AI is thinking, show a calm typing indicator and a light shimmer on suggestion chips.
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <div className="h-8 flex-1 rounded-xl hw-shimmer" />
                    <div className="h-8 w-24 rounded-xl hw-shimmer" />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Card className="mt-6 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Live feel</div>
                <div className="mt-1 text-xl font-extrabold tracking-tight">Appointment timeline (concept)</div>
              </div>
              <Pill>
                <ShieldCheck className="h-4 w-4" />
                Status updates, not noise
              </Pill>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              {[
                {
                  title: "PM assigned",
                  desc: "Show the PM name and a verified badge once assigned.",
                  icon: <CheckCircle2 className="h-5 w-5 text-[var(--hw-red)]" />,
                },
                {
                  title: "On the way",
                  desc: "Calm progress state with ETA. No confetti, no emoji.",
                  icon: <Sparkles className="h-5 w-5 text-[var(--hw-red)]" />,
                },
                {
                  title: "Arrived",
                  desc: "Clear arrival confirmation and next step.",
                  icon: <ShieldCheck className="h-5 w-5 text-[var(--hw-red)]" />,
                },
              ].map((s) => (
                <div key={s.title} className="rounded-2xl border border-[var(--hw-line)] bg-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.08)] p-2">
                      {s.icon}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{s.title}</div>
                      <div className="mt-1 text-sm text-[var(--hw-muted)]">{s.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
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
