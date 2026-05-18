import Link from "next/link";

import {
  ArrowRight,
  BellRing,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  FileText,
  Home,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
  Wrench,
  Zap,
} from "lucide-react";

import { Button, Container, Pill } from "@/components/ui";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { NahrepQr } from "@/app/nahrep/NahrepQr";

const betaUrl = "/request-access?source=nahrep&campaign=instant-estimates-beta";

const proofItems = [
  { label: "Agent-first", value: "3.0", text: "A platform built around long-term client relationships." },
  { label: "Repair clarity", value: "Fast", text: "Turn inspection needs into organized next steps." },
  { label: "Client touchpoints", value: "Always", text: "Stay useful without becoming the contractor." },
];

const featureCards = [
  {
    icon: Zap,
    title: "Instant Estimates",
    text: "Upload an inspection, village report, appraisal note, or repair list and convert it into a clear repair-cost view.",
  },
  {
    icon: Wrench,
    title: "203k Rehab Process",
    text: "Help buyers and listing teams understand rehab scope, repair priority, and contractor coordination faster.",
  },
  {
    icon: BellRing,
    title: "Stay Top of Mind",
    text: "Give clients a useful homeownership resource that keeps your name attached to the help they actually need.",
  },
  {
    icon: ShieldCheck,
    title: "Essential 3.0 Platform",
    text: "AI intake, partner attribution, project coordination, and marketing tools in one clean Homeworke experience.",
  },
];

function MiniAiCard() {
  return (
    <div className="rounded-[22px] border border-[rgba(229,57,53,.24)] bg-white p-4 shadow-[0_28px_70px_rgba(17,24,39,.16)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
            <Sparkles className="h-3.5 w-3.5 text-[var(--hw-red)]" />
            Homeworke AI
          </div>
          <div className="mt-1 text-lg font-extrabold tracking-tight text-[var(--hw-ink)]">What is going on at the property?</div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[rgba(229,57,53,.08)] text-[var(--hw-red)]">
          <Home className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 rounded-[18px] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-4">
        <div className="text-sm leading-6 text-[var(--hw-ink)]">
          Buyer inspection found GFCI outlets, loose handrail, and water heater venting.
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Electrical", "Safety", "Inspection repair"].map((item) => (
            <span key={item} className="rounded-full border border-[rgba(229,57,53,.18)] bg-white px-3 py-1 text-xs font-semibold text-[var(--hw-muted)]">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-[14px] bg-[rgba(229,57,53,.07)] p-3 font-semibold text-[var(--hw-ink)]">Classify</div>
        <div className="rounded-[14px] bg-[var(--hw-soft)] p-3 font-semibold text-[var(--hw-ink)]">Schedule</div>
        <div className="rounded-[14px] bg-[var(--hw-soft)] p-3 font-semibold text-[var(--hw-ink)]">Track</div>
      </div>
    </div>
  );
}

