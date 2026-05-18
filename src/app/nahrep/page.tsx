import Link from "next/link";
import Image from "next/image";

import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  Clock3,
  Home,
  MessageSquareText,
  Paperclip,
  Send,
  Sparkles,
  Upload,
  Users,
  Wrench,
  Zap,
} from "lucide-react";

import { Button, Container, Pill } from "@/components/ui";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { NahrepQr } from "@/app/nahrep/NahrepQr";

const earlyAccessUrl = "/request-access?role=real-estate-pro&source=nahrep&campaign=early-access";

const pillars = [
  {
    icon: Zap,
    eyebrow: "Instant Estimates",
    title: "Turn inspection chaos into a repair-cost view.",
    text: "Upload inspection, appraisal, village, or repair files and give clients a clearer path from findings to next steps.",
  },
  {
    icon: Sparkles,
    eyebrow: "Homeworke AI",
    title: "Capture the work order before the moment disappears.",
    text: "Homeowners describe the issue, attach photos, and Homeworke AI organizes the request for scheduling and follow-up.",
  },
  {
    icon: Wrench,
    eyebrow: "203K / Rehab Loans",
    title: "Make rehab conversations easier to structure.",
    text: "Help agents frame scope, priorities, repair readiness, and contractor coordination around renovation-heavy deals.",
  },
  {
    icon: BellRing,
    eyebrow: "Staying Top of Mind",
    title: "Stay useful after closing without becoming the contractor.",
    text: "Give clients a home dashboard where the broker, lender, insurance agent, and inspector stay visible around repair moments.",
  },
];

