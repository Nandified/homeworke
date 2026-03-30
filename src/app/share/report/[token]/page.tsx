import Image from "next/image";

import partners from "@/../spec/partners.json";

import { Container, Card, Pill } from "@/components/ui";
import { ShareLoginCta } from "@/components/share/ShareLoginCta";
import { SharedExpressEstimateReportClient } from "@/components/share/SharedExpressEstimateReportClient";
import { resolvePartner } from "@/lib/partners";
import { verifyShareToken } from "@/lib/share-token";

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
      <Container className="py-10 md:py-16">
        <div className="flex flex-wrap items-center gap-2">
          <Pill>Instant Estimate</Pill>
          <Pill>{payload.mode === "selected" ? "Shared selection" : "Shared full report"}</Pill>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_420px]">
          <Card className="p-6">
            <div className="text-xl font-extrabold tracking-tight text-[var(--hw-ink)]">
              Hi {payload.recipient?.name?.split(" ")[0] || "there"}, here is your Instant Estimate.
            </div>
            <div className="mt-2 text-sm text-[var(--hw-muted)]">Property</div>
            <div className="mt-1 text-sm font-semibold text-[var(--hw-ink)]">{payload.address || "—"}</div>

            <div className="mt-5 rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Next steps</div>
              <div className="mt-1 text-sm font-semibold text-[var(--hw-ink)]">Book repairs and see more details</div>
              <div className="mt-1 text-xs text-[var(--hw-muted)]">We’ll email you a one-time login link to continue.</div>
              <div className="mt-3">
                <ShareLoginCta email={payload.recipient?.email} next={`/share/report/${encodeURIComponent(token)}`} />
              </div>
            </div>

            <div className="mt-4 text-xs text-[var(--hw-muted)]">You can view and download the report below without logging in.</div>
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
                className="inline-flex items-center justify-center rounded-full bg-[var(--hw-red)] px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(229,57,53,.3)] hover:brightness-[1.05]"
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
              <div className="mt-4 flex flex-wrap gap-2">
                {proSocials.slice(0, 8).map(([k, v]) => {
                  const label = k.replace(/_url$/i, "").replace(/_/g, " ");
                  const kind = label.toLowerCase();
                  const icon = kind.includes("instagram")
                    ? "Instagram"
                    : kind.includes("facebook")
                      ? "Facebook"
                      : kind.includes("linkedin")
                        ? "LinkedIn"
                        : kind.includes("youtube")
                          ? "YouTube"
                          : kind.includes("tiktok")
                            ? "TikTok"
                            : kind.includes("twitter") || kind === "x"
                              ? "X"
                              : kind.includes("google")
                                ? "Google"
                                : kind.includes("zillow")
                                  ? "Zillow"
                                  : kind.includes("realtor")
                                    ? "Realtor"
                                    : kind.includes("website")
                                      ? "Website"
                                      : "Link";

                  return (
                    <a
                      key={k}
                      href={v}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--hw-line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]"
                    >
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--hw-soft)] text-[11px] font-extrabold text-[var(--hw-red)]">
                        {icon.slice(0, 1)}
                      </span>
                      <span className="capitalize">{label}</span>
                    </a>
                  );
                })}
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
          </Card>
        </div>

        <div className="mt-8" id="book-repairs">
          <SharedExpressEstimateReportClient token={token} payload={payload} />
        </div>
      </Container>
    </div>
  );
}
