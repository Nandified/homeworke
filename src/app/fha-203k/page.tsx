import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { ComponentType, ReactNode } from "react";

import {
  ArrowRight,
  Banknote,
  CalendarCheck2,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  Hammer,
  Home,
  Layers3,
  Paperclip,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
  Wrench,
} from "lucide-react";

import { Button, Container, Pill } from "@/components/ui";
import { SiteFooter, SiteHeader } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "FHA 203(k) Rehab Loan Process | Homeworke",
  description:
    "A client-ready rehab loan process workspace for Real Estate Pros using Homeworke Instant Estimates, AI intake, repair scope organization, and verified repair coordination.",
};

const accessUrl = "/request-access?role=real-estate-pro&source=fha-203k&campaign=rehab-loan-process";

const loanFacts = [
  { label: "Limited 203(k)", value: "Up to $75k", note: "Minor remodeling and nonstructural repairs." },
  { label: "Standard 203(k)", value: "Consultant required", note: "Used for major repair scope, structural work, and larger rehab plans." },
  { label: "Funds flow", value: "Repair escrow", note: "Loan proceeds are held and released as work is completed and inspected." },
];

const processSteps = [
  {
    icon: Upload,
    title: "Collect the deal file",
    text: "Inspection report, appraisal notes, seller credits, repair addenda, photos, contractor proposals, and any lender-specific 203(k) conditions are captured in one workspace.",
  },
  {
    icon: FileSearch,
    title: "Sort the repair path",
    text: "Homeworke separates cosmetic wants from required repairs, flags health and safety items, and helps identify whether the scope looks more Limited or Standard 203(k).",
  },
  {
    icon: ClipboardCheck,
    title: "Build the rehab package",
    text: "Repair items are organized into work categories, planning numbers, contractor-ready scope notes, permit questions, and consultant or lender review prompts.",
  },
  {
    icon: Banknote,
    title: "Support loan processing",
    text: "The lender still controls underwriting, the FHA case, appraisal, 203(k) Calculator, and closing docs. Homeworke keeps the repair side readable for the client and deal team.",
  },
  {
    icon: Hammer,
    title: "Coordinate after closing",
    text: "Once the loan closes, repairs move through contractor scheduling, draw inspections, updates, and closeout without the agent becoming the project manager.",
  },
];

const requiredToClose = [
  "Scope separated by required repairs, optional upgrades, and appraisal conditions",
  "Contractor proposals matched to work items and completion expectations",
  "Consultant requirement flagged for Standard 203(k) or complex repair scope",
  "Permit, occupancy, timeline, and draw-request risks surfaced early",
  "Planning estimate clearly marked as not final pricing until verification",
];

const dealTeam = [
  {
    icon: Users,
    title: "Real Estate Pro",
    text: "Gives the buyer and seller a clearer repair path while staying visible as the deal guide, not the contractor.",
  },
  {
    icon: Banknote,
    title: "Lender",
    text: "Receives a cleaner repair summary to compare against FHA, investor, and internal requirements.",
  },
  {
    icon: Wrench,
    title: "Contractor",
    text: "Sees organized work categories, notes, photos, and expected documentation before pricing is treated as final.",
  },
  {
    icon: Home,
    title: "Buyer",
    text: "Understands what must happen before closing and what will be handled through escrow after closing.",
  },
];

const closeRisks = [
  ["Missing bids", "Contractor proposals are not aligned to the lender package."],
  ["Wrong loan lane", "A structural or long timeline repair is treated like a Limited 203(k)."],
  ["Scope drift", "Client upgrades get mixed into required lender or appraisal repairs."],
  ["Draw confusion", "The team is unclear on inspections, escrow releases, and closeout."],
];

