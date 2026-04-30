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
  Picker,
  RadioCardGroup,
  Textarea,
} from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";
import { PRO_NAV } from "@/components/pro/nav";
import { Bolt, Droplets, Flame, Hammer, Home, Layers, Sparkles, Wrench } from "lucide-react";

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

  const [propertyOptions, setPropertyOptions] = useState<Array<{ id: string; label: string; sublabel?: string; address?: string; kind?: "client" | "my" | "shared" }>>([]);
  const [propertyLoading, setPropertyLoading] = useState(false);
  const [propertyError, setPropertyError] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [propertyFilter, setPropertyFilter] = useState<"client" | "my" | "shared" | "all">("client");

  const fromAI = useMemo(() => {
    try {
      const sp = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
      return sp.get("fromAI") === "1";
    } catch {
      return false;
    }
  }, []);

  // Portal mode should not depend on query params; if you're logged into any portal, use the premium intake.
  const portalMode = useMemo(() => {
    if (typeof window === "undefined") return false;
    try {
      const raw = window.localStorage.getItem("hw_session_v1");
      const j = raw ? JSON.parse(raw) : null;
      return !!j?.token;
    } catch {
      return false;
    }
  }, []);

  const isPortalIntake = portalMode || fromAI;

  // Load properties for PRO portal order entry.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isPortalIntake) return;

    let cancelled = false;
    setPropertyLoading(true);
    setPropertyError("");

    (async () => {
      try {
        let token: string | null = null;
        try {
          const raw = window.localStorage.getItem("hw_session_v1");
          const j = raw ? JSON.parse(raw) : null;
          if (j?.token) token = String(j.token);
        } catch {}
        if (!token) throw new Error("missing_session");

        const url = new URL("/api/properties", window.location.origin);
        url.searchParams.set("token", token);
        const res = await fetch(url);
        const j = (await res.json().catch(() => null)) as any;
        const props = Array.isArray(j?.properties) ? j.properties : [];

        const opts = props
          .filter((p: any) => p && typeof p.id === "string")
          .map((p: any) => {
            const address = String(p.address || "").trim();
            const label = String(p.nickname || address || "Property").trim();
            const kindKey: "client" | "my" | "shared" = p.sharedWithMe ? "shared" : p.clientProperty ? "client" : "my";
            const kind = kindKey === "shared" ? "Shared" : kindKey === "client" ? "Client" : "My";
            const sublabel = address ? `${kind} • ${address}` : kind;
            return { id: String(p.id), label, sublabel, address, kind: kindKey };
          });

        if (cancelled) return;
        setPropertyOptions(opts);

        // Best-effort preselect: if draft has an address, pick the closest match.
        const draftAddr = (draft.property_address || "").toLowerCase().trim();
        if (draftAddr) {
          const hit = opts.find((o: any) => (o.address || "").toLowerCase().trim() === draftAddr) || null;
          if (hit) setSelectedPropertyId(hit.id);
        }
      } catch {
        if (!cancelled) setPropertyError("Couldn’t load properties.");
      } finally {
        if (!cancelled) setPropertyLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isPortalIntake]);

  // Prefill from query params (used by AI intake card)
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
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

      // When launched from any portal session, keep the flow clean and start at Step 1.
      // (We may prefill trade/subcategory/issue, but we should not jump the user ahead.)
      if (isPortalIntake) {
        setStep("select_service");
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

  async function submit() {
    // Portal order entry: create a Work Order and route into the Jobs detail flow.
    if (fromAI) {
      try {
        let token: string | null = null;
        try {
          const raw = window.localStorage.getItem("hw_session_v1");
          const j = raw ? JSON.parse(raw) : null;
          if (j?.token) token = String(j.token);
        } catch {}

        if (!token) {
          router.push("/pro/dashboard");
          return;
        }

        const res = await fetch("/api/work-orders", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            token,
            originPartnerId: null,
            shareWithPartner: true,
            intake: {
              service_category: draft.service_category,
              service_subcategory: draft.service_subcategory,
              issue_description: draft.issue_description,
              urgency_level: draft.urgency_level,
              property_address: draft.property_address,
              property_type: draft.property_type,
              preferred_date: draft.preferred_date,
              preferred_time_window: draft.preferred_time_window,
            },
          }),
        });

        const j = await res.json().catch(() => null);
        if (!res.ok || !j?.ok || !j?.workOrder?.id) throw new Error("create_failed");

        // Persist locally so non-DB mode can navigate directly.
        try {
          const key = "hw_local_work_orders_v1";
          const raw = window.localStorage.getItem(key) || "[]";
          const arr = JSON.parse(raw);
          const list = Array.isArray(arr) ? arr : [];
          const next = [j.workOrder, ...list].filter(Boolean);
          const seen = new Set<string>();
          const deduped: any[] = [];
          for (const item of next) {
            const wid = String((item as any)?.id || "");
            if (!wid || seen.has(wid)) continue;
            seen.add(wid);
            deduped.push(item);
          }
          window.localStorage.setItem(key, JSON.stringify(deduped.slice(0, 50)));
        } catch {}

        router.push(`/pro/jobs/${encodeURIComponent(String(j.workOrder.id))}`);
        return;
      } catch {
        // fall back to providers
      }
    }

    // Public marketplace flow: map intake to provider suggestions.
    router.push(`/marketplace/providers?service=${encodeURIComponent(draft.service_category)}&issue=${encodeURIComponent(draft.issue_description || "")}`);
  }

  const current = steps[idx];

  const TRADE_OPTIONS = (taxonomy.trades as string[]).filter(Boolean);

  const tradeIcon = (t: string) => {
    const s = (t || "").toLowerCase();
    if (s.includes("plumb")) return Droplets;
    if (s.includes("electric")) return Bolt;
    if (s.includes("hvac") || s.includes("heating") || s.includes("cool")) return Flame;
    if (s.includes("floor")) return Layers;
    if (s.includes("roof")) return Home;
    if (s.includes("clean")) return Sparkles;
    if (s.includes("handyman") || s.includes("general")) return Wrench;
    return Hammer;
  };

  const Shell = ({ children }: { children: React.ReactNode }) => {
    if (!isPortalIntake) return <>{children}</>;

    return (
      <PortalShell
        role="PRO"
        title="Work order"
        portalTitle="Real Estate Pro"
        nav={PRO_NAV as unknown as { href: string; label: string }[]}
        description="Tell us what you need — we’ll route the right pro and confirm scheduling."
        primaryAction={
          <Link href="/pro/dashboard">
            <Button variant="secondary">Back to dashboard</Button>
          </Link>
        }
      >
        {children}
      </PortalShell>
    );
  };

  return (
    <Shell>
      <div className={isPortalIntake ? "" : "min-h-screen bg-gradient-to-b from-white to-[#fafafa]"}>
        <Container className={isPortalIntake ? "py-4" : "py-10 md:py-16"}>
        {/* ── Header ── */}
        <div className="mb-2">
          {!isPortalIntake ? (
            <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Work order</div>
          ) : null}
          <h1 className={(isPortalIntake ? "mt-0 " : "mt-3 ") + "text-2xl font-extrabold tracking-tight md:text-3xl lg:text-4xl"}>
            {current.title}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--hw-muted)]">{current.description}</p>
        </div>

        {/* ── Step indicator ── */}
        {!isPortalIntake ? (
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
        ) : null}

        {/* ── Main grid ── */}
        <div className={"grid grid-cols-1 gap-6 " + (isPortalIntake ? "lg:grid-cols-1" : "lg:grid-cols-3")}>
          {/* ── Form card ── */}
          <Card className="p-6 md:p-8 lg:col-span-2">
            {step === "select_service" ? (
              <div>
                {isPortalIntake ? (
                  <>
                    <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Order entry</div>
                    <div className="mt-2 text-lg font-extrabold tracking-tight text-[var(--hw-ink)]">Start a work order</div>
                    <div className="mt-1 text-sm text-[var(--hw-muted)]">
                      Pick a trade, add details, then request a scheduling window. Home Guide confirms.
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label>Trade</Label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {TRADE_OPTIONS.map((t) => {
                            const Icon = tradeIcon(t);
                            const active = draft.service_category === t;
                            return (
                              <button
                                key={t}
                                type="button"
                                onClick={() => update({ service_category: t })}
                                className={
                                  "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition " +
                                  (active
                                    ? "border-[rgba(229,57,53,.35)] bg-white text-[var(--hw-ink)] ring-4 ring-[rgba(229,57,53,.10)]"
                                    : "border-[var(--hw-line)] bg-white text-[var(--hw-muted)] hover:bg-[rgba(17,24,39,.03)]")
                                }
                              >
                                <Icon className={"h-4 w-4 " + (active ? "text-[var(--hw-red)]" : "text-[var(--hw-muted)]")} />
                                {t}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <Label>Property</Label>
                        <div className="mt-2">
                          <div className="mb-2 flex flex-wrap gap-2">
                            {([
                              { id: "client", label: "Client" },
                              { id: "my", label: "My" },
                              { id: "shared", label: "Shared" },
                              { id: "all", label: "All" },
                            ] as const).map((f) => (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() => setPropertyFilter(f.id)}
                                className={
                                  "h-9 rounded-full border px-3 text-xs font-semibold transition " +
                                  (propertyFilter === f.id
                                    ? "border-[rgba(229,57,53,.25)] bg-[rgba(229,57,53,.10)] text-[var(--hw-red)]"
                                    : "border-[var(--hw-line)] bg-white text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]")
                                }
                              >
                                {f.label}
                              </button>
                            ))}
                          </div>

                          <Picker
                            value={selectedPropertyId}
                            placeholder={propertyLoading ? "Loading properties…" : "Select a property"}
                            options={propertyOptions
                              .filter((o) => {
                                if (propertyFilter === "all") return true;
                                return (o.kind || "my") === propertyFilter;
                              })
                              .map((o) => ({ id: o.id, label: o.label, sublabel: o.sublabel }))}
                            searchable={true}
                            searchPlaceholder="Search properties…"
                            onChange={(id) => {
                              setSelectedPropertyId(id);
                              const hit = propertyOptions.find((p) => p.id === id) || null;
                              if (hit?.address) update({ property_address: hit.address });
                            }}
                          />
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <div className="text-[11px] text-[var(--hw-muted)]">
                              {propertyError ? propertyError : "Choose from your Properties."}
                            </div>
                            <Link href="/pro/properties">
                              <Button size="xs" variant="secondary">Add property</Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5">
                      <Label>Describe the issue</Label>
                      <div className="mt-2">
                        <Textarea
                          value={draft.issue_description}
                          onChange={(e) => update({ issue_description: e.target.value })}
                          placeholder="What’s happening? Include any constraints, access notes, or urgency."
                        />
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
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
                        <Label>Time window</Label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(["Morning", "Midday", "Afternoon", "Evening"] as const).map((t) => (
                            <Button
                              key={t}
                              type="button"
                              variant={draft.preferred_time_window === t ? "primary" : "secondary"}
                              onClick={() => update({ preferred_time_window: t as any })}
                            >
                              {t}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        onClick={() => void submit()}
                        disabled={!draft.service_category || !draft.issue_description.trim()}
                      >
                        Create work order
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}
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
          {!fromAI ? (
            <div className="flex flex-col gap-5">
            {/* Partner card (homeowner funnel only). PRO portal order entry should not show "Referred by". */}
            {(() => {
              try {
                // Only show "Referred by" in the homeowner/public funnel.
                if (isPortalIntake) return null;
                const partner = loadPartner();
                if (!partner) return null;
                return (
                  <Card className="border-[var(--hw-line)] bg-[var(--hw-soft)] p-5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--hw-ink)]/10 text-xs font-bold text-[var(--hw-ink)]">P</span>
                      <div className="text-sm font-semibold">Referred by</div>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--hw-muted)]">{partner.partnerName} · {partner.officeName}</p>
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
                  <dt className="text-xs font-medium uppercase tracking-wide text-[var(--hw-muted)]">Service</dt>
                  <dd className="mt-0.5 font-medium text-[var(--hw-ink)]">
                    {draft.service_category}
                    {draft.service_subcategory ? <span className="ml-1 font-normal text-[var(--hw-muted)]">/ {draft.service_subcategory}</span> : null}
                  </dd>
                </div>

                {draft.issue_description ? (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-[var(--hw-muted)]">Issue</dt>
                    <dd className="mt-0.5 leading-relaxed text-[var(--hw-ink)]">{draft.issue_description}</dd>
                  </div>
                ) : null}

                {draft.property_address ? (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-[var(--hw-muted)]">Address</dt>
                    <dd className="mt-0.5 text-[var(--hw-ink)]">{draft.property_address}</dd>
                  </div>
                ) : null}

                {draft.preferred_date ? (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-[var(--hw-muted)]">Preferred</dt>
                    <dd className="mt-0.5 text-[var(--hw-ink)]">
                      {draft.preferred_date} <span className="text-[var(--hw-muted)]">({draft.preferred_time_window})</span>
                    </dd>
                  </div>
                ) : null}
              </dl>

              <div className="mt-5 border-t border-[var(--hw-line)] pt-4">
                <Link href="/marketplace/request" className="text-xs font-medium text-[var(--hw-muted)] underline decoration-[var(--hw-line)] underline-offset-2 transition-colors hover:text-[var(--hw-ink)]">
                  Switch to quick request →
                </Link>
              </div>
            </Card>
          </div>
          ) : null}
        </div>

        {!fromAI ? (
          <div className="mt-8 text-sm text-[var(--hw-muted)]">
            <Link href="/">← Back home</Link>
          </div>
        ) : null}
      </Container>
    </div>
    </Shell>
  );
}
