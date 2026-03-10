"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Play, Phone, Mail, Link as LinkIcon } from "lucide-react";

import { Button, Card, Chip, Container, Pill, StatTile } from "@/components/ui";
import { PARTNER_STORAGE_KEY, type PartnerContext } from "@/lib/partner-context";
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
  }>;
};

function resolvePro(code: string): ProProfile | null {
  const c = code.toLowerCase();
  if (c === "frj" || c === "frjgroup" || c === "thefrjgroup") {
    return {
      pro_code: "frj",
      display_name: "Fernando Rocha Jr.",
      headshot_url: null,
      brokerage_name: "The FRJ Group @ RE/MAX",
      license_number: "(placeholder)",
      license_state: "IL",
      phone: "(placeholder)",
      email: "Fernando@TheFRJgroup.com",
      website_url: "https://thefrjgroup.com",
      bio:
        "I help clients buy and sell with a focus on clarity, speed, and protecting the transaction. Homeworke is how we extend that value after closing with vetted home services and clear project tracking.",
      intro_video_url: null,
      socials: {
        linkedin_url: "https://www.linkedin.com",
        instagram_url: "https://www.instagram.com",
      },
    };
  }
  if (c === "demo") {
    return {
      pro_code: "demo",
      display_name: "Partner Demo",
      headshot_url: null,
      brokerage_name: "Demo Office",
      license_number: "(placeholder)",
      license_state: "IL",
      phone: "(placeholder)",
      email: "demo@example.com",
      website_url: "https://homeworke.com",
      bio: "Short bio placeholder. This will be agent-authored and emoji-free.",
      intro_video_url: null,
      socials: { linkedin_url: "https://www.linkedin.com" },
    };
  }
  return null;
}

function toPartnerContext(pro: ProProfile): PartnerContext {
  return {
    partnerId: `pro_${pro.pro_code}`,
    partnerName: pro.display_name,
    partnerType: "agent",
    officeName: pro.brokerage_name,
    createdAt: new Date().toISOString(),
  };
}

function SocialIconLink(props: { href: string; label: string }) {
  return (
    <a
      href={props.href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center justify-center rounded-full border border-[var(--hw-line)] bg-white p-2.5 text-[var(--hw-muted)] transition-colors hover:border-[var(--hw-ink)]/20 hover:bg-[var(--hw-soft)] hover:text-[var(--hw-ink)]"
      aria-label={props.label}
      title={props.label}
    >
      <LinkIcon className="h-4 w-4" />
    </a>
  );
}

export default function Page() {
  const params = useParams<{ code: string }>();
  const code = params.code;

  const pro = useMemo(() => resolvePro(code), [code]);
  const [partnerSet, setPartnerSet] = useState(false);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-20 border-b border-[var(--hw-line)] bg-white/80 backdrop-blur">
        <Container className="flex h-14 items-center justify-between md:h-16">
          <Link href="/" className="text-sm font-extrabold tracking-tight text-[var(--hw-ink)]">
            Homeworke
          </Link>
          <nav className="flex items-center gap-3">
            <Pill>Partner link</Pill>
            <Link href="/marketplace/intake" className="hidden md:block">
              <Button variant="ghost">Request service</Button>
            </Link>
          </nav>
        </Container>
      </header>

      <main>
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
                <div className="relative h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-2xl border border-[rgba(229,57,53,.14)] bg-[var(--hw-soft)] shadow-sm md:h-20 md:w-20">
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

              {/* Right: contact actions */}
              <div className="flex flex-shrink-0 gap-2">
                <a href={`mailto:${pro.email}`}>
                  <Button variant="secondary">
                    <Mail className="h-4 w-4" />
                    Email
                  </Button>
                </a>
                <Button variant="secondary" disabled>
                  <Phone className="h-4 w-4" />
                  Call
                </Button>
              </div>
            </div>
          </Container>
        </section>

        {/* ── Content grid ── */}
        <Container className="py-10 md:py-14">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* About card */}
            <Card className="p-8 lg:col-span-7 lg:p-9">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">About</h2>
              <p className="mt-4 text-[15px] leading-[1.8] text-[var(--hw-muted)]">{pro.bio}</p>

              {socials.length > 0 && (
                <div className="mt-8 border-t border-[var(--hw-line)] pt-6">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Social</h3>
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {socials.map(([k, href]) => (
                      <SocialIconLink
                        key={k}
                        href={href}
                        label={k
                          .replace(/_/g, " ")
                          .replace(/url/g, "")
                          .trim()}
                      />
                    ))}
                    {pro.website_url ? <SocialIconLink href={pro.website_url} label="Website" /> : null}
                  </div>
                </div>
              )}
            </Card>

            {/* Video card */}
            <Card className="p-8 lg:col-span-5 lg:p-9">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Intro video</h2>
              <p className="mt-4 text-[15px] leading-[1.8] text-[var(--hw-muted)]">{spec.proCard.videoRule}</p>
              <div className="mt-6 flex flex-col items-center rounded-xl border border-dashed border-[var(--hw-line)] bg-[var(--hw-soft)]/60 px-6 py-10">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(229,57,53,.14)] bg-white shadow-sm">
                  <Play className="h-5 w-5 text-[var(--hw-red)]" />
                </div>
                <div className="mt-5 text-sm font-semibold text-[var(--hw-ink)]">Video placeholder</div>
                <div className="mt-1.5 text-center text-sm leading-relaxed text-[var(--hw-muted)]">
                  Upload and playback will be enabled in a future release.
                </div>
              </div>
            </Card>
          </div>

          {/* ── CTA section ── */}
          <Card className="mt-10 overflow-hidden p-0">
            <div className="px-8 pb-10 pt-9 md:px-10 md:pb-12 md:pt-11">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Homeworke</div>
              <h2 className="mt-2 max-w-xl text-2xl font-extrabold tracking-tight text-[var(--hw-ink)] md:text-3xl">
                {spec.page.subheadline}
              </h2>

              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatTile
                  label="Funnel"
                  value="No friction"
                  note="Browse and start a request without creating an account first."
                />
                <StatTile
                  label="Trust"
                  value="Vetted pros"
                  note="Curated matching and clear next steps."
                />
                <StatTile
                  label="Partner"
                  value="Permissioned"
                  note="Your agent stays in the loop only when you allow it."
                />
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/marketplace/intake">
                  <Button>{spec.page.primaryCta}</Button>
                </Link>
                <Link href="/">
                  <Button variant="secondary">{spec.page.secondaryCta}</Button>
                </Link>
              </div>

              <p className="mt-6 max-w-lg text-[13px] leading-relaxed text-[var(--hw-muted)]">
                Your request will start with this partner pre-attached for attribution. You control sharing on a per-request basis.
              </p>
            </div>
          </Card>
        </Container>
      </main>
    </div>
  );
}
