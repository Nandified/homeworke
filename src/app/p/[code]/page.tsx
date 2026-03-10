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
      className="inline-flex items-center justify-center rounded-full border border-[var(--hw-line)] bg-white p-2 text-[var(--hw-muted)] hover:bg-[var(--hw-soft)]"
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
        <Container className="py-12">
          <Pill>Partner</Pill>
          <Card className="mt-6 p-7">
            <div className="text-sm font-semibold">This link is not available.</div>
            <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">
              You can still use Homeworke through the public marketplace.
            </div>
            <div className="mt-5">
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
      <header className="sticky top-0 z-20 border-b border-[var(--hw-line)] bg-white/80 backdrop-blur">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" className="text-sm font-extrabold tracking-tight text-[var(--hw-ink)]">
            Homeworke
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            <Link href="/marketplace/intake">
              <Button variant="ghost">Request service</Button>
            </Link>
            <Pill>Partner link</Pill>
          </nav>
        </Container>
      </header>

      <main>
        <Container className="py-12">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">{spec.page.headline}</div>
                            <div className="flex items-start gap-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-[var(--hw-radius)] border border-[rgba(229,57,53,.18)] bg-[var(--hw-soft)]">
                  {pro.headshot_url ? (
                    <Image src={pro.headshot_url} alt={pro.display_name} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-extrabold text-[var(--hw-muted)]">
                      {pro.display_name.split(" ").map((p) => p[0]).slice(0,2).join("")}
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-balance text-4xl font-extrabold tracking-tight md:text-5xl">{pro.display_name}</h1>
                  <div className="mt-3 max-w-3xl text-base leading-8 text-[var(--hw-muted)]">{pro.brokerage_name}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Chip>License: {pro.license_state} {pro.license_number}</Chip>
                    {partnerSet ? <Chip>Partner attached</Chip> : <Chip>Partner pending</Chip>}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
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

          <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-12">
            <Card className="p-7 lg:col-span-7">
              <div className="text-sm font-semibold">About</div>
              <div className="mt-3 text-base leading-8 text-[var(--hw-muted)]">{pro.bio}</div>

              {socials.length ? (
                <div className="mt-6">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Social</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {socials.map(([k, href]) => (
                      <SocialIconLink key={k} href={href} label={k.replace(/_/g, " ").replace(/url/g, "").trim()} />
                    ))}
                    {pro.website_url ? <SocialIconLink href={pro.website_url} label="Website" /> : null}
                  </div>
                </div>
              ) : null}
            </Card>

            <Card className="p-7 lg:col-span-5">
              <div className="text-sm font-semibold">Intro video</div>
              <div className="mt-3 text-base leading-8 text-[var(--hw-muted)]">{spec.proCard.videoRule}</div>
              <div className="mt-5 rounded-[var(--hw-radius)] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-8 text-center">
                <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(229,57,53,.18)] bg-white">
                  <Play className="h-6 w-6 text-[var(--hw-red)]" />
                </div>
                <div className="mt-4 text-sm font-semibold">Video placeholder</div>
                <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">
                  Upload and playback will be enabled in a future release.
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-10">
            <Card className="p-8">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Homeworke</div>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight">{spec.page.subheadline}</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <StatTile label="Funnel" value="No friction" note="Browse and start a request without creating an account first." />
                <StatTile label="Trust" value="Vetted pros" note="Curated matching and clear next steps." />
                <StatTile label="Partner" value="Permissioned" note="Your agent stays in the loop only when you allow it." />
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/marketplace/intake">
                  <Button>{spec.page.primaryCta}</Button>
                </Link>
                <Link href="/">
                  <Button variant="secondary">{spec.page.secondaryCta}</Button>
                </Link>
              </div>

              <div className="mt-6 text-sm leading-7 text-[var(--hw-muted)]">
                Your request will start with this partner pre-attached for attribution. You control sharing on a per-request basis.
              </div>
            </Card>
          </div>
        </Container>
      </main>
    </div>
  );
}
