"use client";

import * as React from "react";

import { PRO_NAV } from "@/components/pro/nav";
import { PortalShell } from "@/components/portal-shell";
import { Button, Card, CardHeader, Divider, Input, Label, Modal, Textarea } from "@/components/ui";

type SupportTopic =
  | "Account & login"
  | "Clients & invites"
  | "Express Estimate"
  | "Jobs"
  | "Marketing tools"
  | "Billing & payments"
  | "Bug / broken"
  | "Feature request"
  | "Other";

const TOPICS: SupportTopic[] = [
  "Account & login",
  "Clients & invites",
  "Express Estimate",
  "Jobs",
  "Marketing tools",
  "Billing & payments",
  "Bug / broken",
  "Feature request",
  "Other",
];

export default function Page() {
  const [open, setOpen] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  const [topic, setTopic] = React.useState<SupportTopic>("Bug / broken");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [contactEmail, setContactEmail] = React.useState("");
  const [attachments, setAttachments] = React.useState<File[]>([]);

  React.useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(t);
  }, [toast]);

  const canSend = subject.trim().length > 2 && message.trim().length > 8;

  return (
    <PortalShell
      role="PRO"
      title="Support"
      portalTitle="Real Estate Pro"
      nav={PRO_NAV}
      hideHeading
    >
      <div className="grid gap-4">
        {/* QUICK HELP */}
        <Card className="p-5 sm:p-6">
          <CardHeader
            title="Support"
            subtitle="Get help fast — report an issue, request a feature, or contact our team."
            action={
              <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
                New support request
              </Button>
            }
          />

          <Divider className="my-5" />

          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="p-4 shadow-none hover:shadow-none">
              <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Email</div>
              <div className="mt-2 text-sm font-semibold text-[var(--hw-ink)]">support@homeworke.com</div>
              <div className="mt-3">
                <a href="mailto:support@homeworke.com" className="inline-block">
                  <Button size="sm" variant="secondary">
                    Email us
                  </Button>
                </a>
              </div>
            </Card>

            <Card className="p-4 shadow-none hover:shadow-none">
              <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Phone</div>
              <div className="mt-2 text-sm font-semibold text-[var(--hw-ink)]">Call us</div>
              <div className="mt-1 text-sm text-[var(--hw-muted)]">For urgent issues during a live job.</div>
              <div className="mt-3">
                <a href="tel:+13125550100" className="inline-block">
                  <Button size="sm" variant="secondary">
                    Call support
                  </Button>
                </a>
              </div>
            </Card>

            <Card className="p-4 shadow-none hover:shadow-none">
              <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">What to include</div>
              <div className="mt-2 text-sm text-[var(--hw-muted)] leading-7">
                Screenshots, the page URL, and what you expected vs what happened.
              </div>
            </Card>
          </div>
        </Card>

        {/* FAQ */}
        <Card className="p-5 sm:p-6">
          <div className="mt-1 grid gap-3">
            <details className="rounded-[16px] border border-[var(--hw-line)] bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold text-[var(--hw-ink)]">Something isn’t saving</summary>
              <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">
                Try a hard refresh, then re-try in an incognito window. If it still fails, submit a support request with a screenshot.
              </div>
            </details>

            <details className="rounded-[16px] border border-[var(--hw-line)] bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold text-[var(--hw-ink)]">I can’t download an asset (PNG/PDF)</summary>
              <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">
                On Safari, popups can be blocked. Allow popups for this site and try again. If it still fails, attach a screen recording.
              </div>
            </details>

            <details className="rounded-[16px] border border-[var(--hw-line)] bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold text-[var(--hw-ink)]">My invite link isn’t working</summary>
              <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">
                Double-check you’re using the PRO/partner link (not a dashboard URL). Share what link you used in the support form.
              </div>
            </details>
          </div>
        </Card>

        {/* STATUS / ROADMAP */}
        <Card className="p-5 sm:p-6">
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
              Report a bug
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setTopic("Feature request");
                setOpen(true);
              }}
            >
              Request a feature
            </Button>
          </div>
        </Card>
      </div>

      <Modal
        open={open}
        title="New support request"
        onClose={() => {
          setOpen(false);
        }}
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label className="text-xs">Topic</Label>
            <select
              className="h-11 w-full rounded-[var(--hw-radius-sm)] border border-[var(--hw-line)] bg-white px-3.5 text-sm outline-none transition-all duration-150 hover:border-[color-mix(in_srgb,var(--hw-line)_60%,var(--hw-ink))] focus:border-[rgba(229,57,53,.5)] focus:ring-2 focus:ring-[rgba(229,57,53,.12)]"
              value={topic}
              onChange={(e) => setTopic(e.target.value as SupportTopic)}
            >
              {TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label className="text-xs">Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Short summary" />
          </div>

          <div className="grid gap-2">
            <Label className="text-xs">Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What happened, what you expected, and how we can reproduce it…"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-xs">Reply-to email (optional)</Label>
            <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="you@company.com" />
            <div className="text-xs text-[var(--hw-muted)]">
              If blank, we’ll reply to the email on your account once wiring is complete.
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="text-xs">Attachments (optional)</Label>
            <Input
              type="file"
              multiple
              accept="image/*,application/pdf,video/*"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                setAttachments(files);
              }}
            />
            {attachments.length ? (
              <div className="text-xs text-[var(--hw-muted)]">Attached: {attachments.map((f) => f.name).join(", ")}</div>
            ) : null}
          </div>

          <Divider className="my-1" />

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              disabled={!canSend}
              onClick={() => {
                // Phase 1 UI: wiring next.
                setOpen(false);
                setSubject("");
                setMessage("");
                setAttachments([]);
                setToast("Support request sent (stub)");
              }}
            >
              Send
            </Button>
          </div>
        </div>
      </Modal>

      {toast ? (
        <div className="fixed bottom-5 right-5 z-50 w-[340px] max-w-[calc(100vw-40px)]">
          <div className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,.1)]">
            <div className="text-sm font-semibold text-[var(--hw-ink)]">{toast}</div>
          </div>
        </div>
      ) : null}
    </PortalShell>
  );
}
