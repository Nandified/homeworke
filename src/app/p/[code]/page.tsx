"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Play,
  Phone,
  Mail,
  Link as LinkIcon,
  Globe,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Twitter,
  Music2,
  MapPin,
  Home,
  Building2,
  ShieldCheck,
  ListChecks,
  MessagesSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { Button, Card, Chip, Container, Pill, Input, Textarea, Modal } from "@/components/ui";
import { PARTNER_STORAGE_KEY, type PartnerContext } from "@/lib/partner-context";
import { resolvePartner, partnerIdFor } from "@/lib/partners";
import spec from "@/../spec/pro_landing_polish_opus.json";

type ProProfile = {
  pro_code: string;
  display_name: string;
  headshot_url?: string | null;
  brokerage_name: string;
  license_number: string;
  license_state: string;
  phone: string;
  email: string;
  website_url?: string;
  bio: string;
  intro_video_url?: string | null;
  socials: Partial<{
    instagram_url: string;
    facebook_url: string;
    linkedin_url: string;
    youtube_url: string;
    tiktok_url: string;
    twitter_url: string;
    google_business_url: string;
    zillow_url: string;
    realtor_url: string;
  }>;
};

function toPartnerContext(pro: ProProfile): PartnerContext {
  return {
    partnerId: partnerIdFor(pro.pro_code),
    partnerName: pro.display_name,
    partnerType: "agent",
    officeName: pro.brokerage_name,
    createdAt: new Date().toISOString(),
  };
}

