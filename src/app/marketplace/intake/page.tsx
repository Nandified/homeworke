"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { loadPartner } from "@/lib/partner-context";

import {
  Button,
  Card,
  Checkbox,
  Chip,
  Container,
  Input,
  Label,
  Pill,
  RadioCardGroup,
  Textarea,
} from "@/components/ui";

import spec from "@/../spec/intake_stepper_opus.json";
import taxonomy from "@/content/homeworke_services_taxonomy.json";

type StepKey = (typeof spec.steps)[number]["key"];

type IntakeDraft = {
  service_category: string;
  service_subcategory: string;
  issue_description: string;
  urgency_level: "Normal" | "Soon" | "Urgent";
  property_address: string;
  property_type: string;
  access_instructions: string;
  preferred_date: string;
  preferred_time_window: "Morning" | "Midday" | "Afternoon";
  alternate_date: string;
  contact_method: "Text" | "Email";
  share_with_partner: boolean;
};

const SERVICE_OPTIONS = taxonomy.trades as string[];

function draftKey() {
  return "hw_intake_draft_v1";
}

function loadDraft(): IntakeDraft {
  try {
    const raw = localStorage.getItem(draftKey());
    if (raw) return JSON.parse(raw) as IntakeDraft;
  } catch {
    // ignore
  }
  return {
    service_category: "General",
    service_subcategory: "",
    issue_description: "",
    urgency_level: "Normal",
    property_address: "",
    property_type: "",
    access_instructions: "",
    preferred_date: "",
    preferred_time_window: "Morning",
    alternate_date: "",
    contact_method: "Text",
    share_with_partner: true,
  };
}

function saveDraft(d: IntakeDraft) {
  localStorage.setItem(draftKey(), JSON.stringify(d));
}

