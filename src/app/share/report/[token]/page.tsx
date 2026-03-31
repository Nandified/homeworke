import Image from "next/image";
import Link from "next/link";

import partners from "@/../spec/partners.json";

import {
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Twitter,
  Music2,
  MapPin,
  Home,
  Building2,
  Globe,
  Link as LinkIcon,
} from "lucide-react";

import { Container, Card, Pill } from "@/components/ui";
import { SharedExpressEstimateReportClient } from "@/components/share/SharedExpressEstimateReportClient";
import { resolvePartner } from "@/lib/partners";
import { verifyShareToken } from "@/lib/share-token";

function SocialIconLink(props: { href: string; label: string }) {
  const k = (props.label || "").toLowerCase();
  const Icon =
    k.includes("instagram")
      ? Instagram
      : k.includes("facebook")
        ? Facebook
        : k.includes("linkedin")
          ? Linkedin
          : k.includes("youtube")
            ? Youtube
            : k.includes("tiktok")
              ? Music2
              : k.includes("twitter") || k === "x"
                ? Twitter
                : k.includes("google") || k.includes("gmb") || k.includes("business profile")
                  ? MapPin
                  : k.includes("zillow")
                    ? Home
                    : k.includes("realtor")
                      ? Building2
                      : k.includes("website") || k.includes("web")
                        ? Globe
                        : LinkIcon;

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

export default async function ShareReportPage(props: { params: Promise<{ token: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { token } = await props.params;
  const secret = process.env.SHARE_TOKEN_SECRET || "dev-share-secret";

  const v = verifyShareToken(token, secret);
  if (!v.ok) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
        <Container className="py-10 md:py-16">
          <div className="flex flex-wrap items-center gap-2">
            <Pill>Shared report</Pill>
            <Pill>Link invalid</Pill>
          </div>
          <Card className="mt-8 max-w-xl p-6">
            <div className="text-sm font-semibold text-[var(--hw-ink)]">This share link is no longer valid.</div>
            <div className="mt-2 text-sm text-[var(--hw-muted)]">Ask the sender to generate a new share link.</div>
          </Card>
        </Container>
      </div>
    );
  }

  const payload = v.payload;

  const enrichedPro = (() => {
    if (payload.pro?.code) return resolvePartner(payload.pro.code) as any;

    const email = (payload.pro?.email || "").trim().toLowerCase();
    if (email) {
      const m = (partners as any[]).find((p) => String(p?.email || "").trim().toLowerCase() === email);
      if (m) return m as any;
    }

    const name = (payload.pro?.name || "").trim().toLowerCase();
    if (name) {
      const m = (partners as any[]).find((p) => String(p?.display_name || "").trim().toLowerCase() === name);
      if (m) return m as any;
    }

    return null;
  })();

  // Prefer a fully-qualified address from the report snapshot, then fall back.
  const fullAddress = (payload.address || "").trim() || "—";
  const proName = enrichedPro?.display_name || payload.pro?.name || "Real Estate Pro";
  const proBrokerage = enrichedPro?.brokerage_name || payload.pro?.brokerageName || "";
  const proLicense = enrichedPro?.license_state && enrichedPro?.license_number ? `${enrichedPro.license_state} ${enrichedPro.license_number}` : "";
  const proHeadshot = enrichedPro?.headshot_url || null;
  const proEmail = enrichedPro?.email || payload.pro?.email || "";
  const proPhone = enrichedPro?.phone && enrichedPro.phone !== "(placeholder)" ? enrichedPro.phone : payload.pro?.phone || "";
  const proWebsite = enrichedPro?.website_url || "";
  const proBio = enrichedPro?.bio || "";
  const proSocials = enrichedPro?.socials ? (Object.entries(enrichedPro.socials).filter(([, v]) => !!v) as Array<[string, string]>) : [];

  const showRecipient = Boolean(payload.recipient?.name || payload.recipient?.email || payload.recipient?.phone || payload.recipient?.role);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      {/* ── Header (match Pro landing branding) ── */}
      <header className="sticky top-0 z-20 border-b border-[var(--hw-line)] bg-white/80 backdrop-blur">
        <Container className="flex h-14 items-center justify-between md:h-16">
          <Link href="/" className="text-lg font-extrabold tracking-tight text-[var(--hw-red)] md:text-xl">
            Homeworke
          </Link>
          <nav className="flex items-center gap-3">
            <Pill>Real Estate Pro</Pill>
          </nav>
        </Container>
      </header>

      <Container className="py-8 md:py-12">
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_420px]">
          <Card className="p-6">
            <div className="text-xl font-semibold tracking-tight text-[var(--hw-ink)]">
              Hi {payload.recipient?.name?.split(" ")[0] || "there"}, here is your Instant Estimate.
            </div>
            <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Property</div>
            <div className="mt-1 text-lg font-medium tracking-tight text-[var(--hw-ink)] md:text-xl">{fullAddress}</div>

            <div className="mt-5 rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Next steps</div>
              <div className="mt-1 text-sm font-semibold text-[var(--hw-ink)]">Download your report or book repairs</div>
              <div className="mt-1 text-xs text-[var(--hw-muted)]">No login needed. Your details will be collected during the PDF download flow.</div>
            </div>

            <div className="mt-4 text-xs text-[var(--hw-muted)]">You can view and download the report below.</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              {proHeadshot ? (
                <div className="relative h-14 w-14 overflow-hidden rounded-full border border-[var(--hw-line)] bg-white">
                  <Image src={proHeadshot} alt={proName} fill sizes="56px" className="object-cover" />
                </div>
              ) : (
                <div className="grid h-14 w-14 place-items-center rounded-full bg-[var(--hw-soft)] text-sm font-extrabold text-[var(--hw-red)]">
                  {proName
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((w: string) => w[0]?.toUpperCase())
                    .join("")}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Your trusted Real Estate Professional</div>
                <div className="mt-1 truncate text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">{proName}</div>
                {proBrokerage ? <div className="mt-1 truncate text-sm text-[var(--hw-muted)]">{proBrokerage}</div> : null}
                {proLicense ? (
                  <div className="mt-2 inline-flex rounded-full border border-[var(--hw-line)] bg-white px-3 py-1 text-xs font-semibold text-[var(--hw-ink)]">
                    License: {proLicense}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {proEmail ? (
                <a
                  className="inline-flex items-center justify-center rounded-full border border-[var(--hw-line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]"
                  href={`mailto:${proEmail}`}
                >
                  Email
                </a>
              ) : null}
              {proPhone ? (
                <a
                  className="inline-flex items-center justify-center rounded-full border border-[var(--hw-line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]"
                  href={`tel:${proPhone}`}
                >
                  Call
                </a>
              ) : null}
              <a
                className="inline-flex items-center justify-center rounded-full bg-[var(--hw-red)] px-4 py-2 text-sm font-semibold !text-white shadow-[0_4px_14px_rgba(229,57,53,.3)] hover:brightness-[1.05] hover:!text-white"
                href="#book-repairs"
              >
                Book repairs
              </a>
            </div>

            {proWebsite ? (
              <div className="mt-4 text-sm">
                <a className="font-semibold text-[var(--hw-red)] underline" href={proWebsite} target="_blank" rel="noreferrer">
                  {proWebsite.replace(/^https?:\/\//, "")}
                </a>
              </div>
            ) : null}

            {proBio ? <div className="mt-3 text-sm leading-relaxed text-[var(--hw-muted)]">{proBio}</div> : null}

            {proSocials.length ? (
              <div className="mt-5">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Social</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {proSocials.slice(0, 10).map(([k, v]) => {
                    const label = k.replace(/_url$/i, "").replace(/_/g, " ").trim();
                    return <SocialIconLink key={k} href={v} label={label} />;
                  })}
                </div>
              </div>
            ) : null}

            {showRecipient ? (
              <div className="mt-5 rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Recipient</div>
                <div className="mt-1 text-sm font-semibold text-[var(--hw-ink)]">
                  {payload.recipient?.name || "—"}
                  {payload.recipient?.role ? ` • ${payload.recipient.role}` : ""}
                </div>
                {payload.recipient?.email ? <div className="mt-1 text-sm text-[var(--hw-muted)]">{payload.recipient.email}</div> : null}
                {payload.recipient?.phone ? <div className="mt-1 text-sm text-[var(--hw-muted)]">{payload.recipient.phone}</div> : null}
              </div>
            ) : null}
          

            <div className="mt-5 rounded-[var(--hw-radius-lg)] border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.06)] p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">For Real Estate Pros</div>
              <div className="mt-1 text-sm font-semibold text-[var(--hw-ink)]">Want this Instant Estimate for your clients?</div>
              <div className="mt-1 text-xs text-[var(--hw-muted)]">Create a free account and share branded estimates like this in minutes.</div>
              <div className="mt-3">
                <Link
                  href="/p/frj"
                  className="inline-flex items-center justify-center rounded-full bg-[var(--hw-red)] px-4 py-2 text-sm font-semibold !text-white shadow-[0_4px_14px_rgba(229,57,53,.3)] hover:brightness-[1.05] hover:!text-white"
                >
                  Get my Pro link
                </Link>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-8" id="book-repairs">
          <SharedExpressEstimateReportClient token={token} payload={payload} />
        </div>
      </Container>
    </div>
  );
}