function InstantEstimatePreview() {
  const rows = [
    ["Electrical", "GFCI protection", "$285"],
    ["Handyman", "Secure handrail", "$190"],
    ["Plumbing", "Water heater vent correction", "$425"],
  ];

  return (
    <div className="rounded-[22px] border border-[var(--hw-line)] bg-white p-4 shadow-[0_28px_70px_rgba(17,24,39,.14)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
            <Upload className="h-3.5 w-3.5 text-[var(--hw-red)]" />
            Instant estimate
          </div>
          <div className="mt-1 text-lg font-extrabold tracking-tight text-[var(--hw-ink)]">Inspection report parsed</div>
        </div>
        <Pill className="bg-[rgba(229,57,53,.08)] text-[var(--hw-red)]">Beta</Pill>
      </div>

      <div className="mt-4 overflow-hidden rounded-[16px] border border-[var(--hw-line)]">
        {rows.map(([trade, task, price], index) => (
          <div key={task} className={`grid grid-cols-[1fr_auto] gap-3 p-3 ${index > 0 ? "border-t border-[var(--hw-line)]" : ""}`}>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">{trade}</div>
              <div className="mt-0.5 text-sm font-semibold text-[var(--hw-ink)]">{task}</div>
            </div>
            <div className="self-center rounded-full bg-[var(--hw-soft)] px-3 py-1 text-sm font-extrabold text-[var(--hw-ink)]">{price}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-[16px] bg-[var(--hw-ink)] p-4 text-white">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-white/60">Estimated total</div>
          <div className="mt-1 text-2xl font-extrabold">$900</div>
        </div>
        <CheckCircle2 className="h-7 w-7 text-white" />
      </div>
    </div>
  );
}

function TopOfMindPreview() {
  return (
    <div className="rounded-[22px] border border-[var(--hw-line)] bg-white p-4 shadow-[0_28px_70px_rgba(17,24,39,.14)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
            <MessageSquareText className="h-3.5 w-3.5 text-[var(--hw-red)]" />
            Staying top of mind
          </div>
          <div className="mt-1 text-lg font-extrabold tracking-tight text-[var(--hw-ink)]">Client touchpoint kit</div>
        </div>
        <Users className="h-5 w-5 text-[var(--hw-red)]" />
      </div>

      <div className="mt-4 grid gap-3">
        {[
          ["Text script", "Here is my Homeworke link for repairs and renovation help."],
          ["Email template", "Upload your inspection and get a repair-cost estimate."],
          ["Social post", "Branded square graphic with your QR link."],
        ].map(([title, text]) => (
          <div key={title} className="rounded-[16px] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-3">
            <div className="text-sm font-extrabold text-[var(--hw-ink)]">{title}</div>
            <div className="mt-1 text-xs leading-5 text-[var(--hw-muted)]">{text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BrowserFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-[28px] border border-[rgba(17,24,39,.12)] bg-white shadow-[0_34px_90px_rgba(17,24,39,.18)] ${className}`}>
      <div className="flex h-11 items-center gap-2 border-b border-[var(--hw-line)] bg-[linear-gradient(180deg,#fff,#F8FAFC)] px-4">
        <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
        <span className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
        <span className="h-3 w-3 rounded-full bg-[#28C840]" />
        <span className="ml-3 h-5 flex-1 rounded-full border border-[var(--hw-line)] bg-white" />
      </div>
      <div className="bg-[radial-gradient(600px_260px_at_15%_0%,rgba(229,57,53,.12),transparent_55%),#fff] p-4 md:p-6">{children}</div>
    </div>
  );
}

function ProductShowcase() {
  return (
    <div className="relative min-h-[560px] md:min-h-[660px]">
      <div aria-hidden className="absolute left-8 top-12 h-[420px] w-[420px] rounded-full bg-[var(--hw-red)]/10 blur-[90px]" />
      <BrowserFrame className="relative z-10 max-w-[760px]">
        <MiniAiCard />
      </BrowserFrame>
      <BrowserFrame className="relative z-20 -mt-10 ml-auto max-w-[700px] rotate-0 md:-mt-28 md:rotate-[1deg]">
        <InstantEstimatePreview />
      </BrowserFrame>
      <div className="relative z-30 -mt-8 max-w-[420px] md:-mt-24 md:ml-12">
        <TopOfMindPreview />
      </div>
    </div>
  );
}

function RehabTimeline() {
  const steps = [
    { icon: FileText, title: "Scope", text: "Inspection findings, appraisal notes, and desired repairs get organized." },
    { icon: ClipboardList, title: "Estimate", text: "Repair categories and priority items become a client-ready cost view." },
    { icon: CalendarCheck, title: "Coordinate", text: "Next steps, contractor readiness, and timing stay visible to the team." },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {steps.map((step) => {
        const Icon = step.icon;
        return (
          <div key={step.title} className="rounded-[20px] border border-[var(--hw-line)] bg-white p-5 shadow-[0_10px_24px_rgba(17,24,39,.06)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[rgba(229,57,53,.08)] text-[var(--hw-red)]">
              <Icon className="h-5 w-5" />
            </div>
            <div className="mt-4 text-lg font-extrabold text-[var(--hw-ink)]">{step.title}</div>
            <div className="mt-2 text-sm leading-6 text-[var(--hw-muted)]">{step.text}</div>
          </div>
        );
      })}
    </div>
  );
}

export const metadata = {
  title: "Homeworke Beta for NAHREP | Instant Estimates",
  description: "Join the Homeworke 3.0 beta for Instant Estimates, 203k rehab coordination, and agent relationship tools.",
};

export default function NahrepLandingPage() {
  return (
    <div className="min-h-screen bg-white text-[var(--hw-ink)]">
      <SiteHeader ctaHref={betaUrl} />

      <main>
        <section className="relative min-h-[calc(100vh-64px)] overflow-hidden border-b border-[var(--hw-line)] bg-[radial-gradient(900px_460px_at_80%_4%,rgba(229,57,53,.14),transparent_58%),linear-gradient(180deg,#fff_0%,#fff_60%,#F8FAFC_100%)]">
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage: "linear-gradient(rgba(17,24,39,.10) 1px, transparent 1px), linear-gradient(90deg, rgba(17,24,39,.10) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              maskImage: "linear-gradient(to bottom, black, transparent 82%)",
              WebkitMaskImage: "linear-gradient(to bottom, black, transparent 82%)",
            }}
          />
          <Container className="relative max-w-[1180px] py-10 md:py-16">
            <div className="grid gap-9 lg:grid-cols-[1fr_430px] lg:items-center">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Pill className="bg-white">
                    <span className="hw-breath-dot" aria-hidden />
                    NAHREP beta access
                  </Pill>
                  <Pill className="bg-white">Homeworke 3.0</Pill>
                </div>

                <h1 className="mt-7 max-w-4xl text-balance text-5xl font-extrabold tracking-tight text-[var(--hw-ink)] md:text-7xl">
                  Instant repair clarity for every client relationship.
                </h1>
                <p className="mt-5 max-w-2xl text-pretty text-xl leading-9 text-[var(--hw-muted)]">
                  Homeworke helps agents stay essential after the transaction with Instant Estimates, 203k rehab-ready
                  repair coordination, and branded tools that keep you top of mind.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link href={betaUrl}>
                    <Button className="w-full sm:w-auto">
                      Join the beta
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="#platform-preview">
                    <Button variant="secondary" className="w-full sm:w-auto">
                      See the 3.0 platform
                    </Button>
                  </Link>
                </div>

                <div className="mt-10 grid gap-3 sm:grid-cols-3">
                  {proofItems.map((item) => (
                    <div key={item.label} className="rounded-[22px] border border-[rgba(229,57,53,.16)] bg-white/90 p-5 shadow-[0_20px_50px_rgba(17,24,39,.08)] backdrop-blur">
                      <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">{item.label}</div>
                      <div className="mt-2 text-3xl font-extrabold text-[var(--hw-ink)]">{item.value}</div>
                      <div className="mt-1 text-sm leading-5 text-[var(--hw-muted)]">{item.text}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mx-auto w-full max-w-[430px] lg:mx-0">
                <NahrepQr />
              </div>
            </div>
          </Container>
        </section>

        <section id="platform-preview" className="bg-[var(--hw-soft)] py-16 md:py-24">
          <Container className="max-w-[1180px]">
            <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
              <div className="max-w-3xl">
              <div className="text-sm font-extrabold uppercase tracking-widest text-[var(--hw-red)]">New 3.0 Platform</div>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-[var(--hw-ink)] md:text-5xl">
                Built for the moments where agents can be most useful.
              </h2>
              <p className="mt-4 text-base leading-7 text-[var(--hw-muted)]">
                The beta focuses on the high-value workflows real estate pros already care about: inspection repairs,
                rehab scenarios, post-closing home needs, and simple ways to stay connected.
              </p>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {featureCards.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div key={feature.title} className="rounded-[22px] border border-[rgba(229,57,53,.18)] bg-white p-4 shadow-[0_18px_44px_rgba(17,24,39,.08)]">
                      <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[rgba(229,57,53,.08)] text-[var(--hw-red)]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="mt-4 text-sm font-extrabold leading-5 text-[var(--hw-ink)]">{feature.title}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Container>
        </section>

        <section className="overflow-hidden py-16 md:py-24">
          <Container className="max-w-[1180px]">
            <ProductShowcase />
          </Container>
        </section>

        <section className="border-y border-[var(--hw-line)] bg-[linear-gradient(180deg,#F8FAFC,#fff)] py-16 md:py-24">
          <Container className="max-w-[1180px]">
            <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
              <div>
                <div className="text-sm font-extrabold uppercase tracking-widest text-[var(--hw-red)]">203k Rehab Process</div>
                <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-[var(--hw-ink)] md:text-5xl">
                  Make complicated repair conversations easier to explain.
                </h2>
                <p className="mt-4 text-base leading-7 text-[var(--hw-muted)]">
                  Whether it is a buyer exploring rehab financing, a seller facing inspection items, or a client trying to
                  understand repair priorities, Homeworke creates a calmer path from scope to action.
                </p>
              </div>
              <RehabTimeline />
            </div>
          </Container>
        </section>

        <section className="py-16 md:py-24">
          <Container className="max-w-[1180px]">
            <div className="rounded-[34px] border border-[rgba(229,57,53,.28)] bg-[radial-gradient(520px_260px_at_85%_0%,rgba(229,57,53,.34),transparent_62%),var(--hw-ink)] p-6 text-white shadow-[0_34px_90px_rgba(17,24,39,.28)] md:p-10">
              <div className="grid gap-6 lg:grid-cols-[1fr_260px] lg:items-center">
                <div>
                  <div className="text-sm font-extrabold uppercase tracking-widest text-white/60">Ready for beta users</div>
                  <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
                    Give the room one simple next step.
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-white/70">
                    Scan the QR code, request access, and we will follow up with the best way to use Instant Estimates,
                    203k rehab workflows, and relationship tools with your clients.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <Link href={betaUrl}>
                    <Button className="w-full bg-white text-[var(--hw-ink)] shadow-none hover:bg-[var(--hw-soft)]">
                      Request beta access
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <div className="text-center text-xs leading-5 text-white/50">Built for presentation rooms, client follow-up, and agent teams.</div>
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
