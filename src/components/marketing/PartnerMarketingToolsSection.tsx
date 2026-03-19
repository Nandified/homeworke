"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";
import { ChevronDown, Copy, Image as ImageIcon, Share2 } from "lucide-react";

import * as htmlToImage from "html-to-image";
import QRCode from "qrcode";

import type { PartnerContext } from "@/lib/partner-context";
import { Button, Card, Label } from "@/components/ui";
import { DashboardSection } from "@/components/dashboard/DashboardSection";

type PickerOption = { id: string; label: string; sublabel?: string };

function Picker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: PickerOption[];
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const active = options.find((o) => o.id === value) || options[0];

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const el = wrapRef.current;
      if (!el) return;
      if (el.contains(e.target as Node)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={wrapRef} className="grid gap-2">
      <Label className="text-xs">{label}</Label>
      <div className="relative">
        {/* Compact control (keeps card layout unchanged) */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="group flex h-10 w-full items-center justify-between gap-3 rounded-[999px] border border-[var(--hw-line)] bg-gradient-to-b from-white to-[var(--hw-soft)] px-4 text-left shadow-[0_10px_22px_rgba(17,24,39,.06)] outline-none transition hover:shadow-[0_12px_26px_rgba(17,24,39,.08)] focus:border-[rgba(229,57,53,.35)] focus:ring-4 focus:ring-[rgba(229,57,53,.12)]"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="min-w-0 truncate text-sm font-medium text-[var(--hw-ink)]">{active?.label}</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--hw-line)] bg-white/80 text-[var(--hw-muted)] shadow-sm transition group-hover:bg-white">
            <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
          </span>
        </button>

        {open ? (
          <div
            role="listbox"
            className="absolute z-20 mt-2 w-full overflow-hidden rounded-[var(--hw-radius-lg)] border border-[rgba(229,57,53,.18)] bg-white shadow-[0_14px_40px_rgba(17,24,39,.12)]"
          >
            <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[var(--hw-red)]/10 blur-[40px]" />
            <div className="relative max-h-64 overflow-auto p-1">
              {options.map((o) => {
                const selected = o.id === value;
                return (
                  <button
                    key={o.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onChange(o.id);
                      setOpen(false);
                    }}
                    className={`w-full rounded-[12px] px-3 py-2 text-left transition ${
                      selected
                        ? "bg-[rgba(229,57,53,.08)] text-[var(--hw-ink)]"
                        : "hover:bg-[var(--hw-soft)] text-[var(--hw-ink)]"
                    }`}
                  >
                    <div className="truncate text-sm font-medium">{o.label}</div>
                    {o.sublabel ? <div className="mt-0.5 truncate text-xs text-[var(--hw-muted)]">{o.sublabel}</div> : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

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
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
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

  async function copy(text: string, _label: string, key?: string) {
    try {
      await navigator.clipboard.writeText(text);
      if (key) setCopiedKey(key);
      window.setTimeout(() => {
        if (key) setCopiedKey((v) => (v === key ? null : v));
      }, 1200);
    } catch {
      // best-effort; no toast needed because the button animates on success
      window.setTimeout(() => {
        if (key) setCopiedKey((v) => (v === key ? null : v));
      }, 1200);
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

    // IMPORTANT: open the popup synchronously (before any await),
    // otherwise Safari will block it and the button will appear to "glitch".
    const popup = window.open("", "_blank");
    if (popup) {
      popup.document.write(
        `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1" /></head><body style="margin:0;padding:24px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#fff;"><div>Generating image…</div></body></html>`
      );
      popup.document.close();
    }

    setDownloadingImage(true);
    try {
      // Higher pixel ratio to avoid blurry exports (aim for ~1080x1080+ effective)
      const dataUrl = await htmlToImage.toPng(socialRef.current, {
        cacheBust: true,
        pixelRatio: 4,
      });

      // Best effort: on desktop browsers, attempt a real download.
      // (iOS Safari generally ignores download= and is better with a new tab.)
      try {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = "homeworke-social.png";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch {
        // ignore
      }

      // Always render into the popup if we got one, so the user can right-click / long-press.
      if (popup) {
        popup.document.open();
        popup.document.write(
          `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1" /></head><body style="margin:0;display:flex;align-items:center;justify-content:center;background:#fff;"><img src="${dataUrl}" style="max-width:100%;height:auto;" /></body></html>`
        );
        popup.document.close();
      } else {
        // Fallback: navigate current tab
        window.location.href = dataUrl;
      }
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
            <Picker
              label="Template"
              value={emailChoice}
              onChange={setEmailChoice}
              options={emailTemplates.map((t) => ({
                id: t.id,
                label: t.label,
                sublabel: t.subject,
              }))}
            />

            <div className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-semibold text-[var(--hw-ink)]">Subject</div>
                <Button size="sm" variant="secondary" onClick={() => copy(chosenEmail.subject, "Subject", "email_subject")}>
                  {copiedKey === "email_subject" ? (
                    "Copied"
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <div className="mt-1 text-xs text-[var(--hw-muted)] whitespace-pre-wrap">{chosenEmail.subject}</div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="text-xs font-semibold text-[var(--hw-ink)]">Body</div>
                <Button size="sm" variant="secondary" onClick={() => copy(chosenEmail.body, "Body", "email_body")}>
                  {copiedKey === "email_body" ? (
                    "Copied"
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <div className="mt-1 text-xs text-[var(--hw-muted)] whitespace-pre-wrap">{chosenEmail.body}</div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Link href={`${basePath}/clients`}>
                <Button size="sm" variant="secondary">View clients</Button>
              </Link>
            </div>
            {/* (no copy toast; button state indicates success) */}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-semibold text-[var(--hw-ink)]">Text / SMS templates</div>
          <div className="mt-1 text-sm text-[var(--hw-muted)]">Quick scripts you can paste into iMessage/SMS.</div>

          <div className="mt-3 grid gap-2">
            <Picker
              label="Template"
              value={smsChoice}
              onChange={setSmsChoice}
              options={smsTemplates.map((t) => ({
                id: t.id,
                label: t.label,
                sublabel: t.body.slice(0, 80) + (t.body.length > 80 ? "…" : ""),
              }))}
            />

            <div className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-3">
              <div className="text-xs text-[var(--hw-muted)] whitespace-pre-wrap">{chosenSms.body}</div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => copy(chosenSms.body, "Text", "sms_text")}>
                {copiedKey === "sms_text" ? (
                  "Copied"
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
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
          <div className="text-sm font-semibold text-[var(--hw-ink)]">Social Media Posts</div>
          <div className="mt-1 text-sm text-[var(--hw-muted)]">Save a branded square image you can post or send.</div>

          <div className="mt-3 grid gap-2">
            <Picker
              label="Layout"
              value={socialChoice}
              onChange={setSocialChoice}
              options={[
                { id: "express_estimate", label: "Express Estimate", sublabel: "Fast repair-cost ranges from inspection reports" },
                { id: "listing_prep", label: "Listing Prep Repairs", sublabel: "Deadline-friendly repair coordination" },
                { id: "partner_cred", label: "Partnered with Homeworke", sublabel: "Credibility + value prop" },
              ]}
            />

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
                  {downloadingImage ? "Generating…" : "Save PNG"}
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
