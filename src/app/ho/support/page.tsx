"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileQuestion,
  LifeBuoy,
  Paperclip,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { HO_NAV } from "@/components/ho/nav";
import { PortalShell } from "@/components/portal-shell";
import { Button, Card, CardHeader, Divider, Input, Label, Modal, Textarea } from "@/components/ui";
import { ensureDemoHomeownerSession } from "@/lib/demo";
import { cn } from "@/lib/utils";

type Session = {
  token: string;
  email?: string;
  partner?: null | { partnerId: string; partnerName: string };
};

type WorkOrder = {
  id: string;
  createdAt: string;
  serviceCategory: string;
  serviceSubcategory?: string;
  propertyAddress?: string;
  preferredDate?: string;
  preferredWindow?: string;
  status: string;
  updatedAt?: string;
};

type SupportTopic =
  | "Active job issue"
  | "Scheduling or access"
  | "Estimate or bid question"
  | "Platform issue"
  | "Account or billing"
  | "Property details"
  | "Suggestion"
  | "Other";

type Urgency = "normal" | "today" | "urgent";

type SupportTicket = {
  id: string;
  topic: SupportTopic;
  urgency: Urgency;
  subject: string;
  relatedWorkOrderId: string;
  createdAt: string;
  status: "Received" | "Reviewing" | "Waiting on homeowner";
};

const TICKET_STORAGE_KEY = "hw_ho_support_tickets_v1";

const TOPICS: SupportTopic[] = [
  "Active job issue",
  "Scheduling or access",
  "Estimate or bid question",
  "Platform issue",
  "Account or billing",
  "Property details",
  "Suggestion",
  "Other",
];

const URGENCY_OPTIONS: Array<{ id: Urgency; title: string; text: string }> = [
  { id: "normal", title: "Normal", text: "Suggestions, account questions, or non-blocking issues" },
  { id: "today", title: "Today", text: "Schedule, access, estimate, or platform issue blocking progress" },
  { id: "urgent", title: "Urgent", text: "Active work, safety, property access, or closing deadline risk" },
];

const HELP_LANES = [
  {
    title: "Active job issues",
    text: "Report access problems, scope changes, day-of timing, safety concerns, or anything blocking work in progress.",
    icon: ClipboardList,
    topic: "Active job issue",
    urgency: "today",
    cta: "Report job issue",
  },
  {
    title: "Platform issues",
    text: "Flag broken pages, upload problems, missing job details, payment trouble, or account access issues.",
    icon: CalendarClock,
    topic: "Platform issue",
    urgency: "today",
    cta: "Report platform issue",
  },
  {
    title: "Suggestions",
    text: "Share product ideas, workflow improvements, missing tools, or anything that would make Homeworke easier to use.",
    icon: Sparkles,
    topic: "Suggestion",
    urgency: "normal",
    cta: "Share suggestion",
  },
] satisfies Array<{
  title: string;
  text: string;
  icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
  topic: SupportTopic;
  urgency: Urgency;
  cta: string;
}>;

const EXPECTATIONS = [
  {
    title: "1. Triage",
    text: "Homeworke classifies the issue by topic, urgency, and related job so it lands in the right queue.",
  },
  {
    title: "2. Owner assigned",
    text: "Active-job issues go to operations review; platform issues go to product support; suggestions go to the product backlog.",
  },
  {
    title: "3. Resolution tracked",
    text: "The request stays visible here with its status so the homeowner can see what is open and what needs more detail.",
  },
] as const;

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem("hw_session_v1");
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function loadTickets(): SupportTicket[] {
  try {
    const raw = localStorage.getItem(TICKET_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SupportTicket[]) : [];
  } catch {
    return [];
  }
}

function saveTickets(tickets: SupportTicket[]) {
  try {
    localStorage.setItem(TICKET_STORAGE_KEY, JSON.stringify(tickets));
  } catch {}
}

