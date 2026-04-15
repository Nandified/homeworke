"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  ArrowRight,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Droplet,
  Hammer,
  Home,
  Layers,
  Paperclip,
  Shield,
  Sparkles,
  Wind,
  Zap,
} from "lucide-react";

import { Button, Input, Label, Modal, Picker, Pill } from "@/components/ui";

import { ensureDemoPartnerContext, isDemoMode, withDemo } from "@/lib/demo";
import { loadPartner } from "@/lib/partner-context";

type IntakeClassifyResult = {
  ok: boolean;
  used?: "openai" | "fallback" | string;
  // If false, the request is out-of-scope for the currently supported service catalog.
  supported?: boolean;
  userMessage?: string;

  serviceId?: string;
  trade?: string;
  category?: string;
  subcategory?: string;
  confidence?: number;
  aiSummary?: string;
  urgency?: "emergency" | "asap" | "this_week" | "flexible";
  safetyFlags?: string[];
  clarifyingQuestions?: string[];
  error?: string;
  detail?: string;
};

type PropertyLite = {
  id: string;
  nickname?: string | null;
  address1: string;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
};

type Turn = {
  role: "user" | "assistant";
  text: string;
};

type StoredProperty = { id: string; createdAt: string; address: string; nickname?: string };

function isOutOfScope(text: string) {
  const t = (text || "").toLowerCase();
  return /xbox|playstation|ps5|ps4|nintendo|switch|steam|gaming|game\b|laptop|computer|pc\b|mac\b|printer|scanner|iphone|android|ipad|tablet|it\s+help|tech\s+support|wifi|router|massage|therap(y|ist)|counsel(or|ing)|chiropract|dentist|doctor|lawyer|attorney|babysit|nanny|pet\s*sit|dog\s*walk|tutor|lessons|guitar\s+lesson|piano\s+lesson/.test(
    t
  );
}

function outOfScopeMessage(text: string) {
  const t = (text || "").toLowerCase();
  const vibe: "playful" | "pro" = Math.random() < 0.5 ? "playful" : "pro";

  const bucket =
    /xbox|playstation|ps5|ps4|nintendo|switch|steam|game|gaming/.test(t)
      ? "gaming"
      : /massage|therap(y|ist)|counsel(or|ing)|chiropract|dentist|doctor|lawyer|attorney/.test(t)
        ? "services"
        : /laptop|computer|pc\b|mac\b|windows|wifi|router|internet|bluetooth/.test(t)
          ? "computer"
          : /printer|scan|scanner|paper jam|toner|ink/.test(t)
            ? "printer"
            : /iphone|android|phone|ipad|tablet/.test(t)
              ? "phone"
              : "tech";

  const pro: Record<string, string[]> = {
    gaming: [
      "Home services only — we don’t do gaming help.",
      "We handle home repairs (plumbing, electrical, HVAC, etc.) — not gaming support.",
    ],
    services: [
      "We’re focused on home repairs — not personal services like massage.",
      "Home services only (repairs/maintenance) — not appointments like massage.",
    ],
    computer: [
      "Home services only — we don’t do computer/IT support.",
      "We handle home repairs (plumbing, electrical, HVAC, etc.) — not tech support.",
    ],
    printer: [
      "Home services only — we don’t do printer/IT support.",
      "We handle home repairs — not printer setup.",
    ],
    phone: [
      "Home services only — we don’t do phone/tablet support.",
      "We handle home repairs — not mobile tech support.",
    ],
    tech: [
      "Home services only — we don’t do tech support.",
      "We handle home repairs — not IT help.",
    ],
  };

  const playful: Record<string, string[]> = {
    gaming: [
      "I can help with leaky pipes, not level-ups. Home services only.",
      "I fix houses, not high scores. What’s going on at the property?",
      "I’m great with roofs, not raids. Home services only.",
    ],
    services: [
      "I’m more ‘fix the house’ than ‘spa day’. Home services only.",
      "I can book a plumber faster than I can book a masseuse. Home services only.",
    ],
    computer: [
      "I can help with outlets, not Outlook. Home services only.",
      "I do plumbing, not PCs. Try me with a home repair.",
      "I’m handy with hammers, not hardware drivers. Home services only.",
    ],
    printer: [
      "I can fix a leak faster than a printer can print. Home services only.",
      "I do drywall, not drivers. Home services only.",
    ],
    phone: [
      "I do HVAC, not iOS. Home services only.",
      "I can help with water heaters, not screen protectors. Home services only.",
    ],
    tech: [
      "I’m your home-fix sidekick, not your IT department. Home services only.",
      "I can help with home repairs, not tech repairs. What’s the home issue?",
    ],
  };

  const pool = (vibe === "playful" ? playful : pro)[bucket] || pro.tech;
  return pool[Math.floor(Math.random() * pool.length)] || pro.tech[0];
}

type StoredClientProperty = {
  id: string;
  createdAt: string;
  address: string;
  nickname?: string;
  propertyType?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
};

const STORAGE_KEYS = {
  customProps: "hw_props_custom_v1",
  clientProps: "hw_props_client_v1",
} as const;

function readCustomProperties(): StoredProperty[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.customProps) || "[]";
    const arr = JSON.parse(raw) as StoredProperty[];
    return Array.isArray(arr) ? arr.filter((p) => p && typeof p.id === "string") : [];
  } catch {
    return [];
  }
}

function writeCustomProperties(items: StoredProperty[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.customProps, JSON.stringify(items.slice(0, 50)));
  } catch {
    // ignore
  }
}

