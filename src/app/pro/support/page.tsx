"use client";

import * as React from "react";

import { PRO_NAV } from "@/components/pro/nav";
import { PortalShell } from "@/components/portal-shell";
import { Button, Card, CardHeader, Divider, Input, Label, Modal, Textarea } from "@/components/ui";

type SupportTopic =
  | "Instant Estimate / Negotiation Packet"
  | "Client invite + sharing"
  | "Jobs + scheduling"
  | "Account + team"
  | "Billing + payments"
  | "Report a bug"
  | "Request a feature"
  | "Other";

const TOPICS: SupportTopic[] = [
  "Instant Estimate / Negotiation Packet",
  "Client invite + sharing",
  "Jobs + scheduling",
  "Account + team",
  "Billing + payments",
  "Report a bug",
  "Request a feature",
  "Other",
];

type SupportIntent = {
  title: string;
  description: string;
  topic: SupportTopic;
  subjectPreset: string;
};

const INTENTS: SupportIntent[] = [
  {
    title: "Instant Estimate / Packet",
    description: "Upload issues, line items look off, revisions, or share/download questions.",
    topic: "Instant Estimate / Negotiation Packet",
    subjectPreset: "Instant Estimate help",
  },
  {
    title: "Client invite + sharing",
    description: "Client can’t access, resend link, wrong partner attached, or permissions.",
    topic: "Client invite + sharing",
    subjectPreset: "Client invite / access issue",
  },
  {
    title: "Jobs + scheduling",
    description: "Status stuck, schedule changes, deadlines, or escalation.",
    topic: "Jobs + scheduling",
    subjectPreset: "Job status / scheduling help",
  },
  {
    title: "Account + team",
    description: "Office invites, roles, seats, login, or access issues.",
    topic: "Account + team",
    subjectPreset: "Account / team access",
  },
  {
    title: "Billing + payments",
    description: "Invoices, receipts, payouts, or billing questions.",
    topic: "Billing + payments",
    subjectPreset: "Billing / payments question",
  },
  {
    title: "Report a bug",
    description: "Something’s broken or not behaving as expected.",
    topic: "Report a bug",
    subjectPreset: "Bug report",
  },
];

export default function Page() {
  const [open, setOpen] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  const [topic, setTopic] = React.useState<SupportTopic>("Report a bug");
  const [urgent, setUrgent] = React.useState(false);
  const [relatedTo, setRelatedTo] = React.useState<"None" | "Client" | "Property" | "Job" | "Estimate">("None");
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

  function startRequest(intent?: SupportIntent) {
    if (intent) {
      setTopic(intent.topic);
      setSubject((s) => (s.trim().length ? s : intent.subjectPreset));
    }
    setOpen(true);
  }

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
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => startRequest()}>
                  Start a support request
                </Button>
              </div>
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

        {/* GUIDED HELP */}
        <Card className="p-5 sm:p-6">
          <div className="grid gap-2">
            <div className="text-sm font-semibold text-[var(--hw-ink)]">What are you trying to do?</div>
            <div className="text-sm text-[var(--hw-muted)]">Pick a category and we’ll pre-fill the request so you can move fast.</div>
          </div>

          <Divider className="my-5" />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {INTENTS.map((intent) => (
              <button
                key={intent.title}
                type="button"
                onClick={() => startRequest(intent)}
                className="text-left"
              >
                <Card className="h-full p-4 transition-all hover:-translate-y-[1px] hover:shadow-[0_10px_30px_rgba(0,0,0,.08)]">
                  <div className="text-sm font-semibold text-[var(--hw-ink)]">{intent.title}</div>
                  <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">{intent.description}</div>
                  <div className="mt-3 text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">{intent.topic}</div>
                </Card>
              </button>
            ))}
          </div>

          <Divider className="my-5" />

          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="p-4 shadow-none hover:shadow-none">
              <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Priority support</div>
              <div className="mt-2 text-sm text-[var(--hw-muted)] leading-7">
                If you’re in an active transaction or on a closing deadline, mark the request as <span className="font-semibold text-[var(--hw-ink)]">Urgent</span>.
              </div>
            </Card>
            <Card className="p-4 shadow-none hover:shadow-none">
              <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Typical response</div>
              <div className="mt-2 text-sm text-[var(--hw-muted)] leading-7">Fast during business hours. Urgent requests are prioritized.</div>
            </Card>
            <Card className="p-4 shadow-none hover:shadow-none">
              <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Quick actions</div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setTopic("Request a feature");
                    setSubject("Product improvement request");
                    startRequest();
                  }}
                >
                  Suggest an improvement
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setTopic("Other");
                    setSubject("Request a walkthrough / training");
                    startRequest();
                  }}
                >
                  Request training
                </Button>
              </div>
            </Card>
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

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label className="text-xs">Urgency</Label>
              <label className="flex h-11 items-center gap-3 rounded-[var(--hw-radius-sm)] border border-[var(--hw-line)] bg-white px-3.5 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={urgent}
                  onChange={(e) => setUrgent(e.target.checked)}
                />
                <span className="text-[var(--hw-ink)]">Mark as urgent (closing / active job)</span>
              </label>
            </div>

            <div className="grid gap-2">
              <Label className="text-xs">Related to (optional)</Label>
              <select
                className="h-11 w-full rounded-[var(--hw-radius-sm)] border border-[var(--hw-line)] bg-white px-3.5 text-sm outline-none transition-all duration-150 hover:border-[color-mix(in_srgb,var(--hw-line)_60%,var(--hw-ink))] focus:border-[rgba(229,57,53,.5)] focus:ring-2 focus:ring-[rgba(229,57,53,.12)]"
                value={relatedTo}
                onChange={(e) => setRelatedTo(e.target.value as "None" | "Client" | "Property" | "Job" | "Estimate")}
              >
                {(["None", "Client", "Property", "Job", "Estimate"] as const).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
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
                setUrgent(false);
                setRelatedTo("None");
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
