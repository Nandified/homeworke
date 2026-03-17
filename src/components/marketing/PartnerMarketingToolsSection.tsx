"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";
import { Copy, Image as ImageIcon, Share2 } from "lucide-react";

import * as htmlToImage from "html-to-image";
import QRCode from "qrcode";

import type { PartnerContext } from "@/lib/partner-context";
import { Button, Card, Label } from "@/components/ui";
import { DashboardSection } from "@/components/dashboard/DashboardSection";

export function PartnerMarketingToolsSection({
  basePath,
  partner,
  inviteLink,
}: {
  basePath: string;
  partner: PartnerContext | null | undefined;
  inviteLink: string;
}) {

  const proName = partner?.partnerName || "Your Real Estate Pro";
  const office = partner?.officeName || "";

  const [emailChoice, setEmailChoice] = useState("intro_buy");
  const [smsChoice, setSmsChoice] = useState("sms_intro");
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [downloadingImage, setDownloadingImage] = useState(false);
  const [socialChoice, setSocialChoice] = useState("express_estimate");

  const socialRef = useRef<HTMLDivElement | null>(null);

  const valueProps = "Vetted, licensed, and insured pros — backed by a Project Manager + Home Guide.";

  const emailTemplates = useMemo(
    () =>
      [
        {
          id: "intro_buy",
          label: "Intro (Buyer)",
          subject: "A simple way to handle repairs + upgrades (with me in the loop)",
          body: `Hi {first_name},\n\nIf you need any repairs, upgrades, or prep work during your home journey, I’m using Homeworke to make it easy. ${valueProps}\n\nUse my invite link to connect and start a request:\n${inviteLink}\n\n— ${proName}${office ? `\n${office}` : ""}`,
        },
        {
          id: "listing_repairs",
          label: "Listing repairs (Seller)",
          subject: "Listing prep + repair coordination made simple",
          body: `Hi {first_name},\n\nFor listing prep, the key is speed + clarity. Homeworke helps us coordinate licensed/insured pros, scope, scheduling, and oversight — without the chaos.\n\nGet started here (connects you to my dashboard):\n${inviteLink}\n\n— ${proName}${office ? `\n${office}` : ""}`,
        },
        {
          id: "post_inspection",
          label: "Post-inspection (Upload report)",
          subject: "Next step: upload the inspection for an Express Estimate",
          body: `Hi {first_name},\n\nWant a fast, helpful repair-cost range from the inspection? Homeworke’s Express Estimate makes it easy.\n\nConnect here, then upload the report:\n${inviteLink}\n\n— ${proName}${office ? `\n${office}` : ""}`,
        },
      ],
    [inviteLink, office, proName]
  );

  const smsTemplates = useMemo(
    () =>
      [
        {
          id: "sms_intro",
          label: "Intro",
          body: `Hey! Here’s my Homeworke link — it makes repairs/renovations easy (${valueProps}). Start here: ${inviteLink}`,
        },
        {
          id: "sms_listing",
          label: "Listing prep",
          body: `For listing prep repairs, Homeworke helps us coordinate licensed/insured pros + scheduling. Here’s my link: ${inviteLink}`,
        },
        {
          id: "sms_inspection",
          label: "Upload inspection → estimate",
          body: `Upload the inspection and get an Express Estimate range here: ${inviteLink}`,
        },
      ],
    [inviteLink]
  );

  const chosenEmail = emailTemplates.find((t) => t.id === emailChoice) || emailTemplates[0];
  const chosenSms = smsTemplates.find((t) => t.id === smsChoice) || smsTemplates[0];

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyToast(`${label} copied`);
      window.setTimeout(() => setCopyToast(null), 1200);
    } catch {
      setCopyToast("Copy failed");
      window.setTimeout(() => setCopyToast(null), 1200);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!inviteLink) return;
      try {
        const url = await QRCode.toDataURL(inviteLink, { margin: 1, width: 220 });
        if (!cancelled) setQrDataUrl(url);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [inviteLink]);

  async function downloadSocialImage() {
    if (!socialRef.current) return;
    setDownloadingImage(true);
    try {
      // Higher pixel ratio to avoid blurry exports (aim for ~1080x1080+ effective)
      const dataUrl = await htmlToImage.toPng(socialRef.current, {
        cacheBust: true,
        pixelRatio: 4,
      });

      // iOS Safari often ignores the `download` attribute on data URLs.
      // Opening in a new tab reliably lets the user View/Share/Save.
      window.open(dataUrl, "_blank");
    } finally {
      setDownloadingImage(false);
    }
  }

  async function downloadFlyerPdf(kind: "general" | "listing" | "inspection") {
    const path =
      kind === "general" ? "/api/marketing/flyer" : kind === "listing" ? "/api/marketing/flyer-listing" : "/api/marketing/flyer-inspection";

    const url = new URL(path, window.location.origin);
    url.searchParams.set("name", proName);
    if (office) url.searchParams.set("office", office);
    if (inviteLink) url.searchParams.set("invite", inviteLink);
    if (qrDataUrl) url.searchParams.set("qr", qrDataUrl);
    window.open(url.toString(), "_blank");
  }

  return (
    <DashboardSection
      title="Marketing Tools"
      description="Copy/paste outreach + branded assets you can share to drive invites and Express Estimates."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <div className="text-sm font-semibold text-[var(--hw-ink)]">Email templates</div>
          <div className="mt-1 text-sm text-[var(--hw-muted)]">Pick a template, personalize, and send from your email.</div>

          <div className="mt-3 grid gap-2">
            <Label className="text-xs">Template</Label>
            <select
              className="h-10 w-full rounded-[var(--hw-radius-md)] border border-[var(--hw-line)] bg-white px-3 text-sm"
              value={emailChoice}
              onChange={(e) => setEmailChoice(e.target.value)}
            >
              {emailTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>

            <div className="mt-2 rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-3">
              <div className="text-xs font-semibold text-[var(--hw-ink)]">Subject</div>
              <div className="mt-1 text-xs text-[var(--hw-muted)] whitespace-pre-wrap">{chosenEmail.subject}</div>
              <div className="mt-3 text-xs font-semibold text-[var(--hw-ink)]">Body</div>
              <div className="mt-1 text-xs text-[var(--hw-muted)] whitespace-pre-wrap">{chosenEmail.body}</div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => copy(`${chosenEmail.subject}\n\n${chosenEmail.body}`, "Email")}
              >
                <Copy className="h-4 w-4" />
                Copy email
              </Button>
              <Link href={`${basePath}/clients`}>
                <Button size="sm" variant="secondary">View clients</Button>
              </Link>
            </div>
            {copyToast ? <div className="text-xs text-[var(--hw-muted)]">{copyToast}</div> : null}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-semibold text-[var(--hw-ink)]">Text / SMS templates</div>
          <div className="mt-1 text-sm text-[var(--hw-muted)]">Quick scripts you can paste into iMessage/SMS.</div>

          <div className="mt-3 grid gap-2">
            <Label className="text-xs">Template</Label>
            <select
              className="h-10 w-full rounded-[var(--hw-radius-md)] border border-[var(--hw-line)] bg-white px-3 text-sm"
              value={smsChoice}
              onChange={(e) => setSmsChoice(e.target.value)}
            >
              {smsTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>

            <div className="mt-2 rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-3">
              <div className="text-xs text-[var(--hw-muted)] whitespace-pre-wrap">{chosenSms.body}</div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => copy(chosenSms.body, "Text")}>
                <Copy className="h-4 w-4" />
                Copy text
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  try {
                    const text = chosenSms.body;
                    if (navigator.share) {
                      await navigator.share({ text, url: inviteLink || undefined });
                    } else {
                      await navigator.clipboard.writeText(text);
                      window.location.href = `sms:&body=${encodeURIComponent(text)}`;
                    }
                  } catch {
                    // ignore
                  }
                }}
                disabled={!inviteLink}
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-semibold text-[var(--hw-ink)]">Social post image</div>
          <div className="mt-1 text-sm text-[var(--hw-muted)]">Download a branded square image you can post or send.</div>

          <div className="mt-3 grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label className="text-xs">Layout</Label>
              <select
                className="h-9 rounded-[var(--hw-radius-md)] border border-[var(--hw-line)] bg-white px-3 text-sm"
                value={socialChoice}
                onChange={(e) => setSocialChoice(e.target.value)}
              >
                <option value="express_estimate">Express Estimate</option>
                <option value="listing_prep">Listing Prep Repairs</option>
                <option value="partner_cred">Partnered with Homeworke</option>
              </select>
            </div>

            <div className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-3">
              <div
                ref={socialRef}
                className="relative aspect-square w-full max-w-[420px] overflow-hidden rounded-[16px] border border-[rgba(229,57,53,.25)] bg-white"
              >
                <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[var(--hw-red)]/20 blur-[55px]" />
                <div aria-hidden className="pointer-events-none absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-[var(--hw-red)]/10 blur-[70px]" />

                <div className="relative flex h-full flex-col justify-between p-5">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Homeworke • Partner</div>
                    {socialChoice === "express_estimate" ? (
                      <>
                        <div className="mt-2 text-xl font-extrabold tracking-tight text-[var(--hw-ink)]">Instant Express Estimate</div>
                        <div className="mt-2 text-sm text-[var(--hw-muted)]">Fast repair-cost ranges from inspection reports.</div>
                      </>
                    ) : socialChoice === "listing_prep" ? (
                      <>
                        <div className="mt-2 text-xl font-extrabold tracking-tight text-[var(--hw-ink)]">Listing Prep Repairs</div>
                        <div className="mt-2 text-sm text-[var(--hw-muted)]">Coordinate licensed & insured pros — deadline-friendly.</div>
                      </>
                    ) : (
                      <>
                        <div className="mt-2 text-xl font-extrabold tracking-tight text-[var(--hw-ink)]">Partnered with Homeworke</div>
                        <div className="mt-2 text-sm text-[var(--hw-muted)]">All-in-one home services + dedicated support.</div>
                      </>
                    )}
                  </div>

                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[var(--hw-ink)] truncate">{proName}</div>
                      {office ? <div className="mt-0.5 text-xs text-[var(--hw-muted)] truncate">{office}</div> : null}
                      <div className="mt-2 text-xs text-[var(--hw-muted)]">Scan to connect</div>
                    </div>
                    {qrDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="QR" src={qrDataUrl} className="h-[84px] w-[84px] rounded-[12px] border border-[var(--hw-line)] bg-white p-1" />
                    ) : (
                      <div className="h-[84px] w-[84px] rounded-[12px] border border-[var(--hw-line)] bg-[var(--hw-soft)]" />
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={downloadSocialImage} disabled={downloadingImage}>
                  <ImageIcon className="h-4 w-4" />
                  {downloadingImage ? "Generating…" : "View / Save PNG"}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-semibold text-[var(--hw-ink)]">PDF flyers</div>
          <div className="mt-1 text-sm text-[var(--hw-muted)]">Download one-page PDFs you can email or print.</div>

          <div className="mt-3 grid gap-2">
            <Button size="sm" variant="secondary" onClick={() => downloadFlyerPdf("general")} disabled={!inviteLink}>
              General flyer
            </Button>
            <Button size="sm" variant="secondary" onClick={() => downloadFlyerPdf("listing")} disabled={!inviteLink}>
              Listing repairs
            </Button>
            <Button size="sm" variant="secondary" onClick={() => downloadFlyerPdf("inspection")} disabled={!inviteLink}>
              Inspection → estimate
            </Button>
            <div className="text-xs text-[var(--hw-muted)]">Includes your name, office, invite link, and QR.</div>
          </div>
        </Card>
      </div>
    </DashboardSection>
  );
}