function readClientProperties(): StoredClientProperty[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.clientProps) || "[]";
    const arr = JSON.parse(raw) as StoredClientProperty[];
    return Array.isArray(arr) ? arr.filter((p) => p && typeof p.id === "string") : [];
  } catch {
    return [];
  }
}

function writeClientProperties(items: StoredClientProperty[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.clientProps, JSON.stringify(items.slice(0, 200)));
  } catch {
    // ignore
  }
}

export function AIWorkOrderIntakeCard(props: {
  eyebrow?: string;
  title?: string;
  primaryCta?: string;
  secondaryCta?: string;
  prefillIssue?: string;
  showServicingPill?: boolean;
}) {
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const issueRef = useRef<HTMLTextAreaElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const sendInFlightRef = useRef(false);

  const [issue, setIssue] = useState(props.prefillIssue || "");
  const [attachments, setAttachments] = useState<File[]>([]);

  const [properties, setProperties] = useState<PropertyLite[] | null>(null);
  const [propertyId, setPropertyId] = useState<string>("");

  const [classifying, setClassifying] = useState(false);
  const [classifyError, setClassifyError] = useState<string>("");
  const [result, setResult] = useState<IntakeClassifyResult | null>(null);

  const [turns, setTurns] = useState<Turn[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [qIndex, setQIndex] = useState<number>(0);
  const [rootIssue, setRootIssue] = useState<string>("");

  const [visitDate, setVisitDate] = useState<string>("");
  const [visitWindow, setVisitWindow] = useState<"Morning" | "Midday" | "Afternoon" | "Evening">("Morning");
  const [contactMethod, setContactMethod] = useState<"Text" | "Email">("Text");
  const [contactTouched, setContactTouched] = useState(false);
  const [submittingVisit, setSubmittingVisit] = useState(false);
  const [submittedWorkOrderId, setSubmittedWorkOrderId] = useState<string>("");

  const [manualOpen, setManualOpen] = useState(true);
  const [assistantThinking, setAssistantThinking] = useState(false);

  const [isDesktop, setIsDesktop] = useState(false);
  const [compactComposer, setCompactComposer] = useState(false);

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

  const started = turns.length > 0 || classifying || assistantThinking || !!result?.ok || !!classifyError;
  const currentQuestion = questions[qIndex] || "";
  const isSupported = result?.supported !== false;
  const awaitingAnswers = !!result?.ok && isSupported && qIndex < questions.length;
  const currentQ = questions[qIndex] || "";
  const currentQWantsUpload = /(upload|add)\s+(a\s+)?(photo|video|picture|image)|\bphoto\/video\b|\bphotos\b|\bvideos\b/i.test(currentQ);
  const readyToSchedule = !!result?.ok && isSupported && qIndex >= questions.length;

  const [scheduleStage, setScheduleStage] = useState<
    "idle" | "ask" | "property" | "datetime" | "contact" | "done"
  >("idle");

  // Calendar UI (preferred date)
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
    const base = visitDate ? new Date(visitDate + "T00:00:00") : minVisitDate;
    setCalMonth(new Date(base.getFullYear(), base.getMonth(), 1));
  }, [visitDate, minVisitDate]);

  const hints = useMemo(() => ["water under kitchen sink", "outlet stopped working", "AC not cooling", "need drywall patch"], []);
  const [demoIdx, setDemoIdx] = useState(0);
  const [demoText, setDemoText] = useState("");
  const demoPhase = useRef<"typing" | "pause" | "deleting">("typing");
  const pauseUntil = useRef<number>(0);

  // Auto-scroll chat to bottom on new messages / stage changes
  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    const t = window.setTimeout(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, 0);
    return () => window.clearTimeout(t);
  }, [turns.length, assistantThinking, classifying, classifyError, scheduleStage]);

  // Typewriter hints (only before first send)
  useEffect(() => {
    if (issue.trim() || started) return;

    const tick = () => {
      const now = Date.now();
      const full = hints[demoIdx] ?? "";

      if (demoPhase.current === "pause") {
        if (now >= pauseUntil.current) demoPhase.current = "deleting";
        return;
      }

      if (demoPhase.current === "typing") {
        const next = full.slice(0, demoText.length + 1);
        setDemoText(next);
        if (next.length >= full.length) {
          demoPhase.current = "pause";
          pauseUntil.current = now + 1100;
        }
        return;
      }

      const next = full.slice(0, Math.max(0, demoText.length - 1));
      setDemoText(next);
      if (next.length === 0) {
        demoPhase.current = "typing";
        setDemoIdx((i) => (i + 1) % hints.length);
      }
    };

    const speed = demoPhase.current === "deleting" ? 26 : 34;
    const t = window.setInterval(tick, speed);
    return () => window.clearInterval(t);
  }, [issue, started, demoIdx, demoText.length, hints]);

  // Desktop detection (coarse but effective): fine pointer + hover = desktop/laptop.
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setIsDesktop(!!mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  // Autogrow textarea
  useEffect(() => {
    const el = issueRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [issue]);

  // Best-effort property list (demo token for PRO portal until auth is wired)
  useEffect(() => {
    const run = async () => {
      try {
        const url = new URL("/api/properties", window.location.origin);
        url.searchParams.set("token", "demo");
        const res = await fetch(url);
        const j = await res.json().catch(() => null);
        const base = j?.ok && Array.isArray(j.properties) ? (j.properties as PropertyLite[]) : [];

        // Merge locally-created properties (same storage as ProPropertiesClient)
        const custom = readCustomProperties().map<PropertyLite>((p) => ({
          id: p.id,
          nickname: p.nickname || null,
          address1: p.address,
          city: null,
          state: null,
          zip: null,
        }));
        const clients = readClientProperties().map<PropertyLite>((p) => ({
          id: p.id,
          nickname: p.nickname || null,
          address1: p.address,
          city: null,
          state: null,
          zip: null,
        }));

        const merged = [...clients, ...custom, ...base];
        setProperties(merged);
        if (merged.length === 1) setPropertyId(String(merged[0].id));
      } catch {
        // ignore
      }
    };
    run();
  }, []);

  // Scheduling lane: advance step-by-step (so it feels concierge, not a lead form).
  useEffect(() => {
    if (!readyToSchedule) return;

    if (scheduleStage === "idle") {
      // Show the scheduling card prompt (rendered below). No need to also push a chat turn,
      // otherwise "Ready to schedule a visit?" appears twice.
      setScheduleStage("ask");
      return;
    }

    if (scheduleStage === "property" && propertyId) {
      setScheduleStage("datetime");
      setTurns((prev) => [...prev, { role: "assistant", text: "Great. What day works best?" }]);
      return;
    }

    if (scheduleStage === "datetime" && visitDate) {
      setScheduleStage("contact");
      setTurns((prev) => [...prev, { role: "assistant", text: "Got it. What’s the best way to reach you?" }]);
      return;
    }
  }, [readyToSchedule, scheduleStage, propertyId, visitDate]);

  function resetIntakeKeepDraft() {
    setClassifyError("");
    setClassifying(false);
    setAssistantThinking(false);
    setResult(null);
    setTurns([]);
    setQuestions([]);
    setAnswers([]);
    setQIndex(0);
    setRootIssue("");
    setVisitDate("");
    setVisitWindow("Morning");
    setContactMethod("Text");
    setContactTouched(false);
    setSubmittingVisit(false);
    setSubmittedWorkOrderId("");
    setScheduleStage("idle");

    setManualOpen(true);
    setCompactComposer(false);
  }

  async function send() {
    const text = issue.trim();
    // Prevent accidental double-submits (Enter key repeat, etc.)
    if (!text || classifying || assistantThinking || sendInFlightRef.current) return;

    // Global commands (never classify these)
    const cmd = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (["start over", "restart", "reset", "new request", "new issue"].includes(cmd)) {
      resetIntakeKeepDraft();
      setAttachments([]);
      setIssue("");
      setTurns([]);
      setTimeout(() => issueRef.current?.focus(), 0);
      return;
    }

    sendInFlightRef.current = true;

    try {

    // If intake is complete, treat chat input as confirmation ("book it", "schedule", etc.)
    if (readyToSchedule) {
      const confirm = text.toLowerCase();
      const isYes = /(\byes\b|\byeah\b|\byep\b|\byup\b|\bsure\b|\bok\b|\bokay\b|\bok\s+let'?s\s+do\s+it\b|\blet'?s\s+do\s+it\b|\bplease\b|\bdo\s+it\b|\bgo\s+ahead\b|\blet'?s\s+go\b|\blet'?s\s+schedule\b|\bschedule(\s+it)?\b|\bbook(\s+it)?\b|\bset\s+it\s+up\b|\bconfirm\b|\bsubmit\b|\brequest\b|\brequest\s+it\b|\bstart\s+it\b|\bsounds\s+good\b|\bworks\s+for\s+me\b|\bsend\s+it\b)/i.test(confirm);
      const isNo = /(\bno\b|\bnope\b|\bnah\b|\bdon't\b|\bdo\s+not\b|\bnot\s+now\b|\bnot\s+yet\b|\bcancel\b|\bstop\b|\bnever\s+mind\b|\bhold\s+on\b|\bwait\b)/i.test(confirm);

      setTurns((prev) => [...prev, { role: "user", text }]);
      setIssue("");

      if (isYes) {
        // Move through the scheduling lane step-by-step.
        if (scheduleStage === "ask" || scheduleStage === "idle") {
          setScheduleStage("property");
          setAssistantThinking(true);
          window.setTimeout(() => {
            setAssistantThinking(false);
            setTurns((prev) => [...prev, { role: "assistant", text: "Great — which property is this for?" }]);
          }, 500);
          return;
        }

        if (scheduleStage === "property") {
          if (!propertyId) {
            setTurns((prev) => [...prev, { role: "assistant", text: "Pick a property below (or add one)." }]);
            return;
          }
          // Selecting a property auto-advances via effect.
          return;
        }

        if (scheduleStage === "datetime") {
          if (!visitDate) {
            setTurns((prev) => [...prev, { role: "assistant", text: "Add a preferred date below." }]);
            return;
          }
          // visitDate auto-advances via effect.
          return;
        }

        if (scheduleStage === "contact") {
          // They can confirm via button or by typing. If required fields exist, submit.
          if (!propertyId || !visitDate) {
            setTurns((prev) => [...prev, { role: "assistant", text: "Almost there — pick a property and preferred date." }]);
            return;
          }
          scheduleVisit();
          return;
        }

        // Fallback
        scheduleVisit();
        return;
      }

      if (isNo) {
        // Exit the booking-confirmation lane and let them continue chatting naturally.
        setResult(null);
        setQuestions([]);
        setAnswers([]);
        setQIndex(0);
        setRootIssue("");
        setScheduleStage("idle");
        setCompactComposer(false);
        setManualOpen(true);
        setIssue("");

        setAssistantThinking(true);
        window.setTimeout(() => {
          setAssistantThinking(false);
          setTurns((prev) => [
            ...prev,
            {
              role: "assistant",
              text: "No problem. What would you like to do next—change the request, or start over?",
            },
          ]);
        }, 700);

        return;
      }

      setTurns((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "To continue, tap ‘Schedule a visit’. (Or type ‘yes’.)",
        },
      ]);

      return;
    }

    // If we're in Q&A mode, treat send as the answer to the current question.
    if (awaitingAnswers) {
      setCompactComposer(true);
      const nextAnswers = answers.slice();
      nextAnswers[qIndex] = text;
      setAnswers(nextAnswers);

      setTurns((prev) => [...prev, { role: "user", text }]);
      setIssue("");

      const nextIdx = qIndex + 1;

      // Add a short "thinking" beat so it feels natural even when the model is fast.
      setAssistantThinking(true);
      window.setTimeout(() => {
        setAssistantThinking(false);
        setQIndex(nextIdx);
        if (nextIdx < questions.length) {
          setTurns((prev) => [...prev, { role: "assistant", text: questions[nextIdx] }]);
        }
      }, 1000);

      return;
    }

    // Otherwise this is the initial issue description.
    setCompactComposer(true);
    setManualOpen(false);
    setClassifyError("");
    setClassifying(true);
    setAssistantThinking(false);
    setResult(null);
    setQuestions([]);
    setAnswers([]);
    setQIndex(0);

    setRootIssue(text);
    setTurns((prev) => [...prev, { role: "user", text }]);
    // Clear the composer immediately so it doesn't look "stuck" while we classify.
    setIssue("");

    // If it's out-of-scope, still call the API so the LLM can generate a contextual funny reply.
    // We'll only fall back to local copy if the request fails.

    try {
      const res = await fetch("/api/work-orders/intake-classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const j = (await res.json().catch(() => null)) as IntakeClassifyResult | null;
      if (!res.ok || !j || !j.ok) {
        // For out-of-scope prompts, never show the red "couldn't analyze" error.
        if (isOutOfScope(text)) {
          setTurns((prev) => [...prev, { role: "assistant", text: outOfScopeMessage(text) }]);
          setQuestions([]);
          setAnswers([]);
          setQIndex(0);
          setScheduleStage("idle");
          setClassifyError("");
          return;
        }

        setClassifyError(j?.error || `classify_failed_${res.status}`);
        return;
      }

      setResult(j);

      // Out-of-scope guard (e.g. computer repair). Show a friendly message and stop.
      if (j.supported === false) {
        const msg =
          j.userMessage ||
          "That’s a good ask — but right now Homeworke is focused on home services (plumbing, electrical, HVAC, etc.). Tech support is coming soon.";
        setTurns((prev) => [...prev, { role: "assistant", text: msg }]);
        setQuestions([]);
        setAnswers([]);
        setQIndex(0);
        setScheduleStage("idle");
        return;
      }

      const qs = (Array.isArray(j.clarifyingQuestions) ? j.clarifyingQuestions : []).filter(Boolean).slice(0, 3);
      // If model returns none, still keep 1 generic question for concierge feel.
      const normalized = qs.length
        ? qs
        : [
            "Anything else that would help? For example: a photo/video, where in the home it is (kitchen/bathroom/etc), and when you’d like someone to come out.",
          ];

      setQuestions(normalized);
      setAnswers(new Array(normalized.length).fill(""));
      setQIndex(0);
      setScheduleStage("idle");

      // Assistant: suggested + first question
      const suggestedLine = `Suggested: ${j.trade || ""}${j.subcategory ? ` · ${j.subcategory}` : ""}`.trim();
      const confLine = typeof j.confidence === "number" ? `Confidence ${(j.confidence * 100).toFixed(0)}%` : "";
      const header = [suggestedLine, confLine].filter(Boolean).join(" — ");

      setTurns((prev) => [...prev, { role: "assistant", text: header || "Got it." }, { role: "assistant", text: normalized[0] }]);

      setIssue("");
    } catch {
      // If API fails, avoid the red error for obvious out-of-scope prompts.
      if (isOutOfScope(text)) {
        setTurns((prev) => [...prev, { role: "assistant", text: outOfScopeMessage(text) }]);
        setQuestions([]);
        setAnswers([]);
        setQIndex(0);
        setScheduleStage("idle");
        setClassifyError("");
      } else {
        setClassifyError("classify_fetch_error");
      }
    } finally {
      setClassifying(false);
    }
  } finally {
    sendInFlightRef.current = false;
  }
  }

  async function scheduleVisit() {
    if (!result?.ok) return;
    if (result.supported === false) return;
    if (submittingVisit) return;
    if (!propertyId) return;
    if (!visitDate) return;
    if (questions.length && answers.some((a) => !String(a || "").trim())) return;

    const prop = properties?.find((p) => String(p.id) === String(propertyId)) || null;

    const qnaLines = questions
      .map((q, i) => ({ q, a: answers[i] || "" }))
      .filter((x) => (x.q || "").trim() || (x.a || "").trim())
      .map((x) => `- ${String(x.q).trim()} ${String(x.a).trim()}`.trim())
      .join("\n");

    const issueDescription =
      (result.aiSummary || rootIssue || "").trim() +
      (qnaLines ? `\n\nDetails from chat:\n${qnaLines}` : "");

    let token = "demo";
    try {
      const raw = window.localStorage.getItem("hw_session_v1");
      const j = raw ? JSON.parse(raw) : null;
      if (j?.token) token = String(j.token);
    } catch {}

    let originPartnerId: string | null = null;
    const shareWithPartner = true;
    try {
      if (isDemoMode()) ensureDemoPartnerContext();
      const p = loadPartner();
      if (p?.partnerId) originPartnerId = p.partnerId;
    } catch {}

    setSubmittingVisit(true);
    try {
      const res = await fetch("/api/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          originPartnerId,
          shareWithPartner,
          intake: {
            service_category: result.trade || "General",
            service_subcategory: result.subcategory || "",
            issue_description: issueDescription,
            urgency_level: result.urgency || "this_week",
            property_address: prop?.address1 || "",
            property_type: "",
            preferred_date: visitDate,
            preferred_time_window: visitWindow,
          },
        }),
      });

      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok || !j?.workOrder?.id) {
        setTurns((prev) => [
          ...prev,
          { role: "assistant", text: "Something went wrong submitting that. Please try again." },
        ]);
        return;
      }

      const id = String(j.workOrder.id);
      setSubmittedWorkOrderId(id);

      setTurns((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Submitted. A Home Guide will coordinate scheduling with our Project Manager and confirm shortly.",
        },
      ]);

      // Collapse manual section; keep composer compact.
      setManualOpen(false);
      setCompactComposer(true);
    } catch {
      setTurns((prev) => [
        ...prev,
        { role: "assistant", text: "Something went wrong submitting that. Please try again." },
      ]);
    } finally {
      setSubmittingVisit(false);
    }
  }

  const sendDisabled =
    classifying ||
    !issue.trim() ||
    // While in Q&A mode, force answers through the same composer (send is fine)
    false;

  return (
    <div
      className={
        "rounded-[var(--hw-radius-lg)] p-5 hw-glass flex flex-col " +
        (started ? "overflow-hidden" : "")
      }
      style={started ? { height: "min(50vh, 680px)" } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
            {props.eyebrow || "Job work order"}
          </div>
          <div className="mt-1 text-xl font-extrabold tracking-tight text-[var(--hw-ink)] sm:text-2xl">
            {props.title || "What do you need help with?"}
          </div>
        </div>
        <Pill className="self-start whitespace-nowrap text-[10px] px-2 py-1 border border-[rgba(229,57,53,.22)] text-white bg-gradient-to-r from-[rgba(229,57,53,.95)] via-[rgba(236,72,153,.92)] to-[rgba(168,85,247,.90)] shadow-sm">
          Homeworke AI
        </Pill>
      </div>

      {/* Conversation area */}
      {started ? (
        <div className="mt-4 flex-1 min-h-0 overflow-hidden rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white/70 p-4">
          <div
            ref={chatScrollRef}
            className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto pr-2"
          >
            {turns.map((t, idx) => {
              const wantsUpload =
                t.role === "assistant" &&
                /(upload|add)\s+(a\s+)?(photo|video|picture|image)|\bphoto\/video\b|\bphotos\b|\bvideos\b/i.test(t.text || "");

              // Only show the CTA on the most recent assistant prompt while we're awaiting an answer.
              const isLatestAssistant = t.role === "assistant" && idx === turns.length - 1;
              const showUploadCtas = awaitingAnswers && isLatestAssistant && currentQWantsUpload;

              return (
                <div key={idx} className={t.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={
                      t.role === "user"
                        ? "max-w-[92%] rounded-2xl bg-black px-4 py-2.5 text-sm leading-6 text-white shadow-sm"
                        : "max-w-[95%] rounded-2xl border border-[rgba(229,57,53,.12)] bg-white px-4 py-3 text-sm leading-6 text-[var(--hw-ink)] shadow-sm"
                    }
                  >
                    <div>{t.text}</div>

                    {showUploadCtas ? (
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-[var(--hw-line)] bg-white px-3 py-2 text-xs font-semibold text-[var(--hw-ink)] hover:bg-[var(--hw-soft)] sm:w-auto"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Paperclip className="h-3.5 w-3.5" />
                          Add photos/videos
                        </button>

                        <button
                          type="button"
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[var(--hw-red)] px-3 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95 sm:w-auto"
                          onClick={() => {
                            // Advance without forcing a text reply.
                            const nextAnswers = answers.slice();
                            nextAnswers[qIndex] = nextAnswers[qIndex] || (attachments.length ? `${attachments.length} attachment(s) added.` : "No media provided.");
                            setAnswers(nextAnswers);

                            setAssistantThinking(true);
                            window.setTimeout(() => {
                              setAssistantThinking(false);
                              const nextIdx = qIndex + 1;
                              setQIndex(nextIdx);
                              if (nextIdx < questions.length) {
                                setTurns((prev) => [...prev, { role: "assistant", text: questions[nextIdx] }]);
                              }
                            }, 450);
                          }}
                        >
                          Continue
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    ) : wantsUpload ? (
                      <div className="mt-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--hw-line)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--hw-muted)] hover:bg-[var(--hw-soft)]"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Paperclip className="h-3.5 w-3.5" />
                          Add photos/videos
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {classifying || assistantThinking ? (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-[rgba(229,57,53,.12)] bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--hw-muted)] animate-pulse" style={{ animationDelay: "0ms" }} />
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--hw-muted)] animate-pulse" style={{ animationDelay: "180ms" }} />
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--hw-muted)] animate-pulse" style={{ animationDelay: "360ms" }} />
                  </div>
                </div>
              </div>
            ) : null}

            {classifyError ? (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-[rgba(229,57,53,.22)] bg-[rgba(229,57,53,.06)] px-4 py-3 text-sm font-semibold text-[var(--hw-red)]">
                  We couldn’t analyze that. Please try again.
                </div>
              </div>
            ) : null}

            {readyToSchedule ? (
              <div className="flex justify-start">
                <div className="w-full max-w-[95%] rounded-2xl border border-[rgba(229,57,53,.12)] bg-white px-4 py-3 text-sm leading-6 text-[var(--hw-ink)] shadow-sm">
                  {/* (removed "Next" label; redundant) */}
                  <div className="mt-1">
                    {scheduleStage === "ask" || scheduleStage === "idle"
                      ? "Ready to schedule a visit?"
                      : scheduleStage === "property"
                        ? "First, pick the property."
                        : scheduleStage === "datetime"
                          ? "Choose a preferred day and time window."
                          : scheduleStage === "contact"
                            ? "Last, confirm how we should reach you."
                            : ""}
                  </div>

                  {scheduleStage === "ask" ? (
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <Button
                        className="w-full sm:w-auto"
                        type="button"
                        onClick={() => {
                          setScheduleStage("property");
                          setTurns((prev) => [...prev, { role: "assistant", text: "Great — which property is this for?" }]);
                        }}
                      >
                        Yes
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                      <Button
                        className="w-full sm:w-auto"
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          // Exit scheduling lane
                          setResult(null);
                          setQuestions([]);
                          setAnswers([]);
                          setQIndex(0);
                          setRootIssue("");
                          setCompactComposer(false);
                          setManualOpen(true);
                        }}
                      >
                        Not now
                      </Button>
                    </div>
                  ) : null}

                  {scheduleStage === "property" ? (
                    <div className="mt-4">
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
                      <div className="mt-2">
                        <Picker
                          searchable
                          searchPlaceholder="Search properties…"
                          value={propertyId}
                          placeholder="Select a property…"
                          options={(properties || []).map((p) => ({
                            id: String(p.id),
                            label:
                              (p.nickname ? `${p.nickname} · ` : "") +
                              p.address1 +
                              (p.city ? `, ${p.city}` : "") +
                              (p.state ? `, ${p.state}` : ""),
                            sublabel: p.zip ? String(p.zip) : undefined,
                          }))}
                          onChange={(id) => setPropertyId(String(id || ""))}
                        />
                      </div>
                    </div>
                  ) : null}

                  {scheduleStage === "datetime" ? (
                    <div className="mt-4">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Preferred date</div>
                        <div className="mt-3">
                          {(() => {
                            const selected = visitDate ? new Date(visitDate + "T00:00:00") : null;
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
                              <div className="w-full rounded-[var(--hw-radius-lg)] border border-[rgba(229,57,53,.16)] bg-[rgba(229,57,53,.04)] p-4">
                                <div className="flex items-center justify-between">
                                  <button
                                    type="button"
                                    disabled={!canGoPrev}
                                    onClick={() => canGoPrev && goMonth(-1)}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(229,57,53,.20)] bg-white text-[var(--hw-ink)] shadow-sm disabled:opacity-40"
                                    aria-label="Previous month"
                                  >
                                    <ChevronLeft className="h-4 w-4" />
                                  </button>

                                  <div className="text-base font-extrabold tracking-tight text-[var(--hw-ink)]">{monthLabel(calMonth)}</div>

                                  <button
                                    type="button"
                                    onClick={() => goMonth(1)}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(229,57,53,.20)] bg-white text-[var(--hw-ink)] shadow-sm"
                                    aria-label="Next month"
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </button>
                                </div>

                                <div className="mt-4 grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
                                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((w) => (
                                    <div key={w} className="py-1">{w}</div>
                                  ))}
                                </div>

                                <div className="mt-1 grid grid-cols-7 gap-2">
                                  {days.map((cell, i) => {
                                    if (!cell.date) return <div key={i} className="h-11" />;
                                    const d = cell.date;
                                    const disabled = !!cell.disabled;
                                    const selectedDay = selected ? sameDay(selected, d) : false;
                                    return (
                                      <button
                                        key={i}
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => {
                                          const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
                                          setVisitDate(iso);
                                        }}
                                        className={
                                          "h-11 w-full rounded-[14px] text-sm font-semibold transition " +
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

                      <div className="mt-5">
                        <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Time window</div>
                        <div className="mt-2 grid gap-2">
                          {(
                            [
                              { id: "Morning", label: "Morning", range: "7:00 AM – 10:00 AM" },
                              { id: "Midday", label: "Midday", range: "10:00 AM – 2:00 PM" },
                              { id: "Afternoon", label: "Afternoon", range: "2:00 PM – 6:00 PM" },
                              { id: "Evening", label: "Evening", range: "6:00 PM – 9:00 PM" },
                            ] as const
                          ).map((t) => {
                            const selected = visitWindow === t.id;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => setVisitWindow(t.id)}
                                className={
                                  "flex w-full items-center justify-between gap-3 rounded-[18px] border px-4 py-3 text-left transition " +
                                  (selected
                                    ? "border-[rgba(229,57,53,.35)] bg-[rgba(229,57,53,.08)]"
                                    : "border-[var(--hw-line)] bg-white hover:bg-[var(--hw-soft)]")
                                }
                              >
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-[var(--hw-ink)]">{t.label}</div>
                                  <div className="mt-0.5 text-xs font-medium text-[var(--hw-muted)]">{t.range}</div>
                                </div>
                                <div
                                  className={
                                    "h-5 w-5 rounded-full border transition " +
                                    (selected
                                      ? "border-[var(--hw-red)] bg-[var(--hw-red)] shadow-[0_4px_14px_rgba(229,57,53,.25)]"
                                      : "border-[var(--hw-line)] bg-white")
                                  }
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {scheduleStage === "contact" ? (
                    <div className="mt-4">
                      <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Contact</div>
                      {!submittedWorkOrderId ? <div className="mt-2 flex flex-wrap gap-2">
                        {(["Text", "Email"] as const).map((m) => (
                          <Button
                            key={m}
                            type="button"
                            variant={contactMethod === m ? "primary" : "secondary"}
                            onClick={() => {
                              setContactMethod(m);
                              setContactTouched(true);
                            }}
                          >
                            {m}
                          </Button>
                        ))}
                      </div> : null}

                      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
                        {submittedWorkOrderId ? (
                          <Button
                            className="w-full sm:w-auto"
                            type="button"
                            onClick={() => {
                              const path = window.location.pathname || "";
                              const base = path.startsWith("/partner") ? "/partner" : path.startsWith("/pro") ? "/pro" : "/pro";
                              router.push(withDemo(`${base}/jobs/${encodeURIComponent(submittedWorkOrderId)}`));
                            }}
                          >
                            View request
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            className="w-full sm:w-auto"
                            onClick={scheduleVisit}
                            disabled={!propertyId || !visitDate || submittingVisit || !contactTouched}
                          >
                            Schedule a visit
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        )}

                        <button
                          type="button"
                          className="text-sm font-semibold text-[var(--hw-muted)] hover:text-[var(--hw-ink)]"
                          onClick={() => {
                            // True restart
                            resetIntakeKeepDraft();
                            setAttachments([]);
                            setIssue("");
                            setTimeout(() => issueRef.current?.focus(), 0);
                          }}
                        >
                          Start over
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {attachments.length ? (
                    <div className="mt-3 text-xs font-semibold text-[var(--hw-ink)]">{attachments.length} attachment(s) added</div>
                  ) : null}

                  <div className="mt-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--hw-line)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--hw-muted)] hover:bg-[var(--hw-soft)]"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      Add photos/videos
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Composer */}
      <div className="mt-4 flex-none">
        <div className="relative rounded-[var(--hw-radius-lg)] hw-glass-field">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (!files.length) return;

              setAttachments((prev) => [...prev, ...files].slice(0, 10));

              // If we're currently answering a question and the assistant asked for photos/videos,
              // treat attaching media as a valid "answer" and advance automatically.
              const expectsMedia = /(upload|add)\s+(a\s+)?(photo|video|picture|image)|\bphoto\/video\b|\bphotos\b|\bvideos\b/i.test(
                (questions[qIndex] || "") + " " + (turns[turns.length - 1]?.text || "")
              );

              // With Option A (Add + Continue), don't auto-advance on upload.
              // Users often add photos one-at-a-time.
              if (awaitingAnswers && expectsMedia) {
                setCompactComposer(true);
              }

              e.target.value = "";
            }}
          />

          <textarea
            ref={issueRef}
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === "Enter" && (e as any).repeat) return;

              // Desktop: Enter to send, Shift+Enter for newline.
              if (e.key === "Enter" && isDesktop && !e.shiftKey && !e.altKey) {
                e.preventDefault();
                await send();
                return;
              }

              // Power-user shortcut (everywhere): Cmd/Ctrl+Enter to send.
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                await send();
              }
            }}
            placeholder=""
            aria-label="Message"
            rows={compactComposer ? 1 : 3}
            className="w-full resize-none rounded-[var(--hw-radius-lg)] bg-transparent px-4 py-3 pr-28 text-[17px] leading-7 border-0 outline-none"
            style={{ minHeight: compactComposer ? 64 : 140 }}
          />

          {!issue && !started ? (
            <div
              aria-hidden
              className="pointer-events-none absolute left-4 top-[12px] flex items-baseline gap-1 text-[16px] leading-7 text-[var(--hw-muted)]"
            >
              <span className="opacity-70">Try:</span>
              <span className="font-medium text-[#4b5563]">{demoText}</span>
              <span className="hw-caret" />
            </div>
          ) : null}

          <button
            type="button"
            title="Add photos/videos"
            aria-label="Add photos/videos"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-3 right-[54px] inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--hw-line)] bg-white text-[var(--hw-muted)] shadow-sm hover:bg-[var(--hw-soft)]"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          <button
            type="button"
            aria-label="Send"
            onClick={send}
            className="absolute bottom-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--hw-red)] text-white shadow-sm hover:opacity-95 disabled:opacity-50"
            disabled={sendDisabled}
            title={awaitingAnswers ? "Answer the question" : ""}
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2 space-y-2">
          <div className="text-xs text-[var(--hw-muted)]">Tip: Add as much information as possible so we can get you the right help.</div>
          {attachments.length ? (
            <div className="text-xs font-semibold text-[var(--hw-ink)]">{attachments.length} attachment(s) ready to send</div>
          ) : null}

          {/* Manual booking collapses after AI starts, but remains accessible. */}
          <div className="mt-3">
            <button
              type="button"
              className="flex w-full items-center gap-3"
              onClick={() => setManualOpen((v) => !v)}
              aria-expanded={manualOpen}
            >
              <div className="h-px flex-1 bg-[var(--hw-line)]" />
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--hw-line)] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
                Manual booking
                {manualOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </div>
              <div className="h-px flex-1 bg-[var(--hw-line)]" />
            </button>

            {manualOpen && !started ? (
              <div className="mt-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <Link href="/marketplace/intake?trade=Plumbing" className="w-full">
                    <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-[var(--hw-line)] bg-white px-2 py-1.5 text-[11px] font-semibold text-[#374151] hover:bg-[var(--hw-soft)]">
                      <Droplet className="h-4 w-4 shrink-0 text-[var(--hw-red)]" />
                      Plumbing
                    </span>
                  </Link>
                  <Link href="/marketplace/intake?trade=Electrical" className="w-full">
                    <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-[var(--hw-line)] bg-white px-2 py-1.5 text-[11px] font-semibold text-[#374151] hover:bg-[var(--hw-soft)]">
                      <Zap className="h-4 w-4 shrink-0 text-[var(--hw-red)]" />
                      Electrical
                    </span>
                  </Link>
                  <Link href="/marketplace/intake?trade=HVAC" className="w-full">
                    <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-[var(--hw-line)] bg-white px-2 py-1.5 text-[11px] font-semibold text-[#374151] hover:bg-[var(--hw-soft)]">
                      <Wind className="h-4 w-4 shrink-0 text-[var(--hw-red)]" />
                      HVAC
                    </span>
                  </Link>
                  <Link href="/marketplace/intake?trade=Handyman%20%2F%20General" className="w-full">
                    <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-[var(--hw-line)] bg-white px-2 py-1.5 text-[11px] font-semibold text-[#374151] hover:bg-[var(--hw-soft)]">
                      <Hammer className="h-4 w-4 shrink-0 text-[var(--hw-red)]" />
                      Handyman
                    </span>
                  </Link>
                  <Link href="/marketplace/intake?trade=Cleaning%20%2F%20Turnover" className="w-full">
                    <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-[var(--hw-line)] bg-white px-2 py-1.5 text-[11px] font-semibold text-[#374151] hover:bg-[var(--hw-soft)]">
                      <Sparkles className="h-4 w-4 shrink-0 text-[var(--hw-red)]" />
                      Cleaning
                    </span>
                  </Link>

                  <Link href="/marketplace/intake?trade=Remodeling" className="w-full">
                    <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-[var(--hw-line)] bg-white px-2 py-1.5 text-[11px] font-semibold text-[#374151] hover:bg-[var(--hw-soft)]">
                      <Home className="h-4 w-4 shrink-0 text-[var(--hw-red)]" />
                      Remodel
                    </span>
                  </Link>
                  <Link href="/marketplace/intake?trade=Roofing" className="w-full">
                    <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-[var(--hw-line)] bg-white px-2 py-1.5 text-[11px] font-semibold text-[#374151] hover:bg-[var(--hw-soft)]">
                      <Shield className="h-4 w-4 shrink-0 text-[var(--hw-red)]" />
                      Roofing
                    </span>
                  </Link>
                  <Link href="/marketplace/intake?trade=Flooring" className="w-full">
                    <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-[var(--hw-line)] bg-white px-2 py-1.5 text-[11px] font-semibold text-[#374151] hover:bg-[var(--hw-soft)]">
                      <Layers className="h-4 w-4 shrink-0 text-[var(--hw-red)]" />
                      Flooring
                    </span>
                  </Link>

                  <Link
                    href="/services"
                    className="col-span-2 inline-flex w-full items-center justify-center rounded-full border border-[var(--hw-line)] bg-white px-3 py-2 text-[11px] font-semibold text-[var(--hw-muted)] hover:bg-[var(--hw-soft)] whitespace-nowrap sm:col-span-2"
                  >
                    Browse marketplace
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

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
              placeholder="123 Main St, Chicago, IL"
              className={addTouched && !newAddress.trim() ? "ring-2 ring-[rgba(229,57,53,.30)]" : ""}
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-xs">Nickname (optional)</Label>
            <Input value={newNickname} onChange={(e) => setNewNickname(e.target.value)} placeholder="Lake Condo" />
          </div>

          <div className="grid gap-2">
            <Label className="text-xs">Type of property (optional)</Label>
            <Input value={newPropertyType} onChange={(e) => setNewPropertyType(e.target.value)} placeholder="Condo / House / Multi-unit" />
          </div>

          <div className="mt-2 flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setAddPropOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                setAddTouched(true);
                const address = newAddress.trim();
                if (!address) return;

                const id = `${addPropMode === "client" ? "prop_client" : "prop_local"}_${Math.random().toString(36).slice(2, 10)}`;
                const createdAt = new Date().toISOString();

                if (addPropMode === "client") {
                  const clientName = `${newClientFirstName} ${newClientLastName}`.trim();
                  if (!clientName) return;

                  const nextStored: StoredClientProperty[] = [
                    {
                      id,
                      createdAt,
                      address,
                      nickname: newNickname.trim() || undefined,
                      propertyType: newPropertyType.trim() || undefined,
                      clientName,
                      clientEmail: newClientEmail.trim() || undefined,
                      clientPhone: newClientPhone.trim() || undefined,
                    },
                    ...readClientProperties(),
                  ];
                  writeClientProperties(nextStored);
                } else {
                  const nextStored: StoredProperty[] = [
                    { id, createdAt, address, nickname: newNickname.trim() || undefined },
                    ...readCustomProperties(),
                  ];
                  writeCustomProperties(nextStored);
                }

                // Refresh local list and select it
                const nextProp: PropertyLite = {
                  id,
                  nickname: newNickname.trim() || null,
                  address1: address,
                  city: null,
                  state: null,
                  zip: null,
                };
                setProperties((prev) => [nextProp, ...(prev || [])]);
                setPropertyId(id);

                setNewAddress("");
                setNewNickname("");
                setNewPropertyType("");
                setNewClientFirstName("");
                setNewClientLastName("");
                setNewClientEmail("");
                setNewClientPhone("");
                setAddTouched(false);
                setAddPropOpen(false);
              }}
            >
              Add property
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
