"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  ArrowRight,
  ArrowUp,
  ChevronDown,
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

import { Button, Pill } from "@/components/ui";

type IntakeClassifyResult = {
  ok: boolean;
  used?: "openai" | "fallback" | string;
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

  const [manualOpen, setManualOpen] = useState(true);
  const [assistantThinking, setAssistantThinking] = useState(false);

  const [isDesktop, setIsDesktop] = useState(false);
  const [compactComposer, setCompactComposer] = useState(false);

  const started = turns.length > 0 || classifying || assistantThinking || !!result?.ok || !!classifyError;
  const currentQuestion = questions[qIndex] || "";
  const awaitingAnswers = !!result?.ok && qIndex < questions.length;
  const readyToSchedule = !!result?.ok && qIndex >= questions.length;

  const hints = useMemo(() => ["water under kitchen sink", "outlet stopped working", "AC not cooling", "need drywall patch"], []);
  const [demoIdx, setDemoIdx] = useState(0);
  const [demoText, setDemoText] = useState("");
  const demoPhase = useRef<"typing" | "pause" | "deleting">("typing");
  const pauseUntil = useRef<number>(0);

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

  // Best-effort property list
  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/api/properties");
        const j = await res.json().catch(() => null);
        if (j?.ok && Array.isArray(j.properties)) {
          setProperties(j.properties as PropertyLite[]);
          if (j.properties.length === 1) setPropertyId(String(j.properties[0].id));
        }
      } catch {
        // ignore
      }
    };
    run();
  }, []);

  function resetIntakeKeepDraft() {
    setClassifyError("");
    setClassifying(false);
    setAssistantThinking(false);
    setResult(null);
    setTurns([]);
    setQuestions([]);
    setAnswers([]);
    setQIndex(0);
    setManualOpen(true);
    setCompactComposer(false);
  }

  async function send() {
    const text = issue.trim();
    if (!text || classifying) return;

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

    setTurns((prev) => [...prev, { role: "user", text }]);

    try {
      const res = await fetch("/api/work-orders/intake-classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const j = (await res.json().catch(() => null)) as IntakeClassifyResult | null;
      if (!j || !j.ok) {
        setClassifyError(j?.error || `classify_failed_${res.status}`);
        return;
      }

      setResult(j);

      const qs = (Array.isArray(j.clarifyingQuestions) ? j.clarifyingQuestions : []).filter(Boolean).slice(0, 3);
      // If model returns none, still keep 1 generic question for concierge feel.
      const normalized = qs.length ? qs : ["Anything else to add (photos, room, timing)?"]; 

      setQuestions(normalized);
      setAnswers(new Array(normalized.length).fill(""));
      setQIndex(0);

      // Assistant: suggested + first question
      const suggestedLine = `Suggested: ${j.trade || ""}${j.subcategory ? ` · ${j.subcategory}` : ""}`.trim();
      const confLine = typeof j.confidence === "number" ? `Confidence ${(j.confidence * 100).toFixed(0)}%` : "";
      const header = [suggestedLine, confLine].filter(Boolean).join(" — ");

      setTurns((prev) => [...prev, { role: "assistant", text: header || "Got it." }, { role: "assistant", text: normalized[0] }]);

      setIssue("");
    } catch {
      setClassifyError("classify_fetch_error");
    } finally {
      setClassifying(false);
    }
  }

  function scheduleVisit() {
    if (!result?.ok) return;
    if (questions.length && answers.some((a) => !String(a || "").trim())) return;

    const qnaJson = JSON.stringify(
      questions.map((q, i) => ({ question: q, answer: answers[i] || "" }))
    );

    router.push(
      `/marketplace/intake?` +
        new URLSearchParams({
          issue: turns.findLast((t) => t.role === "user")?.text || "",
          trade: result.trade || "",
          category: result.category || "",
          subcategory: result.subcategory || "",
          serviceId: result.serviceId || "",
          aiSummary: (result.aiSummary || "").trim(),
          qna: qnaJson,
          propertyId: propertyId || "",
        }).toString()
    );
  }

  const sendDisabled =
    classifying ||
    !issue.trim() ||
    // While in Q&A mode, force answers through the same composer (send is fine)
    false;

  return (
    <div className="rounded-[var(--hw-radius-lg)] p-5 hw-glass">
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
        <div className="mt-4 rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white/70 p-4">
          <div className="grid gap-3">
            {turns.map((t, idx) => (
              <div key={idx} className={t.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    t.role === "user"
                      ? "max-w-[92%] rounded-2xl bg-[var(--hw-ink)] px-4 py-2.5 text-sm leading-6 text-white shadow-sm"
                      : "max-w-[95%] rounded-2xl border border-[rgba(229,57,53,.12)] bg-white px-4 py-3 text-sm leading-6 text-[var(--hw-ink)] shadow-sm"
                  }
                >
                  {t.text}
                </div>
              </div>
            ))}

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
                <div className="max-w-[95%] rounded-2xl border border-[rgba(229,57,53,.12)] bg-white px-4 py-3 text-sm leading-6 text-[var(--hw-ink)] shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Next</div>
                  <div className="mt-1">Ready to schedule a visit.</div>

                  {properties && properties.length ? (
                    <div className="mt-3">
                      <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Property</div>
                      <div className="mt-2">
                        <select
                          value={propertyId}
                          onChange={(e) => setPropertyId(e.target.value)}
                          className="w-full rounded-[var(--hw-radius)] border border-[var(--hw-line)] bg-white px-3 py-2 text-sm"
                        >
                          <option value="">Select a property…</option>
                          {properties.map((p) => (
                            <option key={p.id} value={p.id}>
                              {(p.nickname ? `${p.nickname} · ` : "") +
                                p.address1 +
                                (p.city ? `, ${p.city}` : "") +
                                (p.state ? `, ${p.state}` : "")}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button
                      className="w-full sm:w-auto"
                      onClick={scheduleVisit}
                      disabled={questions.length ? answers.some((a) => !String(a || "").trim()) : false}
                    >
                      Schedule a visit
                      <ArrowRight className="h-4 w-4" />
                    </Button>
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
      <div className="mt-4">
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
              e.target.value = "";
            }}
          />

          <textarea
            ref={issueRef}
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            onKeyDown={async (e) => {
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
    </div>
  );
}
