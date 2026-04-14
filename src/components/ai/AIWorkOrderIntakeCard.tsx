"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { ArrowRight, ArrowUp, Paperclip, Droplet, Zap, Wind, Hammer, Sparkles, Home, Wrench, Shield, Layers } from "lucide-react";

import { Button, Input, Pill } from "@/components/ui";

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

export function AIWorkOrderIntakeCard(props: {
  eyebrow?: string;
  title?: string;
  primaryCta?: string;
  secondaryCta?: string;
  /** Prefill the issue box (e.g., when launched from a specific property). */
  prefillIssue?: string;
  /** Show a small header pill (defaults true). */
  showServicingPill?: boolean;
}) {
  const router = useRouter();

  const [issue, setIssue] = useState(props.prefillIssue || "");
  const [lastPrompt, setLastPrompt] = useState<string>("");
  const [classifying, setClassifying] = useState(false);
  const [classifyResult, setClassifyResult] = useState<IntakeClassifyResult | null>(null);
  const [qna, setQna] = useState<Array<{ question: string; answer: string }>>([]);
  const [classifyError, setClassifyError] = useState<string>("");

  const [properties, setProperties] = useState<PropertyLite[] | null>(null);
  const [propertyId, setPropertyId] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);

  const hints = useMemo(() => ["water under kitchen sink", "outlet stopped working", "AC not cooling", "need drywall patch"], []);
  const [demoIdx, setDemoIdx] = useState(0);
  const [demoText, setDemoText] = useState("");
  const demoPhase = useRef<"typing" | "pause" | "deleting">("typing");
  const pauseUntil = useRef<number>(0);

  const issueRef = useRef<HTMLTextAreaElement | null>(null);

  // Typewriter hints
  useEffect(() => {
    if (issue.trim()) return;

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
  }, [issue, demoIdx, demoText.length, hints]);

  // Autogrow textarea
  useEffect(() => {
    const el = issueRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [issue]);

  // Best-effort property list (for suggestion after chat)
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

  async function runAI() {
    const text = issue.trim();
    if (!text) return;

    setLastPrompt(text);
    setClassifyError("");
    setClassifying(true);
    setClassifyResult(null);
    setQna([]);

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
      setClassifyResult(j);
      const qs = Array.isArray(j.clarifyingQuestions) ? j.clarifyingQuestions : [];
      setQna(qs.map((q) => ({ question: q, answer: "" })));
      // Clear the composer after submitting (ChatGPT-like)
      setIssue("");
    } catch {
      setClassifyError("classify_fetch_error");
    } finally {
      setClassifying(false);
    }
  }

  function continueToIntake() {
    const r = classifyResult;
    const issueText = issue.trim();
    const summary = (r?.aiSummary || issueText).trim();
    const qnaJson = qna.length ? JSON.stringify(qna) : "";

    router.push(
      `/marketplace/intake?` +
        new URLSearchParams({
          issue: issueText,
          trade: r?.trade || "",
          category: r?.category || "",
          subcategory: r?.subcategory || "",
          serviceId: r?.serviceId || "",
          aiSummary: summary,
          qna: qnaJson,
          propertyId: propertyId || "",
        }).toString()
    );
  }

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

      {/* Conversation */}
      {lastPrompt || classifying || classifyResult?.ok || classifyError ? (
        <div className="mt-4 rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white/70 p-4">
          {/* User bubble */}
          {lastPrompt ? (
            <div className="flex justify-end">
              <div className="max-w-[90%] rounded-2xl bg-[var(--hw-ink)] px-4 py-2.5 text-sm leading-6 text-white shadow-sm">
                {lastPrompt}
              </div>
            </div>
          ) : null}

          {/* Assistant bubble */}
          <div className="mt-3 flex justify-start">
            <div className="max-w-[95%] rounded-2xl border border-[rgba(229,57,53,.12)] bg-white px-4 py-3 text-sm leading-6 text-[var(--hw-ink)] shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Homeworke AI</div>
                {classifying ? (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--hw-muted)] animate-pulse" style={{ animationDelay: "0ms" }} />
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--hw-muted)] animate-pulse" style={{ animationDelay: "180ms" }} />
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--hw-muted)] animate-pulse" style={{ animationDelay: "360ms" }} />
                  </div>
                ) : null}
              </div>

              {classifyError ? (
                <div className="mt-2 rounded-[var(--hw-radius)] border border-[rgba(229,57,53,.22)] bg-[rgba(229,57,53,.06)] px-3 py-2 text-xs font-semibold text-[var(--hw-red)]">
                  We couldn’t analyze that. Please try again.
                </div>
              ) : null}

              {classifyResult?.ok ? (
                <div className="mt-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold">Suggested</div>
                    <div className="text-xs text-[var(--hw-muted)]">
                      {typeof classifyResult.confidence === "number"
                        ? `Confidence ${(classifyResult.confidence * 100).toFixed(0)}%`
                        : null}
                    </div>
                  </div>

                  <div className="mt-2 text-sm">
                    <span className="font-semibold">{classifyResult.trade}</span>
                    {classifyResult.subcategory ? (
                      <span className="text-[var(--hw-muted)]"> · {classifyResult.subcategory}</span>
                    ) : null}
                  </div>

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

                  {qna.length ? (
                    <div className="mt-3 grid gap-3">
                      {qna.map((qa, idx) => (
                        <div key={idx}>
                          <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Question</div>
                          <div className="mt-1 text-sm">{qa.question}</div>
                          <div className="mt-2">
                            <Input
                              value={qa.answer}
                              onChange={(e) =>
                                setQna((prev) => {
                                  const next = prev.slice();
                                  next[idx] = { ...next[idx], answer: e.target.value };
                                  return next;
                                })
                              }
                              placeholder="Type your answer…"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-[var(--hw-muted)]">Got it. If you want, add photos/videos for accuracy.</div>
                  )}

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button
                      className="w-full sm:w-auto"
                      onClick={continueToIntake}
                      disabled={qna.length ? qna.some((x) => !x.answer.trim()) : false}
                    >
                      Book repair
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <button
                      type="button"
                      className="text-sm font-semibold text-[var(--hw-muted)] hover:text-[var(--hw-ink)]"
                      onClick={() => {
                        setIssue(lastPrompt);
                        setClassifyResult(null);
                        setQna([]);
                        setClassifyError("");
                        // focus
                        setTimeout(() => issueRef.current?.focus(), 0);
                      }}
                    >
                      Refine
                    </button>
                  </div>
                </div>
              ) : classifying ? (
                <div className="mt-2 text-sm text-[var(--hw-muted)]">Thinking…</div>
              ) : (
                <div className="mt-2 text-sm text-[var(--hw-muted)]">Describe the issue and I’ll suggest the right service.</div>
              )}
            </div>
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
              // Match ChatGPT mobile feel: Enter adds a new line.
              // Desktop power-user shortcut: Cmd/Ctrl + Enter sends.
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (!classifying && issue.trim()) await runAI();
              }
            }}
            placeholder=""
            aria-label="Describe your issue"
            rows={3}
            className="w-full resize-none rounded-[var(--hw-radius-lg)] bg-transparent px-4 py-3 pr-28 text-[17px] leading-7 border-0 outline-none"
            style={{ minHeight: lastPrompt ? 96 : 140 }}
          />

          {!issue && !lastPrompt ? (
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
            onClick={async () => {
              if (!classifying && issue.trim()) await runAI();
            }}
            className="absolute bottom-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--hw-red)] text-white shadow-sm hover:opacity-95 disabled:opacity-50"
            disabled={classifying || !issue.trim()}
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2 space-y-2">
          <div className="text-xs text-[var(--hw-muted)]">
            Tip: Add as much information as possible so we can get you the right help.
          </div>

          {classifyError ? (
            <div className="mt-3 rounded-[var(--hw-radius)] border border-[rgba(229,57,53,.22)] bg-[rgba(229,57,53,.06)] px-3 py-2 text-xs font-semibold text-[var(--hw-red)]">
              We couldn’t analyze that. Please try again.
            </div>
          ) : null}

          <div className="mt-3">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--hw-line)]" />
              <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Or manually book it</div>
              <div className="h-px flex-1 bg-[var(--hw-line)]" />
            </div>

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
                  title={props.secondaryCta || "Browse marketplace"}
                  className="col-span-2 inline-flex w-full items-center justify-center rounded-full border border-[var(--hw-line)] bg-white px-3 py-2 text-[11px] font-semibold text-[var(--hw-muted)] hover:bg-[var(--hw-soft)] whitespace-nowrap sm:col-span-2"
                >
                  Browse marketplace
                </Link>
              </div>
            </div>
          </div>

          {attachments.length ? (
            <div className="text-xs font-semibold text-[var(--hw-ink)]">{attachments.length} attachment(s) added</div>
          ) : null}
        </div>

        {/* error is displayed above the manual booking section for visibility */}
      </div>

      {/* AI results are rendered in the conversation area above the composer. */}
    </div>
  );
}
