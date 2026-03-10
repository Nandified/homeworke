"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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

import spec from "@/content/intake_stepper_opus.json";

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

const SERVICE_OPTIONS = [
  "Plumbing",
  "Electrical",
  "HVAC",
  "Roofing",
  "Drywall/Paint",
  "General",
];

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <Container className="py-12 md:py-14">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Work order</div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">{current.title}</h1>
            <div className="mt-2 max-w-3xl text-sm leading-7 text-[var(--hw-muted)]">{current.description}</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Pill>Step {idx + 1} of {steps.length}</Pill>
            <div className="text-xs text-[var(--hw-muted)]">{draft.service_category}</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="p-6 md:p-7 lg:col-span-2">
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
                <div className="mt-4">
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
              <div className="grid gap-4">
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
                  <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">
                    Upload is a Phase 3 deliverable. For now, describe what you see.
                  </div>
                </Card>
              </div>
            ) : null}

            {step === "property_details" ? (
              <div className="grid gap-4">
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
              <div className="grid gap-4">
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
                  <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">
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

            <div className="mt-8 flex flex-wrap items-center justify-between gap-2">
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

            <div className="mt-4 text-sm text-[var(--hw-muted)]">{spec.copy.saveNote}</div>
          </Card>

          {(() => {
            try {
              const partner = loadPartner();
              if (!partner) return null;
              return (
                <Card className="p-6">
                  <div className="text-sm font-semibold">Referred by</div>
                  <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">
                    {partner.partnerName} · {partner.officeName}
                  </div>
                  <div className="mt-3 text-sm leading-7 text-[var(--hw-muted)]">
                    Sharing defaults on. You can turn it off for this request in the final step.
                  </div>
                </Card>
              );
            } catch {
              return null;
            }
          })()}

          <Card className="p-6 md:p-7">
            <div className="text-sm font-semibold">Summary</div>
            <div className="mt-4 grid gap-2 text-sm text-[var(--hw-muted)]">
              <div>
                <span className="font-semibold text-[var(--hw-ink)]">Service:</span> {draft.service_category}
              </div>
              {draft.service_subcategory ? (
                <div>
                  <span className="font-semibold text-[var(--hw-ink)]">Sub-service:</span> {draft.service_subcategory}
                </div>
              ) : null}
              {draft.issue_description ? (
                <div>
                  <span className="font-semibold text-[var(--hw-ink)]">Issue:</span> {draft.issue_description}
                </div>
              ) : null}
              {draft.property_address ? (
                <div>
                  <span className="font-semibold text-[var(--hw-ink)]">Address:</span> {draft.property_address}
                </div>
              ) : null}
              {draft.preferred_date ? (
                <div>
                  <span className="font-semibold text-[var(--hw-ink)]">Preferred:</span> {draft.preferred_date} ({draft.preferred_time_window})
                </div>
              ) : null}
              <div className="pt-2">
                <Chip>Draft stored locally</Chip>
              </div>
            </div>

            <div className="mt-6 text-sm text-[var(--hw-muted)]">
              <Link href="/marketplace/request">Switch to quick request</Link>
            </div>
          </Card>
        </div>

        <div className="mt-6 text-sm text-[var(--hw-muted)]">
          <Link href="/">Back home</Link>
        </div>
      </Container>
    </div>
  );
}
