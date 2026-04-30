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
  Modal,
  RadioCardGroup,
  Textarea,
} from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";
import { PRO_NAV } from "@/components/pro/nav";
import {
  Bolt,
  BrushCleaning,
  Bug,
  ChevronLeft,
  ChevronRight,
  DoorClosed,
  DoorOpen,
  Droplets,
  Flame,
  Hammer,
  Home,
  HousePlug,
  Leaf,
  Layers,
  PaintBucket,
  PaintRoller,
  PlugZap,
  Refrigerator,
  SprayCan,
  TreePine,
  Trees,
  UploadCloud,
  Wrench,
} from "lucide-react";
import {
  readClientProperties,
  readCustomProperties,
  writeClientProperties,
  writeCustomProperties,
} from "../portal-intake-properties";

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
  preferred_time_window: "Morning" | "Midday" | "Afternoon" | "Evening";
  alternate_date: string;
  contact_method: "Any" | "Text" | "Call" | "Email";
  share_with_partner: boolean;
};

const SERVICE_OPTIONS = taxonomy.trades as string[];
const TRADE_OPTIONS = (taxonomy.trades as string[]).filter(Boolean);

function draftKey() {
  return "hw_intake_draft_v1";
}

function loadDraft(): IntakeDraft {
  try {
    const raw = localStorage.getItem(draftKey());
    if (raw) {
      const d = JSON.parse(raw) as IntakeDraft;
      // Clean up legacy/demo text that may have been prefixed into the issue field.
      if (typeof d.issue_description === "string") {
        const before = d.issue_description;
        let next = before
          .replace(/\n\nDetails from chat:\n/gi, "\n\n")
          .replace(/^Details from chat:\s*/i, "")
          .trimStart();

        // If the field is ONLY a Q&A bullet dump (older portal demos), start empty.
        // Heuristic: every non-empty line is a bullet, and it contains at least one question mark.
        const lines = next.split("\n").map((l) => l.trim()).filter(Boolean);
        const looksLikeBulletsOnly = lines.length > 0 && lines.every((l) => l.startsWith("- "));
        const hasQuestion = next.includes("?");
        if (looksLikeBulletsOnly && hasQuestion) next = "";

        d.issue_description = next;

        // Persist cleanup so it doesn't keep coming back.
        if (next !== before) {
          try {
            localStorage.setItem(draftKey(), JSON.stringify(d));
          } catch {
            // ignore
          }
        }
      }
      return d;
    }
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
    contact_method: "Any",
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
  const [portalScheduleStep, setPortalScheduleStep] = useState<"date" | "window" | "contact">("date");
  const [showAllTradeServices, setShowAllTradeServices] = useState(false);
  const [tradeSearch, setTradeSearch] = useState("");
  const [tradeServicesOpen, setTradeServicesOpen] = useState(false);

  // Keep textarea typing isolated from the large draft object to avoid any focus jank.
  const [issueFieldKey, setIssueFieldKey] = useState(0);
  const [issueLen, setIssueLen] = useState(0);
  const issueRef = useMemo(() => ({ current: null as HTMLTextAreaElement | null }), []);

  const [issueAttachments, setIssueAttachments] = useState<File[]>([]);
  const [issueFileDialogNonce, setIssueFileDialogNonce] = useState(0);

  const issuePreviews = useMemo(() => {
    return issueAttachments.map((f) => {
      const isImage = (f.type || "").startsWith("image/");
      const isVideo = (f.type || "").startsWith("video/");
      const url = isImage || isVideo ? URL.createObjectURL(f) : null;
      return { file: f, isImage, isVideo, url };
    });
  }, [issueAttachments]);

  useEffect(() => {
    return () => {
      for (const p of issuePreviews) {
        if (p.url) URL.revokeObjectURL(p.url);
      }
    };
  }, [issuePreviews]);
  const tradeSearchResults = useMemo(() => {
    const q = tradeSearch.trim().toLowerCase();
    if (q.length < 2) return [] as Array<{ kind: "trade" | "service"; trade: string; label: string; sub?: string }>;

    const results: Array<{ kind: "trade" | "service"; trade: string; label: string; sub?: string; score: number }> = [];

    // Trade matches
    for (const t of TRADE_OPTIONS) {
      const hay = t.toLowerCase();
      if (hay.includes(q)) {
        results.push({ kind: "trade", trade: t, label: t, score: hay.startsWith(q) ? 120 : 90 });
      }
    }

    // Service matches
    const services = (taxonomy as any)?.services || [];
    for (const s of services) {
      const trade = String((s as any)?.trade || "");
      const label = String((s as any)?.label || "");
      const category = String((s as any)?.category || "");
      if (!trade || !label) continue;

      const hay = label.toLowerCase();
      if (!hay.includes(q)) continue;

      const score = hay.startsWith(q) ? 110 : 80;
      results.push({ kind: "service", trade, label, sub: category || undefined, score });
    }

    return results
      .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
      .slice(0, 8)
      .map(({ score: _score, ...rest }) => rest);
  }, [tradeSearch]);
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

  const [addPropOpen, setAddPropOpen] = useState(false);
  const [addPropMode, setAddPropMode] = useState<"client" | "property">("client");
  const [newAddress, setNewAddress] = useState("");
  const [newNickname, setNewNickname] = useState("");
  const [newPropertyType, setNewPropertyType] = useState("");
  const [newClientFirstName, setNewClientFirstName] = useState("");
  const [newClientLastName, setNewClientLastName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [addTouched, setAddTouched] = useState(false);
  const [addingProp, setAddingProp] = useState(false);

  const fromAI = useMemo(() => {
    try {
      const sp = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
      return sp.get("fromAI") === "1";
    } catch {
      return false;
    }
  }, []);

  // Calendar UI (Preferred date) — copied from Homeworke AI scheduling.
  const minVisitIso = useMemo(() => {
    const now = new Date();
    const min = new Date(now);
    // Block out the next 2 days so we have time to confirm.
    min.setDate(min.getDate() + 2);
    return new Date(min.getTime() - min.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }, []);

  const minVisitDate = useMemo(() => {
    const [yy, mm, dd] = (minVisitIso || "").split("-").map((x) => Number(x));
    return new Date(yy, (mm || 1) - 1, dd || 1);
  }, [minVisitIso]);

  const [calMonth, setCalMonth] = useState<Date>(() => {
    const base = minVisitDate;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  // Keep calendar month aligned with selected date (or min date).
  useEffect(() => {
    const base = draft.preferred_date ? new Date(draft.preferred_date + "T00:00:00") : minVisitDate;
    setCalMonth(new Date(base.getFullYear(), base.getMonth(), 1));
  }, [draft.preferred_date, minVisitDate]);

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

  // Load properties for portal order entry (merge API + locally added client/my properties)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isPortalIntake) return;

    let cancelled = false;
    setPropertyLoading(true);
    setPropertyError("");

    (async () => {
      try {
        const localMy = readCustomProperties().map((p) => ({
          id: p.id,
          label: (p.nickname || p.address || "Property").trim(),
          sublabel: p.address ? `My • ${p.address}` : "My",
          address: p.address,
          kind: "my" as const,
        }));
        const localClient = readClientProperties().map((p) => ({
          id: p.id,
          label: (p.nickname || p.address || "Property").trim(),
          sublabel: p.address ? `Client • ${p.address}` : "Client",
          address: p.address,
          kind: "client" as const,
        }));

        let token: string | null = null;
        try {
          const raw = window.localStorage.getItem("hw_session_v1");
          const j = raw ? JSON.parse(raw) : null;
          if (j?.token) token = String(j.token);
        } catch {}

        const apiOpts = await (async () => {
          if (!token) return [] as any[];
          const url = new URL("/api/properties", window.location.origin);
          url.searchParams.set("token", token);
          const res = await fetch(url);
          const j = (await res.json().catch(() => null)) as any;
          const props = Array.isArray(j?.properties) ? j.properties : [];
          return props
            .filter((p: any) => p && typeof p.id === "string")
            .map((p: any) => {
              const address = String(p.address || "").trim();
              const label = String(p.nickname || address || "Property").trim();
              const kindKey: "client" | "my" | "shared" = p.sharedWithMe ? "shared" : p.clientProperty ? "client" : "my";
              const kind = kindKey === "shared" ? "Shared" : kindKey === "client" ? "Client" : "My";
              const sublabel = address ? `${kind} • ${address}` : kind;
              return { id: String(p.id), label, sublabel, address, kind: kindKey };
            });
        })();

        // Merge (local first so freshly added items show immediately)
        const merged = [...localClient, ...localMy, ...apiOpts];
        const seen = new Set<string>();
        const out: typeof merged = [];
        for (const o of merged) {
          if (!o?.id || seen.has(String(o.id))) continue;
          seen.add(String(o.id));
          out.push(o);
        }

        if (cancelled) return;
        setPropertyOptions(out);

        // Best-effort preselect: if draft has an address, pick the closest match.
        const draftAddr = (draft.property_address || "").toLowerCase().trim();
        if (draftAddr) {
          const hit = out.find((o: any) => (o.address || "").toLowerCase().trim() === draftAddr) || null;
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
      // In portal intake we keep the field empty; avoid prefilling long AI/demo text.
      const issue = isPortalIntake ? "" : sp.get("aiSummary") || sp.get("issue") || "";
      const qnaRaw = isPortalIntake ? "" : sp.get("qna") || "";

      let qnaText = "";
      try {
        const qna = qnaRaw ? (JSON.parse(qnaRaw) as Array<{ question: string; answer: string }>) : [];
        if (Array.isArray(qna) && qna.length) {
          // Include Q&A, but avoid "demo"-sounding labels like "Details from chat".
          qnaText =
            "\n\n" +
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

  // Remount the textarea when entering the step so defaultValue is applied,
  // but avoid controlled input state while typing (prevents focus loss).
  useEffect(() => {
    if (!isPortalIntake) return;
    if (step !== "service_details") return;
    setIssueFieldKey((k) => k + 1);
    setIssueLen(String(draft.issue_description || "").trim().length);
  }, [isPortalIntake, step]);

  function update(patch: Partial<IntakeDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  // Debounced persist.
  // Note: in some browsers, frequent localStorage writes can steal focus from inputs.
  // Portal intake already has a "Next" button per step, so we can safely persist less aggressively.
  useEffect(() => {
    // While typing project details in portal mode, avoid autosave to prevent focus loss.
    if (isPortalIntake && step === "service_details") return;

    const t = window.setTimeout(() => {
      try {
        saveDraft(draft);
      } catch {
        // ignore
      }
    }, 400);
    return () => window.clearTimeout(t);
  }, [draft, isPortalIntake, step]);

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

  // TRADE_OPTIONS hoisted to module scope

  const servicesByTrade = useMemo(() => {
    const out = new Map<string, Array<{ id: string; category: string; label: string }>>();
    for (const s of (taxonomy as any)?.services || []) {
      const trade = String((s as any)?.trade || "").trim();
      if (!trade) continue;
      const arr = out.get(trade) || [];
      arr.push({ id: String((s as any)?.id || ""), category: String((s as any)?.category || ""), label: String((s as any)?.label || "") });
      out.set(trade, arr);
    }
    // stable sort
    for (const [trade, arr] of out.entries()) {
      arr.sort((a, b) => (a.category + a.label).localeCompare(b.category + b.label));
      out.set(trade, arr);
    }
    return out;
  }, []);

  const tradeMeta = (trade: string) => {
    const s = (trade || "").toLowerCase();

    // Normalize to nearest known trade label (protect against future taxonomy drift / typos).
    const exact = TRADE_OPTIONS.find((t) => t.toLowerCase() === s) || trade;


    // Premium-ish one-line explanations for the UI.
    const description =
      s.includes("electrical")
        ? "Panels, outlets, lighting, troubleshooting"
        : s.includes("plumb")
          ? "Leaks, fixtures, drains, water heaters"
          : s.includes("hvac")
            ? "Heating/cooling, thermostats, ducts"
            : s.includes("clean")
              ? "Turnovers, deep cleans, carpet & more"
              : s.includes("appliance")
                ? "Install & repair for household appliances"
                : s.includes("floor")
                  ? "Install, repair, refinish"
                  : s.includes("paint")
                    ? "Interior/exterior painting & prep"
                    : s.includes("drywall")
                      ? "Patch, hang, texture, finish"
                      : s.includes("pest")
                        ? "Treatments, prevention, inspections"
                        : s.includes("landscap")
                          ? "Lawn care, cleanup, hardscapes"
                          : s.includes("tree")
                            ? "Trim, removal, storm cleanup"
                            : s.includes("roof")
                              ? "Repair, replace, inspections"
                              : s.includes("gutter")
                                ? "Clean, repair, guards"
                                : s.includes("windows") || s.includes("doors")
                                  ? "Install, repair, weatherproof"
                                  : s.includes("garage")
                                    ? "Openers, springs, repairs"
                                    : s.includes("masonry") || s.includes("concrete") || s.includes("asphalt")
                                      ? "Concrete, brick, asphalt work"
                                      : s.includes("mold") || s.includes("water") || s.includes("environment")
                                        ? "Remediation, testing, restoration"
                                        : s.includes("inspect")
                                          ? "Home, sewer, and specialty inspections"
                                          : s.includes("pool")
                                            ? "Service, repair, installs"
                                            : s.includes("remodel")
                                              ? "Kitchens, baths, additions"
                                              : s.includes("handyman") || s.includes("general")
                                                ? "Small repairs, installs, punch lists"
                                                : "";

    const Icon = (() => {
      if (s.includes("electrical")) return PlugZap;
      if (s.includes("plumb")) return Droplets;
      if (s.includes("hvac") || s.includes("heating") || s.includes("cool")) return Flame;
      if (s.includes("appliance")) return Refrigerator;
      if (s.includes("clean")) return BrushCleaning;
      if (s.includes("floor")) return Layers;
      if (s.includes("gutter")) return Home;
      if (s.includes("landscap") || s.includes("lawn")) return Leaf;
      if (s.includes("tree")) return TreePine;
      if (s.includes("masonry") || s.includes("concrete") || s.includes("asphalt")) return Hammer;
      if (s.includes("mold") || s.includes("water damage") || s.includes("environment")) return SprayCan;
      if (s.includes("paint")) return PaintRoller;
      if (s.includes("drywall")) return PaintBucket;
      if (s.includes("pest")) return Bug;
      if (s.includes("pool") || s.includes("spa")) return HousePlug;
      if (s.includes("garage")) return DoorClosed;
      if (s.includes("windows") || s.includes("doors")) return DoorOpen;
      if (s.includes("inspect")) return Bolt;
      if (s.includes("remodel")) return Wrench;
      if (s.includes("handyman") || s.includes("general")) return Wrench;
      return Trees;
    })();

    const services = servicesByTrade.get(exact) || servicesByTrade.get(trade) || [];
    return { Icon, description, services };
  };

  const Shell = ({ children }: { children: React.ReactNode }) => {
    if (!isPortalIntake) return <>{children}</>;

    return (
      <PortalShell
        role="PRO"
        title="Work Order"
        portalTitle="Real Estate Pro"
        nav={PRO_NAV as unknown as { href: string; label: string }[]}
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
        {!isPortalIntake ? (
          <div className="mb-2">
            <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Work Order</div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight md:text-3xl lg:text-4xl">{current.title}</h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--hw-muted)]">{current.description}</p>
          </div>
        ) : null}

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
                    <div className="text-2xl font-extrabold tracking-tight text-[var(--hw-ink)] sm:text-3xl">
                      What do you need help with?
                    </div>
                    <div className="mt-1 text-sm text-[var(--hw-muted)]">
                      Select the service category that best describes your project. We will match you with vetted, qualified professionals in your area.
                    </div>

                    <div className="mt-6">
                      <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Trade</div>

                      {/* Search → suggest services/trades */}
                      <div className="mt-3">
                        <div className="relative">
                          <Input
                            value={tradeSearch}
                            onChange={(e) => setTradeSearch(e.target.value)}
                            placeholder="Search a service (e.g., leaking sink, outlet, deep clean…)"
                          />

                          {tradeSearchResults.length ? (
                            <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white shadow-[0_18px_40px_rgba(17,24,39,.10)]">
                              {tradeSearchResults.map((r, idx) => (
                                <button
                                  key={`${r.kind}:${r.trade}:${r.label}:${idx}`}
                                  type="button"
                                  onClick={() => {
                                    setShowAllTradeServices(false);
                                    update({ service_category: r.trade });
                                    // keep the query as feedback, but collapse suggestions
                                    setTradeSearch(r.kind === "trade" ? r.trade : r.label);
                                  }}
                                  className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-[var(--hw-soft)]"
                                >
                                  <div className="min-w-0">
                                    <div className="font-semibold text-[var(--hw-ink)] truncate">{r.label}</div>
                                    <div className="mt-0.5 text-xs text-[var(--hw-muted)] truncate">
                                      {r.kind === "service" ? (r.sub ? `${r.trade} • ${r.sub}` : r.trade) : "Trade"}
                                    </div>
                                  </div>
                                  <div className="shrink-0 text-xs font-semibold text-[var(--hw-red)]">Select</div>
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 items-start">
                        {TRADE_OPTIONS.map((t) => {
                          const { Icon, description } = tradeMeta(t);
                          const active = draft.service_category === t;
                          return (
                            <div
                              key={t}
                              className={
                                "rounded-[var(--hw-radius-lg)] border p-4 transition " +
                                (active
                                  ? "border-[rgba(229,57,53,.35)] bg-[rgba(229,57,53,.04)] ring-4 ring-[rgba(229,57,53,.10)]"
                                  : "border-[var(--hw-line)] bg-white hover:bg-[var(--hw-soft)]")
                              }
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setShowAllTradeServices(false);
                                  setTradeServicesOpen(false);
                                  update({ service_category: t, service_subcategory: "" });
                                }}
                                className="group flex w-full items-start gap-3 text-left"
                              >
                                <div
                                  className={
                                    "mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border " +
                                    (active
                                      ? "border-[rgba(229,57,53,.22)] bg-[rgba(229,57,53,.10)]"
                                      : "border-[var(--hw-line)] bg-white")
                                  }
                                >
                                  <Icon className={"h-5 w-5 " + (active ? "text-[var(--hw-red)]" : "text-[var(--hw-muted)]")} />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className={"text-sm font-extrabold tracking-tight text-[var(--hw-ink)]"}>{t}</div>
                                    {active ? (
                                      <span className="text-xs font-semibold text-[var(--hw-red)]">Selected</span>
                                    ) : null}
                                  </div>
                                  {description ? (
                                    <div className="mt-1 text-xs leading-relaxed text-[var(--hw-muted)]">{description}</div>
                                  ) : null}
                                  {/* Services list is shown in the expandable section below. */}
                                </div>
                              </button>

                              {active ? (
                                <div className="mt-3">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTradeServicesOpen((v) => !v);
                                    }}
                                    className="text-xs font-semibold text-[var(--hw-red)] hover:opacity-80"
                                  >
                                    {tradeServicesOpen ? "Hide service types" : "Choose service type (optional)"}
                                  </button>

                                  {draft.service_subcategory ? (
                                    <div className="mt-2 text-xs text-[var(--hw-muted)]">
                                      Selected: <span className="font-semibold text-[var(--hw-ink)]">{draft.service_subcategory}</span>
                                    </div>
                                  ) : null}

                                  {tradeServicesOpen ? (
                                    <div
                                      className="mt-3 rounded-[var(--hw-radius-lg)] border border-[rgba(229,57,53,.14)] bg-white p-3"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {(() => {
                                        const all = tradeMeta(t).services || [];
                                        const limit = 8;
                                        const items = showAllTradeServices ? all : all.slice(0, limit);
                                        return (
                                          <ul className="grid gap-1.5">
                                            {items.map((s) => {
                                              const selected = draft.service_subcategory === s.label;
                                              return (
                                                <li key={s.id || s.label}>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      update({ service_subcategory: s.label });
                                                      setTradeServicesOpen(false);
                                                    }}
                                                    className={
                                                      "flex w-full items-start justify-between gap-3 rounded-2xl border px-3 py-2 text-left text-xs font-semibold transition " +
                                                      (selected
                                                        ? "border-[rgba(229,57,53,.35)] bg-[rgba(229,57,53,.06)]"
                                                        : "border-[var(--hw-line)] bg-[var(--hw-soft)]/20 hover:bg-[var(--hw-soft)]")
                                                    }
                                                  >
                                                    <span className="text-[var(--hw-ink)]">{s.label}</span>
                                                    {s.category ? (
                                                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
                                                        {s.category}
                                                      </span>
                                                    ) : null}
                                                  </button>
                                                </li>
                                              );
                                            })}
                                          </ul>
                                        );
                                      })()}

                                      {(() => {
                                        const total = tradeMeta(t).services?.length || 0;
                                        if (total <= 8) return null;
                                        return (
                                          <div className="mt-3 flex items-center justify-end">
                                            <button
                                              type="button"
                                              onClick={() => setShowAllTradeServices((v) => !v)}
                                              className="text-xs font-semibold text-[var(--hw-red)] hover:opacity-80"
                                            >
                                              {showAllTradeServices ? "Show fewer" : `View all (${total})`}
                                            </button>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>

                      {/* Services list now lives inside the selected trade card (premium expandable section). */}
                    </div>

                    <div className="mt-6 flex items-center justify-end">
                      <Button
                        type="button"
                        onClick={() => {
                          setPortalScheduleStep("date");
                          setStep("service_details");
                        }}
                        disabled={!draft.service_category}
                      >
                        Next
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
              isPortalIntake ? (
                <div>
                  <div className="text-2xl font-extrabold tracking-tight text-[var(--hw-ink)] sm:text-3xl">Tell us about the project</div>

                  <div className="mt-5">
                    <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Details</div>
                    <div className="mt-2">
                      <Textarea
                        key={issueFieldKey}
                        // Uncontrolled to avoid focus loss on re-render.
                        defaultValue={draft.issue_description}
                        ref={(el) => {
                          (issueRef as any).current = el;
                        }}
                        onInput={(e) => {
                          const v = (e.currentTarget.value || "").trim();
                          setIssueLen(v.length);
                        }}
                        placeholder="What do you need done? Add any key details (location, access, timing)."
                      />
                    </div>
                    {/* tip removed */}
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Photos / video (optional)</div>
                    </div>

                    <div className="mt-2">
                      <label className="block cursor-pointer">
                        <input
                          key={issueFileDialogNonce}
                          type="file"
                          className="hidden"
                          multiple
                          accept="image/*,video/*,.pdf,.doc,.docx,.heic"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            if (!files.length) return;
                            setIssueAttachments((prev) => [...prev, ...files].slice(0, 12));
                            // reset so selecting the same file again still triggers onChange
                            setIssueFileDialogNonce((n) => n + 1);
                          }}
                        />

                        <div
                          className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-[var(--hw-soft)]/30 p-4 transition hover:bg-[var(--hw-soft)]"
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const files = Array.from(e.dataTransfer.files || []);
                            if (!files.length) return;
                            setIssueAttachments((prev) => [...prev, ...files].slice(0, 12));
                          }}
                        >
                          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--hw-ink)]">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-[rgba(229,57,53,.18)] bg-white shadow-sm">
                              <UploadCloud className="h-5 w-5 text-[var(--hw-red)]" />
                            </span>
                            <span>Drag & drop files here, or click to upload</span>
                          </div>

                          {issuePreviews.length ? (
                            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                              {issuePreviews.map((p, idx) => (
                                <div key={idx} className="relative overflow-hidden rounded-2xl border border-[var(--hw-line)] bg-white">
                                  {p.url && p.isImage ? (
                                    <img src={p.url} alt={p.file.name} className="h-24 w-full object-cover" />
                                  ) : p.url && p.isVideo ? (
                                    <video src={p.url} className="h-24 w-full object-cover" muted />
                                  ) : (
                                    <div className="flex h-24 items-center justify-center px-3 text-center text-xs font-semibold text-[var(--hw-muted)]">
                                      {p.file.name}
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    className="absolute right-2 top-2 rounded-full border border-[var(--hw-line)] bg-white/90 px-2 py-1 text-[10px] font-semibold text-[var(--hw-ink)] hover:bg-white"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setIssueAttachments((prev) => prev.filter((_, i) => i !== idx));
                                    }}
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        try {
                          saveDraft(draft);
                        } catch {}
                        setStep("select_service");
                      }}
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        // Commit textarea → draft, then persist on step transition.
                        const text = String((issueRef as any)?.current?.value || "");
                        const nextDraft = { ...draft, issue_description: text };
                        setDraft(nextDraft);
                        try {
                          saveDraft(nextDraft);
                        } catch {}
                        setStep("property_details");
                      }}
                      disabled={issueLen === 0}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : (
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
              )
            ) : null}

            {step === "property_details" ? (
              isPortalIntake ? (
                <div>
                  <div className="text-2xl font-extrabold tracking-tight text-[var(--hw-ink)] sm:text-3xl">Property</div>
                  <div className="mt-1 text-sm text-[var(--hw-muted)]">Select the property for this work order.</div>

                  <div className="mt-5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Property</div>
                      <button
                        type="button"
                        className="text-xs font-semibold text-[var(--hw-red)] hover:opacity-80"
                        onClick={() => {
                          setAddTouched(false);
                          setAddPropMode("client");
                          setAddPropOpen(true);
                        }}
                      >
                        Add property
                      </button>
                    </div>

                    <div className="mt-3">
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

                      <div className="mt-2 text-[11px] text-[var(--hw-muted)]">
                        {propertyError ? propertyError : "Choose from your Properties."}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <Button type="button" variant="ghost" onClick={() => setStep("service_details")}>Back</Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setPortalScheduleStep("date");
                        setStep("schedule_visit");
                      }}
                      disabled={!draft.property_address.trim()}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : (
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
              )
            ) : null}

            {step === "schedule_visit" ? (
              isPortalIntake ? (
                <div>
                  {/* Portal stepper: schedule → time window → contact preference */}
                  {portalScheduleStep === "date" ? (
                    <div>
                      <div className="text-2xl font-extrabold tracking-tight text-[var(--hw-ink)] sm:text-3xl">Schedule</div>
                      <div className="mt-1 text-sm text-[var(--hw-muted)]">Choose a preferred day.</div>

                      <div className="mt-5">
                        <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Preferred date</div>
                        <div className="mt-3">
                          {(() => {
                            const selected = draft.preferred_date ? new Date(draft.preferred_date + "T00:00:00") : null;
                            const monthLabel = (d: Date) => d.toLocaleString(undefined, { month: "long", year: "numeric" });
                            const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
                            const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
                            const sameDay = (a: Date, b: Date) =>
                              a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

                            const first = startOfMonth(calMonth);
                            const last = endOfMonth(calMonth);
                            const startWeekday = first.getDay();
                            const daysInMonth = last.getDate();

                            const isBeforeMin = (d: Date) => d.getTime() < minVisitDate.getTime();

                            const days: Array<{ date: Date | null; disabled?: boolean }> = [];
                            for (let i = 0; i < startWeekday; i++) days.push({ date: null });
                            for (let day = 1; day <= daysInMonth; day++) {
                              const d = new Date(calMonth.getFullYear(), calMonth.getMonth(), day);
                              days.push({ date: d, disabled: isBeforeMin(d) });
                            }
                            while (days.length % 7 !== 0) days.push({ date: null });

                            const goMonth = (delta: number) => {
                              const next = new Date(calMonth.getFullYear(), calMonth.getMonth() + delta, 1);
                              setCalMonth(next);
                            };

                            const prevMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1);
                            const canGoPrev = endOfMonth(prevMonth).getTime() >= minVisitDate.getTime();

                            return (
                              <div className="w-full rounded-[var(--hw-radius-lg)] border border-[rgba(229,57,53,.16)] bg-[rgba(229,57,53,.04)] p-2.5">
                                <div className="flex items-center justify-between">
                                  <button
                                    type="button"
                                    disabled={!canGoPrev}
                                    onClick={() => canGoPrev && goMonth(-1)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(229,57,53,.20)] bg-white text-[var(--hw-ink)] shadow-sm disabled:opacity-40"
                                    aria-label="Previous month"
                                  >
                                    <ChevronLeft className="h-4 w-4" />
                                  </button>

                                  <div className="text-sm font-extrabold tracking-tight text-[var(--hw-ink)]">{monthLabel(calMonth)}</div>

                                  <button
                                    type="button"
                                    onClick={() => goMonth(1)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(229,57,53,.20)] bg-white text-[var(--hw-ink)] shadow-sm"
                                    aria-label="Next month"
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </button>
                                </div>

                                <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
                                  {(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const).map((w) => (
                                    <div key={w} className="py-1">
                                      {w}
                                    </div>
                                  ))}
                                </div>

                                <div className="mt-1 grid grid-cols-7 gap-[3px]">
                                  {days.map((cell, i) => {
                                    if (!cell.date) return <div key={i} className="h-8.5" />;
                                    const d = cell.date;
                                    const disabled = !!cell.disabled;
                                    const selectedDay = selected ? sameDay(selected, d) : false;
                                    return (
                                      <button
                                        key={i}
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => {
                                          const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
                                            .toISOString()
                                            .slice(0, 10);
                                          update({ preferred_date: iso, preferred_time_window: "Morning" });
                                        }}
                                        className={
                                          "h-8.5 w-full rounded-[11px] text-sm font-semibold transition " +
                                          (selectedDay
                                            ? "bg-[var(--hw-red)] text-white shadow-[0_10px_22px_rgba(229,57,53,.28)]"
                                            : disabled
                                              ? "bg-white/60 text-[var(--hw-muted)] opacity-60"
                                              : "bg-white text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]")
                                        }
                                      >
                                        {d.getDate()}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-between">
                        <Button type="button" variant="ghost" onClick={() => setStep("property_details")}>Back</Button>
                        <Button
                          type="button"
                          onClick={() => setPortalScheduleStep("window")}
                          disabled={!draft.preferred_date}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {portalScheduleStep === "window" ? (
                    <div>
                      <div className="text-2xl font-extrabold tracking-tight text-[var(--hw-ink)] sm:text-3xl">Time window</div>
                      <div className="mt-1 text-sm text-[var(--hw-muted)]">Pick a time window.</div>

                      <div className="mt-5 grid gap-2">
                        {(
                          [
                            { id: "Morning", label: "Morning", range: "7:00 AM – 10:00 AM" },
                            { id: "Midday", label: "Midday", range: "10:00 AM – 2:00 PM" },
                            { id: "Afternoon", label: "Afternoon", range: "2:00 PM – 6:00 PM" },
                            { id: "Evening", label: "Evening", range: "6:00 PM – 9:00 PM" },
                          ] as const
                        ).map((t) => {
                          const selected = draft.preferred_time_window === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => update({ preferred_time_window: t.id })}
                              className={
                                "rounded-[var(--hw-radius-lg)] border p-4 text-left transition " +
                                (selected
                                  ? "border-[rgba(229,57,53,.35)] bg-[rgba(229,57,53,.08)] ring-4 ring-[rgba(229,57,53,.10)]"
                                  : "border-[var(--hw-line)] bg-white hover:bg-[var(--hw-soft)]")
                              }
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm font-extrabold tracking-tight text-[var(--hw-ink)]">{t.label}</div>
                                  <div className="mt-1 text-xs font-semibold text-[var(--hw-muted)]">{t.range}</div>
                                </div>
                                <div className={
                                  "h-4 w-4 rounded-full border " +
                                  (selected ? "border-[var(--hw-red)] bg-[var(--hw-red)]" : "border-[var(--hw-line)] bg-white")
                                } />
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-6 flex items-center justify-between">
                        <Button type="button" variant="ghost" onClick={() => setPortalScheduleStep("date")}>Back</Button>
                        <Button type="button" onClick={() => setPortalScheduleStep("contact")}>Next</Button>
                      </div>
                    </div>
                  ) : null}

                  {portalScheduleStep === "contact" ? (
                    <div>
                      <div className="text-2xl font-extrabold tracking-tight text-[var(--hw-ink)] sm:text-3xl">Contact preference</div>
                      <div className="mt-1 text-sm text-[var(--hw-muted)]">What’s the best method to contact you?</div>

                      <div className="mt-5">
                        <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Contact preference</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(["Any", "Text", "Call", "Email"] as const).map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => update({ contact_method: m })}
                              className={
                                "h-9 rounded-full border px-4 text-xs font-semibold transition " +
                                (draft.contact_method === m
                                  ? "border-[rgba(229,57,53,.25)] bg-[rgba(229,57,53,.10)] text-[var(--hw-red)]"
                                  : "border-[var(--hw-line)] bg-white text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]")
                              }
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-between">
                        <Button type="button" variant="ghost" onClick={() => setPortalScheduleStep("window")}>Back</Button>
                        <Button
                          type="button"
                          onClick={() => void submit()}
                          disabled={!draft.preferred_date || !draft.preferred_time_window || !draft.contact_method}
                        >
                          Create Work Order
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
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
                      {(["Any", "Text", "Call", "Email"] as const).map((m) => (
                        <Button
                          key={m}
                          type="button"
                          variant={draft.contact_method === m ? "primary" : "secondary"}
                          onClick={() => update({ contact_method: m as any })}
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
              )
            ) : null}

            {!isPortalIntake ? (
              <>
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
              </>
            ) : null}
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

      {/* Add property modal (copied from the portal properties flows) */}
      <Modal
        open={addPropOpen}
        onClose={() => setAddPropOpen(false)}
        title="Add property"
        mobilePlacement="center"
        scrollKey={addPropMode}
      >
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAddPropMode("client")}
              className={
                "rounded-full px-3 py-2 text-xs font-semibold transition " +
                (addPropMode === "client"
                  ? "border border-[rgba(229,57,53,.25)] bg-[rgba(229,57,53,.10)] text-[var(--hw-red)]"
                  : "border border-[var(--hw-line)] bg-white text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]")
              }
            >
              Client property
            </button>
            <button
              type="button"
              onClick={() => setAddPropMode("property")}
              className={
                "rounded-full px-3 py-2 text-xs font-semibold transition " +
                (addPropMode === "property"
                  ? "border border-[rgba(229,57,53,.25)] bg-[rgba(229,57,53,.10)] text-[var(--hw-red)]"
                  : "border border-[var(--hw-line)] bg-white text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]")
              }
            >
              My property
            </button>
          </div>

          {addPropMode === "client" ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label className="text-xs">Client first name</Label>
                  <Input value={newClientFirstName} onChange={(e) => setNewClientFirstName(e.target.value)} placeholder="Jane" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">Client last name</Label>
                  <Input value={newClientLastName} onChange={(e) => setNewClientLastName(e.target.value)} placeholder="Client" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">Email</Label>
                <Input value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} placeholder="jane@email.com" />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">Phone</Label>
                <Input value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)} placeholder="(312) 555-0123" />
              </div>
            </>
          ) : null}

          <div className="grid gap-2">
            <Label className="text-xs">Address</Label>
            <Input
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="123 Main St, Chicago, IL 606.."
              onBlur={() => setAddTouched(true)}
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-xs">Nickname (optional)</Label>
            <Input value={newNickname} onChange={(e) => setNewNickname(e.target.value)} placeholder="Home, Lake Condo…" />
          </div>

          <div className="grid gap-2">
            <Label className="text-xs">Type of property</Label>
            <Input value={newPropertyType} onChange={(e) => setNewPropertyType(e.target.value)} placeholder="Type of Property" />
          </div>

          {addTouched && !newAddress.trim() ? (
            <div className="text-xs font-semibold text-[var(--hw-red)]">Address is required.</div>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button size="sm" variant="secondary" onClick={() => setAddPropOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={addingProp || !newAddress.trim()}
              onClick={async () => {
                setAddTouched(true);
                if (!newAddress.trim()) return;

                setAddingProp(true);
                try {
                  const createdAt = new Date().toISOString();
                  const id = `prop_${Math.random().toString(36).slice(2, 10)}`;

                  if (addPropMode === "client") {
                    const clientName = `${newClientFirstName} ${newClientLastName}`.trim();
                    writeClientProperties([
                      {
                        id,
                        createdAt,
                        address: newAddress.trim(),
                        nickname: newNickname.trim() || undefined,
                        propertyType: newPropertyType.trim() || undefined,
                        clientName: clientName || undefined,
                        clientEmail: newClientEmail.trim() || undefined,
                        clientPhone: newClientPhone.trim() || undefined,
                      },
                      ...readClientProperties(),
                    ]);
                    setPropertyFilter("client");
                  } else {
                    writeCustomProperties([
                      {
                        id,
                        createdAt,
                        address: newAddress.trim(),
                        nickname: newNickname.trim() || undefined,
                        propertyType: newPropertyType.trim() || undefined,
                      },
                      ...readCustomProperties(),
                    ]);
                    setPropertyFilter("my");
                  }

                  // Update selected property + draft address immediately
                  setSelectedPropertyId(id);
                  update({ property_address: newAddress.trim() });

                  // Reset
                  setNewAddress("");
                  setNewNickname("");
                  setNewPropertyType("");
                  setNewClientFirstName("");
                  setNewClientLastName("");
                  setNewClientEmail("");
                  setNewClientPhone("");
                  setAddTouched(false);
                  setAddPropOpen(false);

                  // Refresh options list (will merge local + api)
                  setPropertyOptions((prev) => {
                    // optimistic: insert at top
                    const label = (newNickname.trim() || newAddress.trim()).trim();
                    const sublabel = addPropMode === "client" ? `Client • ${newAddress.trim()}` : `My • ${newAddress.trim()}`;
                    const kind = addPropMode === "client" ? ("client" as const) : ("my" as const);
                    const next = [{ id, label, sublabel, address: newAddress.trim(), kind }, ...prev];
                    const seen = new Set<string>();
                    const out: typeof next = [];
                    for (const o of next) {
                      if (!o?.id || seen.has(String(o.id))) continue;
                      seen.add(String(o.id));
                      out.push(o);
                    }
                    return out;
                  });
                } finally {
                  setAddingProp(false);
                }
              }}
            >
              {addingProp ? "Adding…" : "Add property"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
    </Shell>
  );
}