function BrowserFrame({
  children,
  className = "",
  dark = false,
}: {
  children: ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`hw-motion-card overflow-hidden rounded-[30px] border shadow-[0_34px_90px_rgba(17,24,39,.16)] ${
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

function RehabDealWorkspace() {
  const rows = [
    ["Required", "Peeling exterior trim and fascia repair", "$3,850"],
    ["Safety", "Handrail, GFCI, and smoke detector corrections", "$1,140"],
    ["Systems", "Water heater venting and plumbing access", "$2,260"],
  ];

  return (
    <BrowserFrame className="w-full">
      <div className="overflow-hidden rounded-[24px] border border-[rgba(229,57,53,.18)] bg-white shadow-[0_24px_70px_rgba(17,24,39,.14)]">
        <div className="relative h-44 overflow-hidden bg-[var(--hw-soft)]">
          <Image src="/demo_prop_demo_6.jpg" alt="Rehab candidate property" fill priority className="object-cover" sizes="(min-width: 1024px) 520px, 100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/62 via-black/10 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-white/70">Deal workspace</div>
              <div className="mt-1 text-2xl font-extrabold tracking-tight text-white">FHA 203(k) repair plan</div>
            </div>
            <Pill className="shrink-0 border-white/20 bg-white text-[var(--hw-red)]">Client-ready</Pill>
          </div>
        </div>

        <div className="p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {loanFacts.map((fact) => (
              <div key={fact.label} className="rounded-[18px] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-4">
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--hw-muted)]">{fact.label}</div>
                <div className="mt-2 text-lg font-extrabold text-[var(--hw-ink)]">{fact.value}</div>
                <div className="mt-2 text-xs leading-5 text-[var(--hw-muted)]">{fact.note}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3">
            {rows.map(([type, task, price]) => (
              <div key={task} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-[16px] border border-[var(--hw-line)] bg-white p-4 shadow-sm">
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">{type}</div>
                  <div className="mt-1 truncate text-sm font-extrabold text-[var(--hw-ink)]">{task}</div>
                </div>
                <div className="rounded-full bg-[var(--hw-soft)] px-4 py-2 text-sm font-extrabold text-[var(--hw-ink)]">{price}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[20px] bg-[#111827] p-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-white/60">Planning repair budget</div>
                <div className="mt-1 text-4xl font-extrabold">$7,250</div>
              </div>
              <div className="max-w-[170px] text-right text-xs leading-5 text-white/62">Final pricing follows contractor, scope, access, materials, and timing review.</div>
            </div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

function RehabAiCard() {
  return (
    <BrowserFrame className="w-full" dark>
      <div className="rounded-[24px] border border-white/10 bg-white/[.97] p-5 shadow-[0_24px_70px_rgba(0,0,0,.24)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Homeworke AI</div>
            <div className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">203(k) readiness intake</div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--hw-red)] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.08em] text-white shadow-sm">
            <Sparkles className="h-3 w-3" />
            AI-assisted
          </span>
        </div>

        <div className="mt-5 grid gap-3 rounded-[22px] border border-[var(--hw-line)] bg-white/85 p-4">
          <div className="max-w-[88%] rounded-2xl border border-[rgba(229,57,53,.12)] bg-white px-4 py-3 text-sm leading-6 text-[var(--hw-ink)] shadow-sm">
            Upload the report, appraisal notes, and contractor proposal. I will organize what the lender may need next.
          </div>
          <div className="ml-auto max-w-[86%] rounded-2xl bg-[#111827] px-4 py-3 text-sm leading-6 text-white shadow-sm">
            The appraisal calls out peeling paint, railings, and water heater venting.
          </div>
          <div className="max-w-[92%] rounded-2xl border border-[rgba(229,57,53,.12)] bg-white px-4 py-3 text-sm leading-6 text-[var(--hw-ink)] shadow-sm">
            I flagged three required-to-close repairs, one permit question, and a consultant review prompt.
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {["Work write-up", "Bid review", "Draw path"].map((item) => (
            <div key={item} className="rounded-full bg-[var(--hw-soft)] px-3 py-2 text-center text-[11px] font-extrabold text-[var(--hw-ink)]">
              {item}
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--hw-line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--hw-ink)] shadow-sm">
            <Paperclip className="h-4 w-4" />
            Attach deal file
          </button>
          <button className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--hw-red)] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(229,57,53,.26)]">
            Generate rehab plan
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </BrowserFrame>
  );
}

function SectionIntro({
  eyebrow,
  title,
  text,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  text: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="max-w-3xl">
      <Pill className="bg-white text-[var(--hw-red)]">
        <Icon className="h-4 w-4" />
        {eyebrow}
      </Pill>
      <h2 className="mt-5 text-balance text-4xl font-extrabold tracking-tight text-[var(--hw-ink)] md:text-5xl">{title}</h2>
      <p className="mt-4 text-lg leading-8 text-[var(--hw-muted)]">{text}</p>
    </div>
  );
}

export default function Fha203kPage() {
  return (
    <div className="min-h-screen bg-white text-[var(--hw-ink)]">
      <SiteHeader ctaHref={accessUrl} ctaLabel="Request rehab access" />

      <main>
        <section
          className="relative overflow-hidden border-b border-[var(--hw-line)]"
          style={{
            background:
              "radial-gradient(900px 460px at 82% 3%, rgba(229,57,53,.16), transparent 58%), linear-gradient(180deg, #fff 0%, #fff 62%, #F8FAFC 100%)",
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

          <Container className="relative max-w-[1180px] py-10 md:py-14 lg:py-16">
            <div className="grid gap-10 lg:grid-cols-[.86fr_1.14fr] lg:items-center">
              <div className="hw-reveal hw-delay-1">
                <div className="flex flex-wrap gap-2">
                  <Pill className="bg-white">
                    <span className="hw-breath-dot" aria-hidden />
                    Rehab Loan Process as a Service
                  </Pill>
                  <Pill className="bg-white">For Real Estate Pros</Pill>
                </div>

                <h1 className="mt-7 max-w-4xl text-balance text-5xl font-extrabold tracking-tight text-[var(--hw-ink)] md:text-7xl">
                  Make FHA 203(k) deals feel less like a maze.
                </h1>
                <p className="mt-5 max-w-2xl text-pretty text-xl leading-9 text-[var(--hw-muted)]">
                  Homeworke gives agents a client-ready way to explain the rehab loan process, organize the repair scope, and keep the deal team moving from inspection findings to closing and post-close repairs.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link href={accessUrl}>
                    <Button className="w-full sm:w-auto">
                      Request rehab access
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="#process">
                    <Button variant="secondary" className="w-full sm:w-auto">
                      See the process
                    </Button>
                  </Link>
                </div>

                <div className="mt-8 rounded-[22px] border border-[rgba(229,57,53,.18)] bg-white/88 p-4 text-sm leading-6 text-[var(--hw-muted)] shadow-[0_18px_44px_rgba(17,24,39,.08)]">
                  Homeworke is not a lender and does not approve FHA financing. The product organizes repair information, estimate context, and service coordination so the buyer, agent, lender, consultant, and contractor can work from the same page.
                </div>
              </div>

              <div className="hw-reveal hw-delay-2">
                <div className="hw-float-soft">
                  <RehabDealWorkspace />
                </div>
              </div>
            </div>
          </Container>
        </section>

        <section id="process" className="py-16 md:py-24">
          <Container className="max-w-[1180px]">
            <div className="grid gap-10 lg:grid-cols-[.78fr_1.22fr] lg:items-start">
              <SectionIntro
                eyebrow="203(k) workflow"
                title="A repair operating layer around the loan."
                text="The official FHA workflow still runs through an approved lender. Homeworke sits around the repair side: documents, scope, estimates, readiness, scheduling, inspections, and communication."
                icon={Layers3}
              />
              <div className="grid gap-3">
                {processSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.title} className="hw-motion-card rounded-[22px] border border-[rgba(17,24,39,.08)] bg-white p-5 shadow-[0_18px_44px_rgba(17,24,39,.08)]">
                      <div className="flex gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[var(--hw-red)] text-sm font-extrabold text-white">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-lg font-extrabold text-[var(--hw-ink)]">
                            <Icon className="h-5 w-5 shrink-0 text-[var(--hw-red)]" />
                            {step.title}
                          </div>
                          <div className="mt-2 text-sm leading-6 text-[var(--hw-muted)]">{step.text}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Container>
        </section>

        <section className="border-t border-[var(--hw-line)] py-16 md:py-24">
          <Container className="max-w-[1180px]">
            <div className="grid gap-10 lg:grid-cols-[1.08fr_.92fr] lg:items-center">
              <div className="hw-reveal hw-delay-1">
                <div className="hw-float-soft">
                  <RehabAiCard />
                </div>
              </div>
              <div className="hw-reveal hw-delay-2">
                <SectionIntro
                  eyebrow="Homeworke AI card"
                  title="Turn messy repair requirements into a clean next step."
                  text="Instead of leaving the agent to translate loan jargon, Homeworke AI turns inspection findings and lender notes into a plain-English rehab plan with assumptions, missing documents, and scope questions."
                  icon={Sparkles}
                />
                <div className="mt-7 grid gap-3">
                  {requiredToClose.map((item) => (
                    <div key={item} className="flex gap-3 rounded-[18px] border border-[rgba(229,57,53,.16)] bg-white p-4 shadow-sm">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--hw-red)]" />
                      <div className="text-sm font-semibold leading-6 text-[var(--hw-ink)]">{item}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Container>
        </section>

        <section
          className="border-t border-[var(--hw-line)] py-16 text-white md:py-24"
          style={{
            background: "radial-gradient(760px 340px at 82% 4%, rgba(229,57,53,.36), transparent 62%), #111827",
          }}
        >
          <Container className="max-w-[1180px]">
            <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:items-start">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-extrabold uppercase tracking-widest text-white/80">
                  <CalendarCheck2 className="h-4 w-4" />
                  Closing path
                </div>
                <h2 className="mt-5 text-balance text-4xl font-extrabold tracking-tight md:text-5xl">What has to stay coordinated.</h2>
                <p className="mt-4 text-lg leading-8 text-white/68">
                  The page gives clients a calm map of the deal: what happens before closing, what lands in escrow, and how repairs get inspected after closing.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ["Before offer", "Spot likely 203(k) candidates and explain the repair path before the buyer gets overwhelmed."],
                  ["Under contract", "Upload reports, map required repairs, collect bids, and prepare lender or consultant review."],
                  ["At closing", "Keep the rehab loan agreement, escrow amount, and conditions visible without confusing them with final repair pricing."],
                  ["After closing", "Coordinate contractor scheduling, draw inspections, client updates, and escrow closeout support."],
                ].map(([title, text]) => (
                  <div key={title} className="hw-motion-card rounded-[22px] border border-white/10 bg-white/[.06] p-5 shadow-[0_18px_50px_rgba(0,0,0,.22)]">
                    <div className="text-lg font-extrabold">{title}</div>
                    <div className="mt-2 text-sm leading-6 text-white/65">{text}</div>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>

        <section className="border-t border-[var(--hw-line)] py-16 md:py-24">
          <Container className="max-w-[1180px]">
            <SectionIntro
              eyebrow="Team alignment"
              title="A service Real Estate Pros can hand to clients."
              text="The goal is simple: help more rehab-heavy deals survive the repair conversation by making the process understandable, coordinated, and documented."
              icon={Users}
            />

            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {dealTeam.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="hw-motion-card rounded-[22px] border border-[rgba(229,57,53,.16)] bg-white p-5 shadow-[0_20px_50px_rgba(17,24,39,.08)]">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[rgba(229,57,53,.08)] text-[var(--hw-red)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="mt-4 text-lg font-extrabold text-[var(--hw-ink)]">{item.title}</div>
                    <div className="mt-2 text-sm leading-6 text-[var(--hw-muted)]">{item.text}</div>
                  </div>
                );
              })}
            </div>
          </Container>
        </section>

        <section className="border-t border-[var(--hw-line)] py-16 md:py-24">
          <Container className="max-w-[1180px]">
            <div
              className="relative overflow-hidden rounded-[34px] border border-[rgba(229,57,53,.20)] bg-white p-6 shadow-[0_34px_90px_rgba(17,24,39,.12)] md:p-10"
              style={{
                background:
                  "radial-gradient(760px 320px at 84% 0%, rgba(229,57,53,.13), transparent 62%), linear-gradient(180deg,#fff,#F8FAFC)",
              }}
            >
              <div
                aria-hidden
                className="absolute inset-0 opacity-[0.10]"
                style={{
                  backgroundImage: "linear-gradient(rgba(17,24,39,.10) 1px, transparent 1px), linear-gradient(90deg, rgba(17,24,39,.10) 1px, transparent 1px)",
                  backgroundSize: "42px 42px",
                  maskImage: "linear-gradient(to bottom, black, transparent 80%)",
                  WebkitMaskImage: "linear-gradient(to bottom, black, transparent 80%)",
                }}
              />

              <div className="relative grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:items-start">
                <div>
                  <div className="text-sm font-extrabold uppercase tracking-widest text-[var(--hw-muted)]">Deal risks we clean up</div>
                  <h2 className="mt-3 text-balance text-4xl font-extrabold tracking-tight text-[var(--hw-ink)] md:text-5xl">
                    The repair side should not be the reason the deal stalls.
                  </h2>
                  <p className="mt-4 text-lg leading-8 text-[var(--hw-muted)]">
                    Homeworke keeps repair details legible while the lender, consultant, appraiser, and contractor handle their parts.
                  </p>
                </div>
                <div className="grid gap-3">
                  {closeRisks.map(([title, text]) => (
                    <div key={title} className="hw-motion-card rounded-[22px] border border-[rgba(17,24,39,.08)] bg-white/92 p-5 shadow-[0_18px_44px_rgba(17,24,39,.08)] backdrop-blur">
                      <div className="flex gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[rgba(229,57,53,.08)] text-[var(--hw-red)]">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-lg font-extrabold text-[var(--hw-ink)]">{title}</div>
                          <div className="mt-2 text-sm leading-6 text-[var(--hw-muted)]">{text}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Container>
        </section>

        <section className="py-16 md:py-24">
          <Container className="max-w-[1180px]">
            <div
              className="hw-motion-card rounded-[34px] border border-[rgba(229,57,53,.28)] p-6 text-white shadow-[0_34px_90px_rgba(17,24,39,.28)] md:p-10"
              style={{
                background: "radial-gradient(520px 260px at 85% 0%, rgba(229,57,53,.34), transparent 62%), #111827",
              }}
            >
              <div className="grid gap-6 lg:grid-cols-[1fr_280px] lg:items-center">
                <div>
                  <div className="text-sm font-extrabold uppercase tracking-widest text-white/60">FHA 203(k) and rehab deals</div>
                  <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
                    Give clients a repair plan they can act on.
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-white/70">
                    Offer the rehab loan process as a Homeworke service: organized documents, planning estimates, AI-assisted scope review, and repair coordination through closeout.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <Link href={accessUrl}>
                    <Button className="w-full bg-white text-[var(--hw-ink)] shadow-none hover:bg-[var(--hw-soft)]">
                      Request rehab access
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <div className="text-center text-xs leading-5 text-white/60">Built for agents, lenders, consultants, and repair-heavy client conversations.</div>
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <SiteFooter estimateHref={accessUrl} estimateLabel="Request rehab access" />
    </div>
  );
}
