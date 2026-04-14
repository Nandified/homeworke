"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { ArrowRight, Send } from "lucide-react";

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
  const [classifying, setClassifying] = useState(false);
  const [classifyResult, setClassifyResult] = useState<IntakeClassifyResult | null>(null);
  const [qna, setQna] = useState<Array<{ question: string; answer: string }>>([]);
  const [classifyError, setClassifyError] = useState<string>("");

  const [properties, setProperties] = useState<PropertyLite[] | null>(null);
  const [propertyId, setPropertyId] = useState<string>("");

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
            {props.eyebrow || "Job work order"}
          </div>
          <div className="mt-1 text-xl font-extrabold tracking-tight text-[var(--hw-ink)] sm:text-2xl">
            {props.title || "What do you need help with?"}
          </div>
        </div>
        {props.showServicingPill === false ? null : <Pill className="bg-white">Homeworke AI</Pill>}
      </div>

      <div className="mt-4">
        <div className="relative rounded-[var(--hw-radius-lg)] hw-glass-field">
          <textarea
            ref={issueRef}
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!classifying && issue.trim()) await runAI();
              }
            }}
            placeholder=""
            aria-label="Describe your issue"
            rows={3}
            className="w-full resize-none rounded-[var(--hw-radius-lg)] bg-transparent px-4 py-3 pr-14 text-[17px] leading-7 border-0 outline-none"
            style={{ minHeight: 140 }}
          />

          {!issue ? (
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
            aria-label="Send"
            onClick={async () => {
              if (!classifying && issue.trim()) await runAI();
            }}
            className="absolute bottom-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--hw-red)] text-white shadow-sm hover:opacity-95 disabled:opacity-50"
            disabled={classifying || !issue.trim()}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs font-medium text-[var(--hw-muted)]">Enter to send · Shift+Enter for a new line</div>
          <div className="text-xs text-[var(--hw-muted)]">Tip: Include as many details as you can (photos, room, timing, urgency). More info = faster, more accurate routing.</div>
          <Link href="/services" className="text-xs font-semibold text-[var(--hw-muted)] hover:text-[var(--hw-ink)]">
            {props.secondaryCta || "Browse all services"}
          </Link>
        </div>
      </div>

      {classifyError ? (
        <div className="mt-3 text-sm text-red-600">We couldn’t analyze that. Please try again.</div>
      ) : null}

      {classifyResult?.ok ? (
        <div className="mt-4 rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Suggested</div>
            <div className="text-xs text-[var(--hw-muted)]">
              {typeof classifyResult.confidence === "number" ? `Confidence ${(classifyResult.confidence * 100).toFixed(0)}%` : null}
            </div>
          </div>
          <div className="mt-2 text-sm text-[var(--hw-ink)]">
            <span className="font-semibold">{classifyResult.trade}</span>
            {classifyResult.subcategory ? <span className="text-[var(--hw-muted)]"> · {classifyResult.subcategory}</span> : null}
          </div>

          {properties && properties.length ? (
            <div className="mt-4">
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
                      {(p.nickname ? `${p.nickname} · ` : "") + p.address1 + (p.city ? `, ${p.city}` : "") + (p.state ? `, ${p.state}` : "")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          {qna.length ? (
            <div className="mt-4 grid gap-3">
              {qna.map((qa, idx) => (
                <div key={idx}>
                  <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Question</div>
                  <div className="mt-1 text-sm text-[var(--hw-ink)]">{qa.question}</div>
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
            <div className="mt-3 text-sm text-[var(--hw-muted)]">No follow-up questions—looks straightforward.</div>
          )}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button className="w-full sm:w-auto" onClick={continueToIntake}>
              {props.primaryCta || "Continue"}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <button
              type="button"
              className="text-sm font-semibold text-[var(--hw-muted)] hover:text-[var(--hw-ink)]"
              onClick={() => setClassifyResult(null)}
            >
              Edit
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