function SocialIconLink(props: { href: string; label: string; kind?: string }) {
  const Icon = (() => {
    const k = (props.kind || props.label).toLowerCase();
    if (k.includes("instagram")) return Instagram;
    if (k.includes("facebook")) return Facebook;
    if (k.includes("linkedin")) return Linkedin;
    if (k.includes("youtube")) return Youtube;
    if (k.includes("tiktok")) return Music2; // lucide doesn't ship an official TikTok icon
    if (k.includes("twitter") || k === "x") return Twitter;
    if (k.includes("google") || k.includes("gmb") || k.includes("business profile")) return MapPin;
    if (k.includes("zillow")) return Home;
    if (k.includes("realtor")) return Building2;
    if (k.includes("website") || k.includes("web")) return Globe;
    return LinkIcon;
  })();

  return (
    <a
      href={props.href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center justify-center rounded-full border border-[var(--hw-line)] bg-white p-2.5 text-[var(--hw-muted)] transition-colors hover:border-[var(--hw-ink)]/20 hover:bg-[var(--hw-soft)] hover:text-[var(--hw-ink)]"
      aria-label={props.label}
      title={props.label}
    >
      <Icon className="h-4 w-4" />
    </a>
  );
}

export default function Page() {
  const params = useParams<{ code: string }>();
  const code = params.code;

  const pro = useMemo(() => resolvePartner(code) as ProProfile | null, [code]);
  const [partnerSet, setPartnerSet] = useState(false);

  const [noteOpen, setNoteOpen] = useState(false);
  const [noteName, setNoteName] = useState("");
  const [noteEmail, setNoteEmail] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [noteStatus, setNoteStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const [expressExpanded, setExpressExpanded] = useState(false);

  const [videoOpen, setVideoOpen] = useState(false);
  const [issue, setIssue] = useState("");

  useEffect(() => {
    if (!pro) return;
    localStorage.setItem(PARTNER_STORAGE_KEY, JSON.stringify(toPartnerContext(pro)));
    setPartnerSet(true);
  }, [pro]);

  if (!pro) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
        <Container className="flex min-h-screen flex-col items-center justify-center py-16">
          <Pill>Partner</Pill>
          <Card className="mt-8 max-w-md p-10 text-center">
            <div className="text-base font-semibold tracking-tight">This link is not available.</div>
            <div className="mt-3 text-sm leading-7 text-[var(--hw-muted)]">
              You can still use Homeworke through the public marketplace.
            </div>
            <div className="mt-8">
              <Link href="/">
                <Button>Go to Homeworke</Button>
              </Link>
            </div>
          </Card>
        </Container>
      </div>
    );
  }

  const socials = Object.entries(pro.socials).filter(([, v]) => Boolean(v)) as Array<[string, string]>;

  const socialLabelFor = (key: string) =>
    key
      .replace(/_url$/i, "")
      .replace(/_/g, " ")
      .trim();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-20 border-b border-[var(--hw-line)] bg-white/80 backdrop-blur">
        <Container className="flex h-14 items-center justify-between md:h-16">
          <Link href="/" className="text-lg font-extrabold tracking-tight text-[var(--hw-ink)] md:text-xl">
            Homeworke
          </Link>
          <nav className="flex items-center gap-3">
            <Pill>Partner link</Pill>
            <Link href="/marketplace/intake" className="hidden md:block">
              <Button variant="ghost">Request service</Button>
            </Link>
            <Link href={`/p/${code}/express-estimate`} className="hidden md:block">
              <Button variant="ghost">Upload report</Button>
            </Link>
          </nav>
        </Container>
      </header>

      <main>
        <Modal
          open={videoOpen}
          title="Intro video"
          onClose={() => {
            setVideoOpen(false);
          }}
        >
          <div className="grid gap-4">
            <div className="text-sm text-[var(--hw-muted)]">
              {pro.intro_video_url ? "Watch the short intro video." : "No video uploaded yet."}
            </div>
            {pro.intro_video_url ? (
              <a
                href={pro.intro_video_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-[var(--hw-red)] underline"
              >
                Open video
              </a>
            ) : null}
          </div>
        </Modal>

        {/* ── Hero section ── */}
        <section className="border-b border-[var(--hw-line)] bg-white">
          <Container className="py-10 md:py-16">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
              {spec.page.headline}
            </div>

            <div className="mt-6 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
              {/* Left: identity */}
              <div className="flex items-start gap-5">
                {/* Avatar */}
                <div className="relative h-[112px] w-[90px] flex-shrink-0 overflow-hidden rounded-2xl border border-[rgba(229,57,53,.14)] bg-[var(--hw-soft)] shadow-sm md:h-[128px] md:w-[104px]">
                  {pro.headshot_url ? (
                    <Image src={pro.headshot_url} alt={pro.display_name} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-base font-extrabold text-[var(--hw-muted)] md:text-lg">
                      {pro.display_name
                        .split(" ")
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                  )}

                  {pro.intro_video_url ? (
                    <button
                      type="button"
                      onClick={() => setVideoOpen(true)}
                      className="absolute bottom-2 right-2 inline-flex items-center gap-2 rounded-full border border-[rgba(17,24,39,.12)] bg-white/90 px-3 py-1.5 text-xs font-semibold text-[var(--hw-ink)] shadow-sm backdrop-blur hover:bg-white"
                    >
                      <Play className="h-3.5 w-3.5 text-[var(--hw-red)]" />
                      Intro video
                    </button>
                  ) : null}
                </div>

                <div className="min-w-0">
                  <h1 className="text-balance text-3xl font-extrabold tracking-tight text-[var(--hw-ink)] md:text-4xl lg:text-5xl">
                    {pro.display_name}
                  </h1>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--hw-muted)] md:text-base">
                    {pro.brokerage_name}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Chip>
                      License: {pro.license_state} {pro.license_number}
                    </Chip>
                    {partnerSet ? <Chip>Partner attached</Chip> : <Chip>Partner pending</Chip>}
                  </div>
                </div>
              </div>

              {/* Right: contact actions + portal link */}
              <div className="flex flex-shrink-0 flex-wrap gap-2">
                <a href={`mailto:${pro.email}`}>
                  <Button variant="secondary">
                    <Mail className="h-4 w-4" />
                    Email
                  </Button>
                </a>
                <a href={`tel:${pro.phone}`}>
                  <Button variant="secondary">
                    <Phone className="h-4 w-4" />
                    Call
                  </Button>
                </a>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setNoteOpen(true);
                    setNoteStatus("idle");
                  }}
                >
                  Message
                </Button>
              </div>
            </div>
          </Container>
        </section>

        {/* ── Content grid ── */}
        <Container className="py-10 md:py-14">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* About */}
            <Card className="p-8 lg:col-span-5 lg:p-9">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">About</h2>
              <p className="mt-4 text-[15px] leading-[1.8] text-[var(--hw-muted)]">{pro.bio}</p>

              {(socials.length > 0 || pro.website_url) && (
                <div className="mt-8 border-t border-[var(--hw-line)] pt-6">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Social</h3>
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {socials.map(([k, href]) => (
                      <SocialIconLink key={k} href={href} kind={k} label={socialLabelFor(k)} />
                    ))}
                    {pro.website_url ? <SocialIconLink href={pro.website_url} kind="website" label="Website" /> : null}
                  </div>
                </div>
              )}
            </Card>

            {/* Estimate Request (like homepage) */}
            <Card className="p-8 lg:col-span-7 lg:p-9">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Estimate request</div>
              <div className="mt-1 text-xl font-extrabold tracking-tight text-[var(--hw-ink)] sm:text-2xl">
                What’s going on with your home?
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--hw-muted)]">
                Tell us what you need — we’ll guide you to the right next step.
              </p>

              <div className="mt-5 rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-4">
                <Textarea
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  placeholder="Try: outlet stopped working, water leak under sink, HVAC not cooling…"
                />

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <Link href="/marketplace/intake">
                    <Button>Book a repair</Button>
                  </Link>
                  <Link href={`/p/${code}/express-estimate`}>
                    <Button variant="secondary">Express Estimate</Button>
                  </Link>
                </div>

                <div className="mt-3 text-xs text-[var(--hw-muted)]">
                  Express Estimates are best for inspection/appraisal reports. For everything else, we’ll confirm scope and schedule.
                </div>
              </div>
            </Card>
          </div>

          {/* ── Express Estimate (expandable) ── */}
          <Card className="mt-10 overflow-hidden p-0">
            <div className="px-8 pb-8 pt-9 md:px-10 md:pb-10 md:pt-11">
              <button
                type="button"
                onClick={() => setExpressExpanded((v) => !v)}
                className="w-full rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-5 text-left transition hover:bg-[var(--hw-soft)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-[var(--hw-ink)]">
                      Are you currently buying or selling?
                    </div>
                    <div className="mt-1 text-sm leading-relaxed text-[var(--hw-muted)]">
                      Submit your <span className="font-semibold text-[var(--hw-ink)]">Home Inspection</span> or <span className="font-semibold text-[var(--hw-ink)]">Appraisal</span> report to get an Express Estimate of repair costs.
                    </div>
                  </div>
                  <div className="shrink-0">
                    <Button variant="secondary" size="sm">
                      {expressExpanded ? "Close" : "Get Express Estimate"}
                      {expressExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </button>

              <div
                className={
                  "overflow-hidden transition-all duration-300 ease-out " +
                  (expressExpanded ? "mt-5 max-h-[260px] opacity-100" : "mt-0 max-h-0 opacity-0")
                }
              >
                <div
                  className={
                    "rounded-[var(--hw-radius-lg)] border border-dashed border-[var(--hw-line)] bg-[var(--hw-soft)] p-4 transition-transform duration-300 ease-out " +
                    (expressExpanded ? "translate-y-0" : "-translate-y-2")
                  }
                >
                  <div className="text-sm font-semibold text-[var(--hw-ink)]">Upload your report</div>
                  <div className="mt-1 text-sm text-[var(--hw-muted)]">We’ll email you when it’s ready.</div>
                  <div className="mt-4">
                    <Link href={`/p/${code}/express-estimate`}>
                      <Button>Upload report</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* ── What is Homeworke / CTA section ── */}
          <Card className="mt-6 overflow-hidden p-0">
            <div className="px-8 pb-10 pt-9 md:px-10 md:pb-12 md:pt-11">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Homeworke</div>
              <h2 className="mt-2 max-w-2xl text-2xl font-extrabold tracking-tight text-[var(--hw-ink)] md:text-3xl">
                One place to request, schedule, and track home repairs — from quick fixes to full projects.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--hw-muted)]">
                Homeworke brings together homeowners, vetted service providers, and real estate pros so your next step is always clear.
              </p>

              <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.06)]">
                      <ShieldCheck className="h-4 w-4 text-[var(--hw-red)]" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--hw-ink)]">Vetted pros</div>
                      <div className="mt-1 text-sm leading-relaxed text-[var(--hw-muted)]">We prioritize licensed/insured providers and quality operators.</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.06)]">
                      <ListChecks className="h-4 w-4 text-[var(--hw-red)]" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--hw-ink)]">Clear scope</div>
                      <div className="mt-1 text-sm leading-relaxed text-[var(--hw-muted)]">Know what’s included before you approve work.</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.06)]">
                      <MessagesSquare className="h-4 w-4 text-[var(--hw-red)]" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--hw-ink)]">One thread</div>
                      <div className="mt-1 text-sm leading-relaxed text-[var(--hw-muted)]">Keep communication organized — fewer missed details.</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Link href="/marketplace/intake">
                  <Button>Book a repair</Button>
                </Link>
                <Link href="/">
                  <Button variant="ghost">Learn more</Button>
                </Link>
              </div>

              <Modal
                open={noteOpen}
                title={`Message ${pro.display_name}`}
                onClose={() => {
                  setNoteOpen(false);
                  setNoteStatus("idle");
                }}
              >
                <div className="sr-only" aria-live="polite">
                  {noteStatus === "sent" ? "Message sent" : noteStatus === "error" ? "Message failed" : ""}
                </div>
                <div className="grid gap-4">
                  <div className="text-sm text-[var(--hw-muted)]">
                    Send a quick note. We’ll deliver it to {pro.display_name} in Homeworke.
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Name</div>
                      <Input value={noteName} onChange={(e) => setNoteName(e.target.value)} placeholder="Your name" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Email</div>
                      <Input
                        value={noteEmail}
                        onChange={(e) => setNoteEmail(e.target.value)}
                        placeholder="you@company.com"
                        inputMode="email"
                        autoComplete="email"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Message</div>
                      <Textarea value={noteBody} onChange={(e) => setNoteBody(e.target.value)} placeholder="How can we help?" />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      onClick={async () => {
                        setNoteStatus("sending");
                        try {
                          const res = await fetch("/api/messages", {
                            method: "POST",
                            headers: { "content-type": "application/json" },
                            body: JSON.stringify({
                              partnerId: partnerIdFor(pro.pro_code),
                              name: noteName,
                              email: noteEmail,
                              message: noteBody,
                            }),
                          });
                          if (!res.ok) throw new Error("send_failed");
                          setNoteStatus("sent");
                          setNoteName("");
                          setNoteEmail("");
                          setNoteBody("");
                        } catch {
                          setNoteStatus("error");
                        }
                      }}
                      disabled={!noteName || !noteEmail.includes("@") || !noteBody || noteStatus === "sending"}
                    >
                      {noteStatus === "sending" ? "Sending…" : noteStatus === "sent" ? "Sent" : "Send"}
                    </Button>
                    <Button variant="secondary" onClick={() => setNoteOpen(false)}>
                      Close
                    </Button>
                    {noteStatus === "error" ? <div className="text-sm text-[var(--hw-red)]">Could not send. Try again.</div> : null}
                    {noteStatus === "sent" ? <div className="text-sm text-[var(--hw-muted)]">Sent.</div> : null}
                  </div>

                  <div className="text-xs text-[var(--hw-muted)]">By sending, you agree Homeworke may contact you about this request.</div>
                </div>
              </Modal>

              <p className="mt-6 max-w-2xl text-[13px] leading-relaxed text-[var(--hw-muted)]">
                Your request will start with this partner pre-attached for attribution. You control sharing on a per-request basis.
              </p>
            </div>
          </Card>
        </Container>
      </main>
    </div>
  );
}