function BrowserFrame({
  children,
  className = "",
  dark = false,
}: {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[30px] border shadow-[0_34px_90px_rgba(17,24,39,.18)] ${
        dark ? "border-white/10 bg-[#111827]" : "border-[rgba(17,24,39,.12)] bg-white"
      } ${className}`}
    >
      <div className={`flex h-11 items-center gap-2 border-b px-4 ${dark ? "border-white/10 bg-white/[.04]" : "border-[var(--hw-line)] bg-white"}`}>
        <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
        <span className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
        <span className="h-3 w-3 rounded-full bg-[#28C840]" />
        <span className={`ml-3 h-5 flex-1 rounded-full border ${dark ? "border-white/10 bg-white/[.06]" : "border-[var(--hw-line)] bg-[var(--hw-soft)]"}`} />
      </div>
      <div
        className="p-4 md:p-6"
        style={{
          background: dark
            ? "radial-gradient(620px 280px at 12% 0%, rgba(229,57,53,.28), transparent 56%), #111827"
            : "radial-gradient(620px 280px at 12% 0%, rgba(229,57,53,.12), transparent 56%), #fff",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function InstantEstimateVisual() {
  const rows = [
    ["Electrical", "GFCI protection at kitchen", "$285"],
    ["Safety", "Secure loose stair handrail", "$190"],
    ["Plumbing", "Water heater vent correction", "$425"],
    ["Exterior", "Repair deteriorated trim", "$365"],
  ];

  return (
    <BrowserFrame className="max-w-[720px]">
      <div className="rounded-[24px] border border-[rgba(229,57,53,.18)] bg-white p-5 shadow-[0_24px_70px_rgba(17,24,39,.14)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
              <Upload className="h-3.5 w-3.5 text-[var(--hw-red)]" />
              Instant Estimate
            </div>
            <div className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">Inspection Report Estimate</div>
            <div className="mt-1 text-sm font-semibold text-[var(--hw-muted)]">Prepared for 1234 W Carmen Ave.</div>
          </div>
          <Pill className="shrink-0 whitespace-nowrap border-[rgba(229,57,53,.24)] bg-[rgba(229,57,53,.08)] text-[var(--hw-red)]">Report ready</Pill>
        </div>

        <div className="mt-5 grid gap-3">
          {rows.map(([trade, task, price]) => (
            <div key={task} className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-[16px] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-4">
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">{trade}</div>
                <div className="mt-1 truncate text-sm font-extrabold text-[var(--hw-ink)]">{task}</div>
              </div>
              <div className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-[var(--hw-ink)] shadow-sm">{price}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between rounded-[20px] bg-[#111827] p-5 text-white">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-white/60">Estimated total</div>
            <div className="mt-1 text-4xl font-extrabold">$1,265</div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white/10">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

function HomeworkeAiVisual() {
  return (
    <BrowserFrame className="max-w-[720px]" dark>
      <div className="rounded-[24px] border border-white/10 bg-white/[.96] p-5 shadow-[0_24px_70px_rgba(0,0,0,.24)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Job work order</div>
            <div className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">What’s going on with the property?</div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[linear-gradient(90deg,#E53935,#EC4899,#8B5CF6)] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.08em] text-white shadow-sm whitespace-nowrap">
            <Sparkles className="h-3 w-3" />
            Homeworke AI
          </span>
        </div>

        <div className="mt-5 grid gap-3 rounded-[22px] border border-[var(--hw-line)] bg-white/80 p-4">
          <div className="max-w-[88%] rounded-2xl border border-[rgba(229,57,53,.12)] bg-white px-4 py-3 text-sm leading-6 text-[var(--hw-ink)] shadow-sm">
            Tell me what happened. You can add photos or video if that helps.
          </div>
          <div className="ml-auto max-w-[86%] rounded-2xl bg-[#111827] px-4 py-3 text-sm leading-6 text-white shadow-sm">
            Water is showing under the vanity and the drywall is soft.
          </div>
          <div className="max-w-[92%] rounded-2xl border border-[rgba(229,57,53,.12)] bg-white px-4 py-3 text-sm leading-6 text-[var(--hw-ink)] shadow-sm">
            Got it. Is this active leaking, and do you want to schedule a visit?
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--hw-line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--hw-ink)] shadow-sm">
            <Paperclip className="h-4 w-4" />
            Add photos/videos
          </button>
          <button className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--hw-red)] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(229,57,53,.26)]">
            Schedule a visit
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </BrowserFrame>
  );
}

function RehabLoanVisual() {
  const steps = [
    ["Scope", "Inspection findings and desired repairs"],
    ["Estimate", "Repair priorities and cost visibility"],
    ["Coordinate", "Contractor readiness and timing"],
  ];

  return (
    <BrowserFrame className="max-w-[720px]">
      <div className="rounded-[24px] border border-[rgba(229,57,53,.18)] bg-white p-5 shadow-[0_24px_70px_rgba(17,24,39,.12)]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
              <Wrench className="h-3.5 w-3.5 text-[var(--hw-red)]" />
              203K / Rehab Loans
            </div>
            <div className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">Rehab deal workspace</div>
          </div>
          <Pill className="shrink-0 whitespace-nowrap bg-white">Repair-ready</Pill>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {steps.map(([title, text], index) => (
            <div key={title} className="rounded-[18px] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--hw-red)] text-sm font-extrabold text-white">{index + 1}</div>
              <div className="mt-4 text-lg font-extrabold text-[var(--hw-ink)]">{title}</div>
              <div className="mt-2 text-sm leading-6 text-[var(--hw-muted)]">{text}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-3 rounded-[20px] border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.06)] p-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="text-sm font-extrabold text-[var(--hw-ink)]">Rehab package status</div>
            <div className="mt-1 text-sm leading-6 text-[var(--hw-muted)]">Scope organized, estimate in review, contractor next steps ready.</div>
          </div>
          <div className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-[var(--hw-red)] shadow-sm">Close-safe</div>
        </div>
      </div>
    </BrowserFrame>
  );
}

function TopOfMindVisual() {
  const pros = [
    {
      name: "Fernando Rocha Jr",
      role: "Real Estate Broker",
      company: "The FRJ Group",
      src: "/partners/frj-headshot.jpg",
      accent: "bg-[rgba(229,57,53,.08)]",
      rotate: "lg:-rotate-1",
    },
    {
      name: "Justin Rodriguez",
      role: "Mortgage Lender",
      company: "Neighborhood Loans",
      src: "https://neighborhoodloans.com/wp-content/uploads/2021/10/justin-Headshot.jpg",
      accent: "bg-white",
      rotate: "lg:rotate-1",
    },
    {
      name: "Guillermo Chavez",
      role: "Home Insurance",
      company: "State Farm",
      src: "https://ac1.st8fm.com/associate-photos/Z/ZCKLR7FVHGE/formalColorFull.jpg",
      accent: "bg-white",
      rotate: "lg:rotate-1",
    },
    {
      name: "Tony Ramirez",
      role: "Home Inspector",
      company: "Top Tier Inspections",
      initials: "TR",
      accent: "bg-[rgba(229,57,53,.07)]",
      rotate: "lg:-rotate-1",
    },
  ];

  return (
    <BrowserFrame className="w-full max-w-[940px]">
      <div className="relative overflow-hidden rounded-[26px] border border-[rgba(229,57,53,.18)] bg-white p-5 shadow-[0_24px_70px_rgba(17,24,39,.12)] md:p-6">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(520px 260px at 86% 0%, rgba(229,57,53,.16), transparent 62%), radial-gradient(420px 280px at 8% 14%, rgba(229,57,53,.08), transparent 66%)",
          }}
        />

        <div className="relative">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
                <Home className="h-3.5 w-3.5 text-[var(--hw-red)]" />
                Homeowner dashboard
              </div>
              <div className="mt-2 max-w-[440px] text-2xl font-extrabold tracking-tight text-[var(--hw-ink)] md:text-3xl">Your home team stays visible</div>
            </div>
            <div className="inline-flex w-fit min-w-[196px] items-center justify-center gap-2 whitespace-nowrap rounded-full border border-[rgba(229,57,53,.18)] bg-white px-3 py-2 text-xs font-extrabold text-[var(--hw-red)] shadow-sm">
              <Users className="h-4 w-4" />
              Connected relationship
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-[rgba(229,57,53,.16)] bg-white/85 p-4 shadow-[0_18px_44px_rgba(17,24,39,.08)]">
            <div className="grid gap-3 sm:grid-cols-2">
              {pros.map((pro) => (
                <div key={pro.name} className={`min-w-0 rounded-[18px] border border-[var(--hw-line)] ${pro.accent} p-3 shadow-[0_12px_28px_rgba(17,24,39,.07)]`}>
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white text-sm font-extrabold text-[var(--hw-ink)] shadow-[0_10px_22px_rgba(17,24,39,.10)]">
                      {pro.src ? (
                        pro.src.startsWith("http") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={pro.src} alt={pro.name} className="h-full w-full object-cover" />
                        ) : (
                          <Image src={pro.src} alt={pro.name} width={48} height={48} className="h-full w-full object-cover" />
                        )
                      ) : (
                        pro.initials
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-extrabold leading-5 text-[var(--hw-ink)]">{pro.name}</div>
                      <div className="mt-1">
                        <span className="inline-flex rounded-full bg-white px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-[var(--hw-red)] shadow-sm">
                          {pro.role}
                        </span>
                        <div className="mt-1 truncate text-xs font-semibold text-[var(--hw-muted)]">{pro.company}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[.88fr_1.12fr] lg:items-stretch">
            <div className="rounded-[20px] border border-[rgba(229,57,53,.16)] bg-[rgba(229,57,53,.06)] p-4">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[var(--hw-red)]">
                <Clock3 className="h-3.5 w-3.5" />
                Work order status
              </div>
              <div className="mt-3 text-xl font-extrabold text-[var(--hw-ink)]">Inspection repair estimate</div>
              <div className="mt-2 text-sm leading-6 text-[var(--hw-muted)]">The trusted home team stays attached to the next step.</div>
              <div className="mt-5 grid gap-2">
                {["Estimate ready", "Team notified", "Repair summary shared"].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[11px] font-extrabold text-[var(--hw-ink)] shadow-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[var(--hw-red)]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[20px] border border-[var(--hw-line)] bg-white p-4 shadow-[0_18px_44px_rgba(17,24,39,.08)]">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Work order thread</div>
                <MessageSquareText className="h-4 w-4 text-[var(--hw-red)]" />
              </div>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl border border-[rgba(229,57,53,.12)] bg-white px-4 py-3 text-sm leading-6 text-[var(--hw-ink)] shadow-sm">
                  Your estimate is ready. Your home team can see the repair summary and next steps.
                </div>
                <div className="ml-auto max-w-[86%] rounded-2xl bg-[#111827] px-4 py-3 text-sm leading-6 text-white shadow-sm">
                  Great, keep my team updated.
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {["Estimate ready", "Broker visible", "Lender aligned", "Inspector context"].map((item) => (
                    <div key={item} className="rounded-full bg-[var(--hw-soft)] px-3 py-2 text-center text-[11px] font-extrabold text-[var(--hw-ink)]">
                      {item}
                    </div>
                  ))}
                </div>
                <div className="rounded-[16px] border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.06)] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 shrink-0 text-[var(--hw-red)]" />
                    <div className="text-xs font-semibold leading-5 text-[var(--hw-ink)]">
                      Broker, lender, insurance, and inspector stay present through the home journey.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

function PillarSection({
  pillar,
  visual,
  flip = false,
  wide = false,
}: {
  pillar: (typeof pillars)[number];
  visual: React.ReactNode;
  flip?: boolean;
  wide?: boolean;
}) {
  const Icon = pillar.icon;

  return (
    <section className="border-t border-[var(--hw-line)] py-16 md:py-24">
      <Container className="max-w-[1180px]">
        <div
          className={`grid gap-10 lg:items-center ${
            wide ? "lg:grid-cols-[1.28fr_.72fr]" : "lg:grid-cols-[0.84fr_1.16fr]"
          } ${flip ? "lg:[&>*:first-child]:order-2" : ""}`}
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(229,57,53,.20)] bg-white px-3 py-2 text-xs font-extrabold uppercase tracking-widest text-[var(--hw-red)] shadow-sm">
              <Icon className="h-4 w-4" />
              {pillar.eyebrow}
            </div>
            <h2 className="mt-5 text-balance text-4xl font-extrabold tracking-tight text-[var(--hw-ink)] md:text-5xl">{pillar.title}</h2>
            <p className="mt-4 max-w-xl text-lg leading-8 text-[var(--hw-muted)]">{pillar.text}</p>
          </div>
          <div>{visual}</div>
        </div>
      </Container>
    </section>
  );
}

export const metadata = {
  title: "Homeworke Early Access for NAHREP | Instant Estimates",
  description: "Instant Estimates, Homeworke AI, 203K rehab workflows, and top-of-mind tools for Real Estate Pros.",
};

export default function NahrepLandingPage() {
  return (
    <div className="min-h-screen bg-white text-[var(--hw-ink)]">
      <SiteHeader ctaHref={earlyAccessUrl} />

      <main>
        <section
          className="relative overflow-hidden border-b border-[var(--hw-line)]"
          style={{
            background:
              "radial-gradient(900px 460px at 80% 4%, rgba(229,57,53,.16), transparent 58%), linear-gradient(180deg, #fff 0%, #fff 60%, #F8FAFC 100%)",
          }}
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.10]"
            style={{
              backgroundImage: "linear-gradient(rgba(17,24,39,.10) 1px, transparent 1px), linear-gradient(90deg, rgba(17,24,39,.10) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              maskImage: "linear-gradient(to bottom, black, transparent 82%)",
              WebkitMaskImage: "linear-gradient(to bottom, black, transparent 82%)",
            }}
          />
          <Container className="relative max-w-[1180px] py-8 md:py-10 lg:py-12">
            <div className="grid gap-10 lg:grid-cols-[1fr_430px] lg:items-center">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Pill className="bg-white">
                    <span className="hw-breath-dot" aria-hidden />
                    NAHREP early access
                  </Pill>
                  <Pill className="bg-white">Real Estate Pro</Pill>
                </div>

                <h1 className="mt-7 max-w-4xl text-balance text-5xl font-extrabold tracking-tight text-[var(--hw-ink)] md:text-7xl">
                  Four tools to stay essential after the transaction.
                </h1>
                <p className="mt-5 max-w-2xl text-pretty text-xl leading-9 text-[var(--hw-muted)]">
                  Instant Estimates, Homeworke AI, 203K rehab workflows, and top-of-mind tools built for Real Estate Pros.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link href={earlyAccessUrl}>
                    <Button className="w-full sm:w-auto">
                      Request early access
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="#four-tools">
                    <Button variant="secondary" className="w-full sm:w-auto">
                      See the platform
                    </Button>
                  </Link>
                </div>

                <div id="four-tools" className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {pillars.map((pillar) => {
                    const Icon = pillar.icon;
                    return (
                      <div key={pillar.eyebrow} className="flex items-center gap-3 rounded-[22px] border border-[rgba(229,57,53,.16)] bg-white/90 p-5 shadow-[0_20px_50px_rgba(17,24,39,.08)] backdrop-blur">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[rgba(229,57,53,.08)] text-[var(--hw-red)]">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 text-sm font-extrabold leading-5 text-[var(--hw-ink)]">{pillar.eyebrow}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mx-auto w-full max-w-[430px] lg:mx-0">
                <NahrepQr />
              </div>
            </div>
          </Container>
        </section>

        <PillarSection pillar={pillars[0]} visual={<InstantEstimateVisual />} />
        <PillarSection pillar={pillars[1]} visual={<HomeworkeAiVisual />} flip />
        <PillarSection pillar={pillars[2]} visual={<RehabLoanVisual />} />
        <PillarSection pillar={pillars[3]} visual={<TopOfMindVisual />} flip wide />

        <section className="py-16 md:py-24">
          <Container className="max-w-[1180px]">
            <div
              className="rounded-[34px] border border-[rgba(229,57,53,.28)] p-6 text-white shadow-[0_34px_90px_rgba(17,24,39,.28)] md:p-10"
              style={{
                background: "radial-gradient(520px 260px at 85% 0%, rgba(229,57,53,.34), transparent 62%), #111827",
              }}
            >
              <div className="grid gap-6 lg:grid-cols-[1fr_260px] lg:items-center">
                <div>
                  <div className="text-sm font-extrabold uppercase tracking-widest text-white/60">Early access for Real Estate Pros</div>
                  <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
                    Give the room one simple next step.
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-white/70">
                    Scan the QR code, request access, and we will follow up with early access to the new Homeworke platform.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <Link href={earlyAccessUrl}>
                    <Button className="w-full bg-white text-[var(--hw-ink)] shadow-none hover:bg-[var(--hw-soft)]">
                      Request early access
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <div className="text-center text-xs leading-5 text-white/60">Built for presentation rooms, client follow-up, and agent teams.</div>
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