function formatDate(value?: string) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function ticketId() {
  return `HW-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function urgencyTone(urgency: Urgency) {
  if (urgency === "urgent") return "border-red-200 bg-red-50 text-red-700";
  if (urgency === "today") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-[var(--hw-line)] bg-[var(--hw-soft)] text-[var(--hw-muted)]";
}

function getWorkOrderTitle(order: WorkOrder) {
  return order.serviceSubcategory ? `${order.serviceCategory} / ${order.serviceSubcategory}` : order.serviceCategory;
}

export default function HomeownerSupportPage() {
  const [session, setSession] = React.useState<Session | null>(null);
  const [workOrders, setWorkOrders] = React.useState<WorkOrder[]>([]);
  const [tickets, setTickets] = React.useState<SupportTicket[]>([]);
  const [requestOpen, setRequestOpen] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  const [topic, setTopic] = React.useState<SupportTopic>("Active job issue");
  const [urgency, setUrgency] = React.useState<Urgency>("today");
  const [relatedWorkOrderId, setRelatedWorkOrderId] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [contactEmail, setContactEmail] = React.useState("");
  const [attachmentNames, setAttachmentNames] = React.useState<string[]>([]);

  React.useEffect(() => {
    ensureDemoHomeownerSession();
    const loadedSession = loadSession();
    setSession(loadedSession);
    setTickets(loadTickets());

    if (!loadedSession?.token) return;

    (async () => {
      try {
        const res = await fetch(`/api/work-orders?token=${encodeURIComponent(loadedSession.token)}`);
        const json = (await res.json()) as { ok?: boolean; workOrders?: WorkOrder[] };
        if (res.ok && json.ok) setWorkOrders(json.workOrders || []);
      } catch {
        setWorkOrders([]);
      }
    })();
  }, []);

  React.useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const activeWorkOrders = React.useMemo(() => {
    return [...workOrders]
      .filter((order) => String(order.status || "").toLowerCase() !== "completed")
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
  }, [workOrders]);

  const selectedWorkOrder = React.useMemo(() => {
    return workOrders.find((order) => order.id === relatedWorkOrderId) || null;
  }, [relatedWorkOrderId, workOrders]);

  const canSend = subject.trim().length >= 4 && message.trim().length >= 12;
  function resetRequestForm() {
    setTopic("Active job issue");
    setUrgency("today");
    setRelatedWorkOrderId(activeWorkOrders[0]?.id || "");
    setSubject("");
    setMessage("");
    setContactEmail(session?.email || "");
    setAttachmentNames([]);
  }

  function openRequestForm(nextTopic?: SupportTopic, nextUrgency?: Urgency) {
    resetRequestForm();
    if (nextTopic) setTopic(nextTopic);
    if (nextUrgency) setUrgency(nextUrgency);
    setRequestOpen(true);
  }

  function submitRequest() {
    const nextTicket: SupportTicket = {
      id: ticketId(),
      topic,
      urgency,
      subject: subject.trim(),
      relatedWorkOrderId,
      createdAt: new Date().toISOString(),
      status: urgency === "urgent" ? "Reviewing" : "Received",
    };
    const nextTickets = [nextTicket, ...tickets].slice(0, 6);
    setTickets(nextTickets);
    saveTickets(nextTickets);
    setRequestOpen(false);
    setToast(`${nextTicket.id} support request created`);
  }

  return (
    <PortalShell role="HO" title="Homeowner" nav={[...HO_NAV]} hideHeading>
      <div className="grid gap-6">
        <section className="rounded-[var(--hw-radius-lg)] border border-[rgba(229,57,53,.16)] bg-[linear-gradient(135deg,#fff_0%,#fff_58%,rgba(229,57,53,.06)_100%)] p-5 shadow-[var(--hw-shadow)] sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-center">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(229,57,53,.18)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--hw-red)] shadow-sm">
                <LifeBuoy size={15} aria-hidden />
                Homeowner support
              </div>
              <h1 className="mt-4 max-w-3xl text-3xl font-extrabold tracking-tight text-[var(--hw-ink)] sm:text-4xl">
                Get help with a job, account issue, or platform problem.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--hw-muted)]">
                Create a support request for active work, scheduling, estimates, billing, property details, technical issues, or ideas that would make Homeworke better.
              </p>
            </div>

            <div className="rounded-[var(--hw-radius-lg)] border border-white/80 bg-white p-4 shadow-[0_12px_34px_rgba(17,24,39,.08)]">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(229,57,53,.10)] text-[var(--hw-red)]">
                  <ShieldCheck size={20} aria-hidden />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[var(--hw-ink)]">Your support path</div>
                  <div className="mt-1 text-sm leading-6 text-[var(--hw-muted)]">
                    Active work gets priority review. Product issues and suggestions are routed by topic.
                  </div>
                </div>
              </div>
              <Button className="mt-4 w-full" onClick={() => openRequestForm("Active job issue", "today")}>
                Start support request
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2">
            <CardHeader
              title="Support categories"
              subtitle="Choose the kind of issue so Homeworke can route it with the right context."
              action={
                <Button variant="secondary" size="sm" onClick={() => openRequestForm("Other", "normal")}>
                  New request
                </Button>
              }
            />

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {HELP_LANES.map((lane) => {
                const Icon = lane.icon;
                return (
                  <button
                    key={lane.title}
                    type="button"
                    onClick={() => openRequestForm(lane.topic, lane.urgency)}
                    className="group rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[rgba(229,57,53,.28)] hover:shadow-[0_14px_34px_rgba(17,24,39,.10)]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--hw-soft)] text-[var(--hw-red)] transition group-hover:bg-[rgba(229,57,53,.10)]">
                      <Icon size={20} aria-hidden />
                    </div>
                    <div className="mt-4 text-sm font-semibold text-[var(--hw-ink)]">{lane.title}</div>
                    <div className="mt-2 min-h-[64px] text-sm leading-6 text-[var(--hw-muted)]">{lane.text}</div>
                    <div className="mt-4 text-xs font-semibold text-[var(--hw-red)]">{lane.cta}</div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Active requests</div>
                <div className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--hw-ink)]">{tickets.length}</div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(229,57,53,.10)] text-[var(--hw-red)]">
                <Clock3 size={20} aria-hidden />
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {tickets.length ? (
                tickets.slice(0, 3).map((ticket) => (
                  <div key={ticket.id} className="rounded-[var(--hw-radius-sm)] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[var(--hw-ink)]">{ticket.id}</div>
                      <span className={cn("rounded-full border px-2 py-1 text-[11px] font-semibold", urgencyTone(ticket.urgency))}>
                        {ticket.status}
                      </span>
                    </div>
                    <div className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--hw-muted)]">{ticket.subject}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-[var(--hw-radius-sm)] border border-dashed border-[var(--hw-line)] bg-[var(--hw-soft)] p-4 text-sm leading-6 text-[var(--hw-muted)]">
                  No open support requests.
                </div>
              )}
            </div>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <Card className="p-5">
            <CardHeader title="Active project support" subtitle="Attach support to the job so the request includes the right context immediately." />
            <div className="mt-5 grid gap-3">
              {activeWorkOrders.length ? (
                activeWorkOrders.slice(0, 4).map((order) => (
                  <div
                    key={order.id}
                    className="grid gap-4 rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="truncate text-sm font-semibold text-[var(--hw-ink)]">{getWorkOrderTitle(order)}</div>
                        <span className="rounded-full border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.08)] px-2 py-1 text-[11px] font-semibold text-[var(--hw-red)]">
                          {order.status}
                        </span>
                      </div>
                      <div className="mt-2 text-sm leading-6 text-[var(--hw-muted)]">{order.propertyAddress || "Property pending"}</div>
                      <div className="mt-1 text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
                        {formatDate(order.preferredDate)}
                        {order.preferredWindow ? ` / ${order.preferredWindow}` : ""}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <Link href="/ho/jobs">
                        <Button variant="secondary" size="sm">
                          View job
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        onClick={() => {
                          openRequestForm("Active job issue", "today");
                          setRelatedWorkOrderId(order.id);
                          setSubject(`${getWorkOrderTitle(order)} support`);
                        }}
                      >
                        Get help
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[var(--hw-radius-lg)] border border-dashed border-[var(--hw-line)] bg-[var(--hw-soft)] p-6">
                  <div className="text-sm font-semibold text-[var(--hw-ink)]">No active jobs yet</div>
                  <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">
                    Once a request is submitted, this page will connect support directly to the active job.
                  </div>
                  <Link href="/ho/dashboard" className="mt-4 inline-block">
                    <Button variant="secondary">Start a request</Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>

          <div className="grid gap-4">
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(229,57,53,.10)] text-[var(--hw-red)]">
                  <Phone size={19} aria-hidden />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[var(--hw-ink)]">Urgent active-job help</div>
                  <div className="mt-2 text-sm leading-6 text-[var(--hw-muted)]">Call when access, safety, day-of timing, or closing deadlines are at risk.</div>
                  <a href="tel:+13125550100" className="mt-4 inline-block">
                    <Button variant="secondary" size="sm">
                      Call support
                    </Button>
                  </a>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-5 shadow-[var(--hw-shadow)]">
          <div className="grid gap-4 lg:grid-cols-[280px_1fr] lg:items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">What happens next</div>
              <div className="mt-2 text-lg font-extrabold text-[var(--hw-ink)]">A request becomes a tracked support case.</div>
              <div className="mt-2 text-sm leading-6 text-[var(--hw-muted)]">
                Homeowners should know exactly why they are submitting a request and how it will be handled.
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {EXPECTATIONS.map((item) => (
                <div key={item.title} className="rounded-[var(--hw-radius-sm)] bg-[var(--hw-soft)] p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="mt-0.5 shrink-0 text-[var(--hw-red)]" size={18} aria-hidden />
                    <div className="text-sm font-semibold text-[var(--hw-ink)]">{item.title}</div>
                  </div>
                  <div className="mt-2 text-sm leading-6 text-[var(--hw-muted)]">{item.text}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <Modal
        open={requestOpen}
        title="New homeowner support request"
        onClose={() => setRequestOpen(false)}
        mobilePlacement="center"
      >
        <div className="grid gap-4">
          <div className="rounded-[var(--hw-radius-sm)] border border-[rgba(229,57,53,.16)] bg-[rgba(229,57,53,.05)] p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 shrink-0 text-[var(--hw-red)]" size={18} aria-hidden />
              <div className="text-sm leading-6 text-[var(--hw-ink)]">
                Active-job, access, schedule, and safety issues should be tied to the related job whenever possible.
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label className="text-xs">Topic</Label>
              <select
                className="h-11 w-full rounded-[var(--hw-radius-sm)] border border-[var(--hw-line)] bg-white px-3.5 text-sm outline-none transition-all duration-150 hover:border-[color-mix(in_srgb,var(--hw-line)_60%,var(--hw-ink))] focus:border-[rgba(229,57,53,.5)] focus:ring-2 focus:ring-[rgba(229,57,53,.12)]"
                value={topic}
                onChange={(event) => setTopic(event.target.value as SupportTopic)}
              >
                {TOPICS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label className="text-xs">Related job</Label>
              <select
                className="h-11 w-full rounded-[var(--hw-radius-sm)] border border-[var(--hw-line)] bg-white px-3.5 text-sm outline-none transition-all duration-150 hover:border-[color-mix(in_srgb,var(--hw-line)_60%,var(--hw-ink))] focus:border-[rgba(229,57,53,.5)] focus:ring-2 focus:ring-[rgba(229,57,53,.12)]"
                value={relatedWorkOrderId}
                onChange={(event) => setRelatedWorkOrderId(event.target.value)}
              >
                <option value="">Not tied to a job</option>
                {workOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {getWorkOrderTitle(order)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="text-xs">Urgency</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {URGENCY_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setUrgency(option.id)}
                  className={cn(
                    "rounded-[var(--hw-radius-sm)] border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(229,57,53,.24)]",
                    urgency === option.id
                      ? "border-[rgba(229,57,53,.45)] bg-[rgba(229,57,53,.08)] shadow-sm"
                      : "border-[var(--hw-line)] bg-white hover:bg-[var(--hw-soft)]"
                  )}
                >
                  <div className="text-sm font-semibold text-[var(--hw-ink)]">{option.title}</div>
                  <div className="mt-1 text-xs leading-5 text-[var(--hw-muted)]">{option.text}</div>
                </button>
              ))}
            </div>
          </div>

          {selectedWorkOrder ? (
            <div className="rounded-[var(--hw-radius-sm)] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Attached context</div>
              <div className="mt-1 text-sm font-semibold text-[var(--hw-ink)]">{getWorkOrderTitle(selectedWorkOrder)}</div>
              <div className="mt-1 text-sm text-[var(--hw-muted)]">{selectedWorkOrder.propertyAddress || "Property pending"}</div>
            </div>
          ) : null}

          <div className="grid gap-2">
            <Label className="text-xs">Subject</Label>
            <Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Short summary" />
          </div>

          <div className="grid gap-2">
            <Label className="text-xs">Details</Label>
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Tell us what happened, what you need, and any timing constraints."
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label className="text-xs">Reply-to email</Label>
              <Input value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} placeholder="you@email.com" />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">Attachments</Label>
              <Input
                type="file"
                multiple
                accept="image/*,application/pdf,video/*"
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  setAttachmentNames(files.map((file) => file.name));
                }}
              />
            </div>
          </div>

          {attachmentNames.length ? (
            <div className="flex items-start gap-2 rounded-[var(--hw-radius-sm)] bg-[var(--hw-soft)] p-3 text-xs leading-5 text-[var(--hw-muted)]">
              <Paperclip className="mt-0.5 shrink-0" size={15} aria-hidden />
              <span>{attachmentNames.join(", ")}</span>
            </div>
          ) : null}

          <Divider />

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs leading-5 text-[var(--hw-muted)]">
              <FileQuestion size={15} aria-hidden />
              <span>Include screenshots, PDFs, photos, or short videos when they help explain the issue.</span>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRequestOpen(false)}>
                Cancel
              </Button>
              <Button disabled={!canSend} onClick={submitRequest}>
                Send request
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {toast ? (
        <div className="fixed bottom-5 right-5 z-50 w-[340px] max-w-[calc(100vw-40px)]">
          <div className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,.1)]">
            <div className="text-sm font-semibold text-[var(--hw-ink)]">{toast}</div>
            <div className="mt-1 text-sm text-[var(--hw-muted)]">The request is now visible in your active support list.</div>
          </div>
        </div>
      ) : null}
    </PortalShell>
  );
}