export default function Page() {
  const router = useRouter();
  const steps = spec.steps;

  const [step, setStep] = useState<StepKey>("select_service");
  const [draft, setDraft] = useState<IntakeDraft>(() => {
    const d = loadDraft();
    try {
      const partner = loadPartner();
      if (partner) {
        // Partner-origin funnel defaults sharing ON.
        d.share_with_partner = true;
      }
    } catch {}
    return d;
  });

  // Prefill from query params (used by AI intake card)
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const fromAI = sp.get("fromAI") === "1";
      const trade = sp.get("trade") || "";
      const subcategory = sp.get("subcategory") || "";
      const issue = sp.get("aiSummary") || sp.get("issue") || "";
      const qnaRaw = sp.get("qna") || "";

      let qnaText = "";
      try {
        const qna = qnaRaw ? (JSON.parse(qnaRaw) as Array<{ question: string; answer: string }>) : [];
        if (Array.isArray(qna) && qna.length) {
          qnaText =
            "\n\nDetails from chat:\n" +
            qna
              .filter((x) => x && (x.question || x.answer))
              .map((x) => `- ${String(x.question || "").trim()} ${String(x.answer || "").trim()}`.trim())
              .join("\n");
        }
      } catch {
        // ignore qna parse
      }

      if (trade || subcategory || issue || qnaText) {
        setDraft((prev) => {
          const next: IntakeDraft = {
            ...prev,
            service_category: trade || prev.service_category,
            service_subcategory: subcategory || prev.service_subcategory,
            issue_description: (issue || prev.issue_description) + (qnaText || ""),
            // property address is confirmed later in the flow; ZIP is used only for pricing/routing.
          };
          saveDraft(next);
          return next;
        });
      }

      // Concierge chat already captured service + details; start them at property/scheduling.
      if (fromAI) {
        setStep("property_details");
      }
    } catch {
      // ignore
    }
  }, []);

  const idx = useMemo(() => steps.findIndex((s) => s.key === step), [steps, step]);

  function update(patch: Partial<IntakeDraft>) {
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      saveDraft(next);
      return next;
    });
  }

  function next() {
    const nextIdx = Math.min(steps.length - 1, idx + 1);
    setStep(steps[nextIdx].key as StepKey);
  }

  function back() {
    const prevIdx = Math.max(0, idx - 1);
    setStep(steps[prevIdx].key as StepKey);
  }

  function submit() {
    // v1: map intake to provider suggestions. Later: create a real WorkOrder.
    router.push(`/marketplace/providers?service=${encodeURIComponent(draft.service_category)}&issue=${encodeURIComponent(draft.issue_description || "")}`);
  }

  const current = steps[idx];

  const fromAI = (() => {
    try {
      const sp = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
      return sp.get("fromAI") === "1";
    } catch {
      return false;
    }
  })();

  const Shell = ({ children }: { children: React.ReactNode }) => {
    if (!fromAI) return <>{children}</>;
    // Premium portal chrome when launched from the PRO dashboard / Homeworke AI intake.
    return (
      <div className="bg-[var(--hw-bg)]">
        <div className="mx-auto w-full max-w-[1180px] px-4 py-6">
          {children}
        </div>
      </div>
    );
  };

  return (
    <Shell>
      <div className={fromAI ? "" : "min-h-screen bg-gradient-to-b from-white to-[#fafafa]"}>
        <Container className={fromAI ? "py-0" : "py-10 md:py-16"}>
        {/* ── Header ── */}
        <div className="mb-2">
          <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
            Work order
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight md:text-3xl lg:text-4xl">
            {current.title}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--hw-muted)]">
            {current.description}
          </p>
        </div>

        {/* ── Step indicator ── */}
        <div className="mt-6 mb-8">
          <div className="flex items-center gap-1">
            {steps.map((s, i) => {
              const isActive = i === idx;
              const isCompleted = i < idx;
              return (
                <div key={s.key} className="flex items-center gap-1">
                  {i > 0 && (
                    <div
                      className={`hidden h-px w-6 sm:block md:w-10 ${
                        isCompleted ? "bg-[var(--hw-ink)]" : "bg-[var(--hw-line)]"
                      }`}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (isCompleted) setStep(s.key as StepKey);
                    }}
                    disabled={!isCompleted && !isActive}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      isActive
                        ? "bg-[var(--hw-ink)] text-white shadow-md ring-4 ring-[var(--hw-ink)]/10"
                        : isCompleted
                        ? "bg-[var(--hw-ink)] text-white cursor-pointer hover:ring-2 hover:ring-[var(--hw-ink)]/20"
                        : "border border-[var(--hw-line)] bg-white text-[var(--hw-muted)]"
                    }`}
                  >
                    {isCompleted ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </button>
                  <span
                    className={`ml-1.5 hidden text-xs font-medium sm:inline ${
                      isActive
                        ? "text-[var(--hw-ink)]"
                        : isCompleted
                        ? "text-[var(--hw-ink)]/70"
                        : "text-[var(--hw-muted)]"
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-2 sm:hidden">
            <Pill>
              Step {idx + 1} of {steps.length}
            </Pill>
            <span className="text-xs text-[var(--hw-muted)]">{draft.service_category}</span>
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* ── Form card ── */}
          <Card className="p-6 md:p-8 lg:col-span-2">
            {step === "select_service" ? (
              <div>
                <div className="text-sm font-semibold">Service</div>
                <div className="mt-4">
                  <RadioCardGroup
                    name="service_category"
                    value={draft.service_category}
                    onChange={(v) => update({ service_category: v })}
                    options={SERVICE_OPTIONS.map((o) => ({ value: o, title: o }))}
                  />
                </div>
                <div className="mt-5">
                  <Label>Optional sub-service</Label>
                  <div className="mt-2">
                    <Input
                      value={draft.service_subcategory}
                      onChange={(e) => update({ service_subcategory: e.target.value })}
                      placeholder="Example: faucet replacement"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {step === "service_details" ? (
              <div className="grid gap-5">
                <div>
                  <Label>Describe the issue</Label>
                  <div className="mt-2">
                    <Textarea
                      value={draft.issue_description}
                      onChange={(e) => update({ issue_description: e.target.value })}
                      placeholder="What is happening? Any symptoms or constraints?"
                    />
                  </div>
                </div>
                <div>
                  <Label>Urgency</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(["Normal", "Soon", "Urgent"] as const).map((u) => (
                      <Button
                        key={u}
                        type="button"
                        variant={draft.urgency_level === u ? "primary" : "secondary"}
                        onClick={() => update({ urgency_level: u })}
                      >
                        {u}
                      </Button>
                    ))}
                  </div>
                </div>
                <Card className="p-4">
                  <div className="text-sm font-semibold">Photos</div>
                  <div className="mt-2 text-sm leading-relaxed text-[var(--hw-muted)]">
                    Upload is a Phase 3 deliverable. For now, describe what you see.
                  </div>
                </Card>
              </div>
            ) : null}

            {step === "property_details" ? (
              <div className="grid gap-5">
                <div>
                  <Label>Property address</Label>
                  <div className="mt-2">
                    <Input
                      value={draft.property_address}
                      onChange={(e) => update({ property_address: e.target.value })}
                      placeholder="123 Main St, Chicago, IL"
                    />
                  </div>
                </div>
                <div>
                  <Label>Property type</Label>
                  <div className="mt-2">
                    <Input
                      value={draft.property_type}
                      onChange={(e) => update({ property_type: e.target.value })}
                      placeholder="Single family, condo, multi-unit"
                    />
                  </div>
                </div>
                <div>
                  <Label>Access instructions (optional)</Label>
                  <div className="mt-2">
                    <Textarea
                      value={draft.access_instructions}
                      onChange={(e) => update({ access_instructions: e.target.value })}
                      placeholder="Gate code, pets, parking notes"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {step === "schedule_visit" ? (
              <div className="grid gap-5">
                <div>
                  <Label>Preferred date</Label>
                  <div className="mt-2">
                    <Input
                      value={draft.preferred_date}
                      onChange={(e) => update({ preferred_date: e.target.value })}
                      placeholder="YYYY-MM-DD"
                    />
                  </div>
                </div>
                <div>
                  <Label>Preferred time window</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(["Morning", "Midday", "Afternoon"] as const).map((t) => (
                      <Button
                        key={t}
                        type="button"
                        variant={draft.preferred_time_window === t ? "primary" : "secondary"}
                        onClick={() => update({ preferred_time_window: t })}
                      >
                        {t}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Alternate date (optional)</Label>
                  <div className="mt-2">
                    <Input
                      value={draft.alternate_date}
                      onChange={(e) => update({ alternate_date: e.target.value })}
                      placeholder="YYYY-MM-DD"
                    />
                  </div>
                </div>
                <div>
                  <Label>Preferred contact method</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(["Text", "Email"] as const).map((m) => (
                      <Button
                        key={m}
                        type="button"
                        variant={draft.contact_method === m ? "primary" : "secondary"}
                        onClick={() => update({ contact_method: m })}
                      >
                        {m}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="rounded-[var(--hw-radius)] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-4">
                  <div className="text-sm font-semibold">Sharing preference</div>
                  <div className="mt-2 text-sm leading-relaxed text-[var(--hw-muted)]">
                    If a partner is attached, we keep them in the loop only when you allow it.
                  </div>
                  <div className="mt-3">
                    <Checkbox
                      checked={draft.share_with_partner}
                      onChange={(e) => update({ share_with_partner: e.target.checked })}
                      label="Allow partner updates for this request (recommended)"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {/* ── Navigation ── */}
            <div className="mt-10 flex items-center justify-between gap-3 border-t border-[var(--hw-line)] pt-6">
              <Button type="button" variant="ghost" onClick={back} disabled={idx === 0}>
                {spec.copy.backCta}
              </Button>

              {idx < steps.length - 1 ? (
                <Button type="button" onClick={next}>
                  Continue
                </Button>
              ) : (
                <Button type="button" onClick={submit}>
                  {spec.copy.primaryCta}
                </Button>
              )}
            </div>

            <p className="mt-3 text-xs text-[var(--hw-muted)]">{spec.copy.saveNote}</p>
          </Card>

          {/* ── Sidebar ── */}
          <div className="flex flex-col gap-5">
            {/* Partner card */}
            {(() => {
              try {
                const partner = loadPartner();
                if (!partner) return null;
                return (
                  <Card className="border-[var(--hw-line)] bg-[var(--hw-soft)] p-5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--hw-ink)]/10 text-xs font-bold text-[var(--hw-ink)]">
                        P
                      </span>
                      <div className="text-sm font-semibold">Referred by</div>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--hw-muted)]">
                      {partner.partnerName} · {partner.officeName}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-[var(--hw-muted)]">
                      Sharing defaults on. You can turn it off for this request in the final step.
                    </p>
                  </Card>
                );
              } catch {
                return null;
              }
            })()}

            {/* Summary card */}
            <Card className="border-[var(--hw-line)] bg-[var(--hw-soft)]/50 p-5 md:p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Summary</div>
                <Chip>Draft stored locally</Chip>
              </div>

              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-[var(--hw-muted)]">
                    Service
                  </dt>
                  <dd className="mt-0.5 font-medium text-[var(--hw-ink)]">
                    {draft.service_category}
                    {draft.service_subcategory ? (
                      <span className="ml-1 font-normal text-[var(--hw-muted)]">
                        / {draft.service_subcategory}
                      </span>
                    ) : null}
                  </dd>
                </div>

                {draft.issue_description ? (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-[var(--hw-muted)]">
                      Issue
                    </dt>
                    <dd className="mt-0.5 leading-relaxed text-[var(--hw-ink)]">
                      {draft.issue_description}
                    </dd>
                  </div>
                ) : null}

                {draft.property_address ? (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-[var(--hw-muted)]">
                      Address
                    </dt>
                    <dd className="mt-0.5 text-[var(--hw-ink)]">{draft.property_address}</dd>
                  </div>
                ) : null}

                {draft.preferred_date ? (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-[var(--hw-muted)]">
                      Preferred
                    </dt>
                    <dd className="mt-0.5 text-[var(--hw-ink)]">
                      {draft.preferred_date}{" "}
                      <span className="text-[var(--hw-muted)]">
                        ({draft.preferred_time_window})
                      </span>
                    </dd>
                  </div>
                ) : null}
              </dl>

              <div className="mt-5 border-t border-[var(--hw-line)] pt-4">
                <Link
                  href="/marketplace/request"
                  className="text-xs font-medium text-[var(--hw-muted)] underline decoration-[var(--hw-line)] underline-offset-2 transition-colors hover:text-[var(--hw-ink)]"
                >
                  Switch to quick request →
                </Link>
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-8 text-sm text-[var(--hw-muted)]">
          <Link href={fromAI ? "/pro/dashboard" : "/"}>← {fromAI ? "Back to dashboard" : "Back home"}</Link>
        </div>
      </Container>
    </div>
    </Shell>
  );
}
