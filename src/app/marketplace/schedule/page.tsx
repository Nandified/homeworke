"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button, Card, Checkbox, Container, Input, Label, Pill } from "@/components/ui";
import { loadPartner } from "@/lib/partner-context";

function prettyProvider(id?: string) {
  if (!id) return "Selected provider";
  const map: Record<string, string> = { alpha: "Alpha Home Services", oak: "Oak & Stone", north: "Northside Pros" };
  return map[id] || id;
}

function ScheduleInner() {
  const sp = useSearchParams();
  const router = useRouter();

  const provider = sp.get("provider") || undefined;
  const service = sp.get("service") || "General";

  const [date, setDate] = useState("");
  const [window, setWindow] = useState("Morning");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = useMemo(
    () => Boolean(date && email.includes("@") && consent && !submitting),
    [date, email, consent, submitting]
  );

  async function onConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      const partner = loadPartner();
      let intake: any = null;
      try {
        const raw = localStorage.getItem("hw_intake_draft_v1");
        intake = raw ? JSON.parse(raw) : null;
      } catch {
        intake = null;
      }

      const res = await fetch("/api/marketplace/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          service,
          provider,
          date,
          window,
          partnerId: partner?.partnerId || null,
          shareWithPartner: partner ? true : null,
          intake,
        }),
      });
      const data = (await res.json()) as { ok: boolean; jobId?: string; token?: string; workOrderId?: string; error?: string };
      if (!res.ok || !data.ok || !data.jobId || !data.token || !data.workOrderId) {
        setError(data.error || "confirm_failed");
        return;
      }

      const partnerCtx = loadPartner();

      const session = {
        token: data.token,
        jobId: data.jobId,
        workOrderId: data.workOrderId,
        email,
        service,
        providerName: prettyProvider(provider),
        date,
        window,
        partner: partnerCtx ? { partnerId: partnerCtx.partnerId, partnerName: partnerCtx.partnerName } : null,
        shareWithPartner: partnerCtx ? true : null,
      };

      localStorage.setItem("hw_session_v1", JSON.stringify(session));
      router.push("/confirm/next-steps");
    } catch {
      setError("network_error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <Container className="py-16 md:py-20">
        {/* ── Header ── */}
        <div className="mb-10 md:mb-14">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
              Scheduling
            </span>
            <Pill>Capture moment</Pill>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-[2.75rem] md:leading-[1.15]">
            Confirm Your Service Request
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--hw-muted)]">
            We capture email at confirmation to send updates and match you with a provider. Account creation happens in
            the background.
          </p>
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Left column – Appointment details */}
          <Card className="space-y-6 p-7 md:p-8 lg:col-span-2">
            <div>
              <h2 className="text-base font-semibold tracking-tight">Appointment details</h2>
              <div className="mt-3 flex flex-col gap-1 text-sm text-[var(--hw-muted)]">
                <span>
                  <span className="font-medium text-[var(--hw-fg)]">Provider:</span>{" "}
                  {prettyProvider(provider)}
                </span>
                <span>
                  <span className="font-medium text-[var(--hw-fg)]">Service:</span> {service}
                </span>
              </div>
            </div>

            <hr className="border-[var(--hw-border)]" />

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label>Date</Label>
                <div className="mt-2">
                  <Input value={date} onChange={(e) => setDate(e.target.value)} placeholder="YYYY-MM-DD" />
                </div>
              </div>

              <div>
                <Label>Time window</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["Morning", "Midday", "Afternoon"].map((t) => (
                    <Button
                      key={t}
                      type="button"
                      variant={window === t ? "primary" : "secondary"}
                      onClick={() => setWindow(t)}
                    >
                      {t}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Right column – Confirm */}
          <Card className="flex flex-col gap-5 p-7 md:p-8">
            <h2 className="text-base font-semibold tracking-tight">Confirm</h2>

            <div className="space-y-2">
              <Label>Your email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
              <p className="text-xs leading-5 text-[var(--hw-muted)]">
                Your email — so we can send you updates and match you with a provider.
              </p>
            </div>

            <Checkbox
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              label="I agree to receive confirmation and updates (placeholder terms/privacy)."
            />

            {error && (
              <div className="rounded-[var(--hw-radius)] border border-[rgba(229,57,53,.20)] bg-[var(--hw-red-soft)] px-4 py-3 text-sm leading-relaxed text-[var(--hw-muted)]">
                Could not confirm ({error}). Try again.
              </div>
            )}

            <Button disabled={!ready} onClick={onConfirm} className="mt-auto w-full">
              {submitting ? "Confirming…" : "Confirm and Continue"}
            </Button>

            <p className="text-center text-xs leading-5 text-[var(--hw-muted)]">
              Next: a quick "what happens next" screen, then your Homeowner dashboard.
            </p>
          </Card>
        </div>

        {/* ── Back link ── */}
        <div className="mt-10">
          <Link
            href={{ pathname: "/marketplace/providers", query: { service } }}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--hw-muted)] transition-colors hover:text-[var(--hw-fg)]"
          >
            <span aria-hidden="true">←</span> Back to providers
          </Link>
        </div>
      </Container>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <ScheduleInner />
    </Suspense>
  );
}
