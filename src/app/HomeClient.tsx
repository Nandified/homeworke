"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import {
  ArrowRight,
  BellRing,
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  FileText,
  FileSearch,
  Home,
  MessageSquareText,
  Sparkles,
  Upload,
  Users,
  Wrench,
  Zap,
} from "lucide-react";

import { Button, Container, Input, Modal, Pill, Textarea } from "@/components/ui";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { AIWorkOrderIntakeCard } from "@/components/ai/AIWorkOrderIntakeCard";
import { formatPhoneUS } from "@/lib/phone";

const servicePillars = [
  {
    icon: Zap,
    title: "Instant Estimates",
    text: "Turn inspections, appraisal notes, and repair lists into organized planning numbers with clear assumptions.",
  },
  {
    icon: Sparkles,
    title: "Homeworke AI",
    text: "Capture photos, symptoms, urgency, property details, and scheduling preferences before anything gets lost.",
  },
  {
    icon: Wrench,
    title: "Verified Repair Visits",
    text: "Move from rough scope to confirmed next steps with a Home Guide and Project Manager coordinating the handoff.",
  },
  {
    icon: BellRing,
    title: "Home Team Follow-up",
    text: "Keep homeowners, agents, lenders, inspectors, and service pros aligned around the next repair moment.",
  },
];

const projectTypes = [
  "Inspection repairs",
  "Handyman punch lists",
  "Electrical fixes",
  "Plumbing issues",
  "HVAC concerns",
  "Drywall and paint",
];

const workflow = [
  {
    icon: Upload,
    label: "1",
    title: "Tell us what is happening",
    text: "Describe the issue, upload photos, or start from an inspection report. Homeworke turns messy details into a usable scope.",
  },
  {
    icon: FileSearch,
    label: "2",
    title: "Get clarity before work starts",
    text: "We separate planning estimates from confirmed pricing so you know what is assumed, what needs verification, and what comes next.",
  },
  {
    icon: CalendarCheck2,
    label: "3",
    title: "Schedule the right next step",
    text: "A Home Guide helps route the request, coordinate timing, and keep the repair thread moving through completion.",
  },
];

const audiences = [
  {
    icon: Home,
    title: "Homeowners",
    text: "One place to ask for help, understand the likely scope, and keep repair updates from scattering across texts and email.",
  },
  {
    icon: Users,
    title: "Real Estate Pros",
    text: "Give clients a repair path after inspection without becoming the contractor, estimator, and scheduler yourself.",
  },
  {
    icon: Wrench,
    title: "Service Providers",
    text: "Connect with local, high-quality service providers who can verify the scope, schedule the right visit, and help get the work done well.",
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

function EstimatePreview() {
  const rows = [
    ["Electrical", "GFCI protection at kitchen", "$285"],
    ["Safety", "Secure loose stair handrail", "$190"],
    ["Plumbing", "Water heater vent correction", "$425"],
  ];

  return (
    <BrowserFrame className="w-full">
      <div className="rounded-[24px] border border-[rgba(229,57,53,.18)] bg-white p-5 shadow-[0_24px_70px_rgba(17,24,39,.12)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
              <ClipboardList className="h-3.5 w-3.5 text-[var(--hw-red)]" />
              Inspection estimate
            </div>
            <div className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">Repair cost view</div>
          </div>
          <Pill className="border-[rgba(229,57,53,.24)] bg-[rgba(229,57,53,.08)] text-[var(--hw-red)]">Ready</Pill>
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

        <div className="mt-5 rounded-[20px] bg-[#111827] p-5 text-white">
          <div className="text-xs font-semibold uppercase tracking-widest text-white/60">Planning estimate</div>
          <div className="mt-1 flex items-end justify-between gap-4">
            <div className="text-4xl font-extrabold">$900</div>
            <div className="text-right text-xs leading-5 text-white/60">Final pricing confirmed after scope review.</div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

function CoordinationPreview() {
  return (
    <BrowserFrame className="w-full" dark>
      <div className="rounded-[24px] border border-white/10 bg-white/[.96] p-5 shadow-[0_24px_70px_rgba(0,0,0,.24)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Project thread</div>
            <div className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">Scope, schedule, updates</div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--hw-red)] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.08em] text-white shadow-sm">
            <Sparkles className="h-3 w-3" />
            AI-assisted
          </span>
        </div>

        <div className="mt-5 grid gap-3 rounded-[22px] border border-[var(--hw-line)] bg-white/80 p-4">
          <div className="max-w-[88%] rounded-2xl border border-[rgba(229,57,53,.12)] bg-white px-4 py-3 text-sm leading-6 text-[var(--hw-ink)] shadow-sm">
            I found three inspection repairs that need verification before scheduling.
          </div>
          <div className="ml-auto max-w-[86%] rounded-2xl bg-[#111827] px-4 py-3 text-sm leading-6 text-white shadow-sm">
            Can we target next Tuesday afternoon?
          </div>
          <div className="max-w-[92%] rounded-2xl border border-[rgba(229,57,53,.12)] bg-white px-4 py-3 text-sm leading-6 text-[var(--hw-ink)] shadow-sm">
            Yes. I will attach the preferred window and send it for Home Guide review.
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {["Scope grouped", "Visit requested", "Team updated"].map((item) => (
            <div key={item} className="rounded-full bg-[var(--hw-soft)] px-3 py-2 text-center text-[11px] font-extrabold text-[var(--hw-ink)]">
              {item}
            </div>
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
}

function PublicInstantEstimateCard() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ reportId: string; portalPath: string; message: string } | null>(null);

  const canSubmit = !!file && !!name.trim() && email.includes("@") && !!phone.trim() && !!address.trim() && !submitting;
  const contactComplete = !!name.trim() && email.includes("@") && !!phone.trim() && !!address.trim();
  const notesComplete = !!notes.trim();
  const completeStepClass = "border-[rgba(229,57,53,.28)] bg-[rgba(229,57,53,.045)] shadow-[0_0_0_1px_rgba(229,57,53,.10),0_14px_32px_rgba(229,57,53,.12)]";
  const idleStepClass = "border-[var(--hw-line)] bg-white";

  function selectFile(next: File | null) {
    if (!next) return;
    setFile(next);
    setModalOpen(true);
    setResult(null);
    setError("");
  }

  async function submit() {
    if (!file || !canSubmit) return;
    setSubmitting(true);
    setError("");
    setResult(null);

    try {
      const form = new FormData();
      form.set("file", file);
      form.set("name", name.trim());
      form.set("email", email.trim().toLowerCase());
      form.set("phone", phone.trim());
      form.set("address", address.trim());
      form.set("propertyType", propertyType);
      form.set("notes", notes.trim());

      const res = await fetch("/api/express-estimate/public-intake", {
        method: "POST",
        body: form,
      });
      const data = (await res.json().catch(() => null)) as null | {
        ok?: boolean;
        error?: string;
        detail?: string;
        reportId?: string;
        portalPath?: string;
        message?: string;
      };

      if (!res.ok || !data?.ok || !data.reportId || !data.portalPath) {
        throw new Error(data?.detail || data?.error || "Unable to submit report.");
      }

      setResult({
        reportId: data.reportId,
        portalPath: data.portalPath,
        message: data.message || "Report received. We will email the report link when it is ready.",
      });
    } catch (e: unknown) {
      const message = e && typeof e === "object" && "message" in e ? String(e.message) : "Unable to submit report.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div
        className="hw-motion-card relative overflow-hidden rounded-[28px] border border-[rgba(229,57,53,.28)] bg-white p-6 shadow-[0_24px_70px_rgba(17,24,39,.10)] md:p-7"
        style={{ boxShadow: "0 24px 70px rgba(229,57,53,.08)" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 h-56 w-56 -translate-y-1/3 translate-x-1/3 rounded-full bg-[var(--hw-red)]/20 blur-[62px]"
        />
        <div className="relative">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
                <Zap className="h-3.5 w-3.5 text-[var(--hw-red)]" />
                Instant estimate
              </div>
              <div className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">Instant Estimate</div>
            </div>
            <Pill className="w-fit border-[rgba(229,57,53,.22)] bg-[rgba(229,57,53,.08)] text-[var(--hw-red)]">Report upload</Pill>
          </div>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--hw-muted)]">
            Upload a <span className="font-semibold text-[var(--hw-ink)]">Home Inspection</span>,{" "}
            <span className="font-semibold text-[var(--hw-ink)]">Village Inspection</span>, or{" "}
            <span className="font-semibold text-[var(--hw-ink)]">Appraisal</span> report. We will review the file and email your Instant Estimate link when the report is ready.
          </p>

          <label
            className="mt-5 block cursor-pointer rounded-[22px] border border-dashed border-[rgba(17,24,39,.22)] bg-[var(--hw-soft)] p-4 transition hover:bg-white"
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              selectFile(e.dataTransfer.files?.[0] ?? null);
            }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-white text-[var(--hw-red)] shadow-sm">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-extrabold text-[var(--hw-ink)]">{file?.name || "Choose a PDF to upload"}</div>
                  <div className="mt-1 text-sm text-[var(--hw-muted)]">Drag and drop or click to browse.</div>
                </div>
              </div>
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }}
              >
                Upload report
              </Button>
            </div>
            <input
              ref={fileInputRef}
              className="hidden"
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              onChange={(e) => selectFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      </div>

      <Modal open={modalOpen} title="Instant Estimate" onClose={() => setModalOpen(false)} mobilePlacement="center" scrollKey={file?.name || result?.reportId || "empty"}>
        <div className="grid gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-3xl font-extrabold tracking-tight text-[var(--hw-ink)]">Instant Estimate</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--hw-muted)]">
                Upload an inspection/appraisal PDF, then we will prepare your estimate report.
              </p>
            </div>
            {result ? (
              <Link href={result.portalPath}>
                <Button variant="secondary">Preview portal</Button>
              </Link>
            ) : null}
          </div>

          <div className={`rounded-[22px] border p-4 transition-all ${file ? completeStepClass : idleStepClass}`}>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--hw-line)] text-xs font-semibold text-[var(--hw-ink)]">1</div>
              <div className="text-sm font-semibold text-[var(--hw-ink)]">Upload file(s)</div>
              {file ? <div className="text-xs font-semibold text-emerald-700">✓</div> : null}
            </div>
            <div className="mt-2 text-sm text-[var(--hw-muted)]">{file?.name || "Choose an inspection/appraisal file."}</div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`mt-4 flex w-full items-center justify-between rounded-[18px] border border-dashed px-4 py-4 text-left transition-all ${
                file ? "border-[rgba(229,57,53,.26)] bg-white shadow-sm" : "border-[rgba(17,24,39,.22)] bg-[var(--hw-soft)]"
              }`}
            >
              <span>
                <span className="block text-sm font-semibold text-[var(--hw-ink)]">Choose a PDF to upload</span>
                <span className="mt-1 block text-sm text-[var(--hw-muted)]">Drag and drop or click to browse.</span>
              </span>
              <span className="rounded-[14px] bg-white px-4 py-2 text-sm font-semibold text-[var(--hw-ink)] shadow-sm">Browse</span>
            </button>
          </div>

          <div className={`rounded-[22px] border p-4 transition-all ${contactComplete ? completeStepClass : idleStepClass}`}>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--hw-line)] text-xs font-semibold text-[var(--hw-ink)]">2</div>
              <div className="text-sm font-semibold text-[var(--hw-ink)]">Property and contact</div>
            </div>
            <div className="mt-3 grid gap-3">
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Property address" />
              <select
                className="h-11 w-full rounded-[var(--hw-radius-sm)] border border-[var(--hw-line)] bg-gradient-to-b from-white to-[var(--hw-soft)] px-3 text-sm text-[var(--hw-ink)] shadow-[0_10px_22px_rgba(17,24,39,.06)] outline-none transition focus:border-[rgba(229,57,53,.35)] focus:ring-4 focus:ring-[rgba(229,57,53,.10)]"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
              >
                <option value="">Type of property</option>
                <option value="Condo">Condo</option>
                <option value="House">House</option>
                <option value="Multi-Units">Multi-Units</option>
                <option value="Town house">Town house</option>
                <option value="Commercial">Commercial</option>
              </select>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                <Input value={phone} onChange={(e) => setPhone(formatPhoneUS(e.target.value))} placeholder="Phone" inputMode="tel" />
              </div>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email for the report link" inputMode="email" />
            </div>
          </div>

          <div className={`rounded-[22px] border p-4 transition-all ${notesComplete ? completeStepClass : idleStepClass}`}>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--hw-line)] text-xs font-semibold text-[var(--hw-ink)]">3</div>
              <div className="text-sm font-semibold text-[var(--hw-ink)]">Notes (optional)</div>
            </div>
            <Textarea className="mt-3" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything you want the estimate to focus on?" />
          </div>

          <div className="rounded-[18px] border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.06)] p-4 text-xs leading-5 text-[var(--hw-muted)]">
            Estimates are planning numbers for repair prioritization and negotiation; final pricing is verified after scope, access, materials, and timing are confirmed.
          </div>

          {error ? <div className="text-sm font-semibold text-[var(--hw-red)]">{error}</div> : null}
          {result ? (
            <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
              <div className="font-extrabold">Report received</div>
              <div className="mt-1">{result.message}</div>
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button disabled={!canSubmit} onClick={submit}>
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default function HomeClient(props: { homepage?: unknown }) {
  void props;

  return (
    <div className="min-h-screen bg-white text-[var(--hw-ink)]">
      <SiteHeader ctaHref="#instant-estimate-flow" />

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

          <Container className="relative max-w-[1180px] py-8 md:py-10 lg:py-12">
            <div className="grid gap-10 lg:grid-cols-[.92fr_1.08fr] lg:items-center">
              <div className="hw-reveal hw-delay-1">
                <div className="flex flex-wrap gap-2">
                  <Pill className="bg-white">
                    <span className="hw-breath-dot" aria-hidden />
                    Home services platform
                  </Pill>
                  <Pill className="bg-white">Chicago first</Pill>
                </div>

                <h1 className="mt-7 max-w-4xl text-balance text-5xl font-extrabold tracking-tight text-[var(--hw-ink)] md:text-7xl">
                  Home repairs with a plan before the visit.
                </h1>
                <p className="mt-5 max-w-2xl text-pretty text-xl leading-9 text-[var(--hw-muted)]">
                  Homeworke helps homeowners and real estate teams turn repair chaos into clear scope, practical estimates, scheduling preferences, and coordinated follow-through.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link href="#instant-estimate-flow">
                    <Button className="w-full sm:w-auto">
                      Get an instant estimate
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="#platform">
                    <Button variant="secondary" className="w-full sm:w-auto">
                      See the platform
                    </Button>
                  </Link>
                </div>

                <div className="mt-10 grid gap-3 sm:grid-cols-2">
                  {servicePillars.map((pillar, index) => {
                    const Icon = pillar.icon;
                    return (
                      <div
                        key={pillar.title}
                        className="hw-motion-card hw-reveal flex items-center gap-3 rounded-[18px] border border-[rgba(229,57,53,.16)] bg-white/90 px-3 py-3 shadow-[0_20px_50px_rgba(17,24,39,.08)] backdrop-blur"
                        style={{ animationDelay: `${0.22 + index * 0.07}s` }}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] bg-[rgba(229,57,53,.08)] text-[var(--hw-red)]">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 text-sm font-extrabold leading-5 text-[var(--hw-ink)]">{pillar.title}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="hw-reveal hw-delay-2">
                <AIWorkOrderIntakeCard
                  eyebrow="Job work order"
                  title="What do you need help with?"
                  primaryCta="Schedule a visit"
                  requireConfirmation
                  showServicingPill
                />
              </div>
            </div>
          </Container>
        </section>

        <section
          id="instant-estimate-flow"
          className="relative overflow-hidden border-t border-[rgba(229,57,53,.16)] py-16 md:py-24"
          style={{
            background:
              "radial-gradient(760px 320px at 78% 18%, rgba(229,57,53,.12), transparent 62%), linear-gradient(180deg,#fff 0%,#fff 56%,#FFF8F8 100%)",
          }}
        >
          <Container className="max-w-[1180px]">
            <div className="grid gap-8 lg:grid-cols-[.78fr_1.22fr] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <Pill className="bg-white text-[var(--hw-red)]">
                    <FileText className="h-4 w-4" />
                    Instant Estimate
                  </Pill>
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/60 bg-emerald-100 px-3 py-1.5 text-xs font-extrabold uppercase tracking-widest text-emerald-800 shadow-[0_10px_26px_rgba(16,185,129,.18)]">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,.18),0_0_18px_rgba(16,185,129,.55)]" aria-hidden />
                    Try it now
                  </span>
                </div>
                <h2 className="mt-5 text-balance text-4xl font-extrabold tracking-tight text-[var(--hw-ink)] md:text-5xl">
                  Upload your report for an Instant Estimate.
                </h2>
                <p className="mt-4 text-lg leading-8 text-[var(--hw-muted)]">
                  Send a home inspection, village inspection, or appraisal report and Homeworke will organize the likely repair scope into a clear planning estimate.
                </p>
              </div>
              <div className="relative lg:pt-16">
                <div className="mb-4 flex w-fit items-center gap-3 rounded-full border border-emerald-400/60 bg-gradient-to-r from-emerald-100 to-white px-4 py-2 text-sm font-extrabold text-emerald-800 shadow-[0_18px_42px_rgba(16,185,129,.22)] ring-4 ring-emerald-500/10 sm:ml-auto lg:absolute lg:left-8 lg:top-0 lg:mb-0">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,.16),0_0_20px_rgba(16,185,129,.55)]" aria-hidden />
                  <span>Drop your report here</span>
                  <svg className="hidden h-16 w-32 translate-y-7 text-emerald-700 drop-shadow-[0_8px_14px_rgba(16,185,129,.22)] lg:block" viewBox="0 0 132 64" fill="none" aria-hidden>
                    <path
                      d="M5 10C28 2 58 8 71 24C82 38 65 48 52 38C39 28 50 14 75 19C96 23 114 38 124 55"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path d="M112 53L126 57L122 43" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <PublicInstantEstimateCard />
              </div>
            </div>
          </Container>
        </section>

        <section id="platform" className="py-16 md:py-24">
          <Container className="max-w-[1180px]">
            <div className="grid gap-10 lg:grid-cols-[.78fr_1.22fr] lg:items-center">
              <div className="hw-reveal hw-delay-1">
                <Pill className="bg-white text-[var(--hw-red)]">
                  <CheckCircle2 className="h-4 w-4" />
                  Estimate Results
                </Pill>
                <h2 className="mt-5 text-balance text-4xl font-extrabold tracking-tight text-[var(--hw-ink)] md:text-5xl">
                  Start with useful numbers, not vague callbacks.
                </h2>
                <p className="mt-4 max-w-xl text-lg leading-8 text-[var(--hw-muted)]">
                  Upload an inspection report or repair list and Homeworke organizes likely repairs into a planning estimate. It is built to support decisions, negotiations, and next steps before final pricing is verified.
                </p>
              </div>
              <div className="hw-reveal hw-delay-2">
                <div className="hw-float-soft">
                  <EstimatePreview />
                </div>
              </div>
            </div>
          </Container>
        </section>

        <section className="border-t border-[var(--hw-line)] py-16 md:py-24">
          <Container className="max-w-[1180px]">
            <div className="grid gap-10 lg:grid-cols-[1.16fr_.84fr] lg:items-center">
              <div className="hw-reveal hw-delay-2 lg:order-2">
                <Pill className="bg-white text-[var(--hw-red)]">
                  <MessageSquareText className="h-4 w-4" />
                  Coordinated repair flow
                </Pill>
                <h2 className="mt-5 text-balance text-4xl font-extrabold tracking-tight text-[var(--hw-ink)] md:text-5xl">
                  The handoff stays organized after the first request.
                </h2>
                <p className="mt-4 max-w-xl text-lg leading-8 text-[var(--hw-muted)]">
                  Homeworke captures the details, routes the service category, attaches timing preferences, and keeps the repair conversation in one place for the people who need context.
                </p>
              </div>
              <div className="hw-reveal hw-delay-1 lg:order-1">
                <div className="hw-float-soft">
                  <CoordinationPreview />
                </div>
              </div>
            </div>
          </Container>
        </section>

        <section className="border-t border-[var(--hw-line)] py-16 md:py-24">
          <Container className="max-w-[1180px]">
            <div className="max-w-3xl">
              <div className="text-sm font-extrabold uppercase tracking-widest text-[var(--hw-muted)]">What Homeworke does</div>
              <h2 className="mt-3 text-balance text-4xl font-extrabold tracking-tight text-[var(--hw-ink)] md:text-5xl">
                One repair operating layer for the home.
              </h2>
              <p className="mt-4 text-lg leading-8 text-[var(--hw-muted)]">
                The platform is designed for real repair moments: inspections, move-in lists, urgent issues, maintenance tasks, and the handoffs that usually get messy.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {servicePillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div key={pillar.title} className="hw-motion-card rounded-[24px] border border-[rgba(229,57,53,.16)] bg-white p-5 shadow-[0_20px_50px_rgba(17,24,39,.08)]">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[rgba(229,57,53,.08)] text-[var(--hw-red)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="mt-5 text-lg font-extrabold text-[var(--hw-ink)]">{pillar.title}</div>
                    <div className="mt-2 text-sm leading-6 text-[var(--hw-muted)]">{pillar.text}</div>
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

              <div className="relative grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
                <div>
                  <div className="text-sm font-extrabold uppercase tracking-widest text-[var(--hw-muted)]">How it works</div>
                  <h2 className="mt-3 text-balance text-4xl font-extrabold tracking-tight text-[var(--hw-ink)] md:text-5xl">
                    From something is wrong to a scheduled next step.
                  </h2>
                </div>
                <div className="grid gap-3">
                  {workflow.map((step) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.title} className="hw-motion-card rounded-[22px] border border-[rgba(17,24,39,.08)] bg-white/90 p-5 shadow-[0_18px_44px_rgba(17,24,39,.08)] backdrop-blur">
                        <div className="flex gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[var(--hw-red)] text-sm font-extrabold text-white">
                            {step.label}
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
            </div>
          </Container>
        </section>

        <section className="border-t border-[var(--hw-line)] py-16 md:py-24">
          <Container className="max-w-[1180px]">
            <div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
              <div>
                <Pill className="bg-white text-[var(--hw-red)]">
                  <Wrench className="h-4 w-4" />
                  Services
                </Pill>
                <h2 className="mt-5 text-balance text-4xl font-extrabold tracking-tight text-[var(--hw-ink)] md:text-5xl">
                  Built for the repairs that slow down real life.
                </h2>
                <p className="mt-4 text-lg leading-8 text-[var(--hw-muted)]">
                  Start with the problem. Homeworke helps route the category, clarify scope, and prepare the request for a real-world visit.
                </p>
                <div className="mt-7">
                  <Link href="/work-order">
                    <Button variant="secondary">
                      Browse services
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {projectTypes.map((item) => (
                  <div key={item} className="hw-motion-card flex items-center gap-3 rounded-[20px] border border-[rgba(229,57,53,.16)] bg-white p-4 shadow-[0_18px_44px_rgba(17,24,39,.08)]">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--hw-red)]" />
                    <div className="text-sm font-extrabold text-[var(--hw-ink)]">{item}</div>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>

        <section className="border-t border-[var(--hw-line)] py-16 md:py-24">
          <Container className="max-w-[1180px]">
            <div className="max-w-3xl">
              <div className="text-sm font-extrabold uppercase tracking-widest text-[var(--hw-muted)]">Who it helps</div>
              <h2 className="mt-3 text-balance text-4xl font-extrabold tracking-tight text-[var(--hw-ink)] md:text-5xl">
                A better repair experience for everyone around the home.
              </h2>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {audiences.map((audience) => {
                const Icon = audience.icon;
                return (
                  <div key={audience.title} className="hw-motion-card rounded-[24px] border border-[rgba(17,24,39,.08)] bg-white p-6 shadow-[0_20px_50px_rgba(17,24,39,.08)]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[rgba(229,57,53,.08)] text-[var(--hw-red)]">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="mt-5 text-xl font-extrabold text-[var(--hw-ink)]">{audience.title}</div>
                    <div className="mt-2 text-sm leading-6 text-[var(--hw-muted)]">{audience.text}</div>
                  </div>
                );
              })}
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
                  <div className="text-sm font-extrabold uppercase tracking-widest text-white/60">Ready when the home needs help</div>
                  <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
                    Start with the repair, leave with a plan.
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-white/70">
                    Use Homeworke for instant repair planning, AI-assisted intake, and a cleaner path to scheduling verified work.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <Link href="#instant-estimate-flow">
                    <Button className="w-full bg-white text-[var(--hw-ink)] shadow-none hover:bg-[var(--hw-soft)]">
                      Get an instant estimate
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/work-order">
                    <Button variant="secondary" className="w-full border-white/15 bg-white/10 text-white shadow-none hover:bg-white/15">
                      Explore services
                    </Button>
                  </Link>
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
