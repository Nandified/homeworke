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
      <Container className="py-12 md:py-14">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Scheduling</div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">Confirm Your Service Request</h1>
            <div className="mt-2 max-w-3xl text-sm leading-7 text-[var(--hw-muted)]">
              We capture email at confirmation to send updates and match you with a provider. Account creation happens in
              the background.
            </div>
          </div>
          <Pill>Capture moment</Pill>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="p-6 md:p-7 lg:col-span-2">
            <div className="text-sm font-semibold">Appointment details</div>
            <div className="mt-2 text-sm text-[var(--hw-muted)]">Provider: {prettyProvider(provider)}</div>
            <div className="mt-1 text-sm text-[var(--hw-muted)]">Service: {service}</div>

            <div className="mt-5 grid gap-3">
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

          <Card className="p-6 md:p-7">
            <div className="text-sm font-semibold">Confirm</div>
            <div className="mt-3">
              <Label>Your email</Label>
              <div className="mt-2">
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
              </div>
              <div className="mt-2 text-sm leading-6 text-[var(--hw-muted)]">
                Your email — so we can send you updates and match you with a provider.
              </div>
            </div>
            <div className="mt-4">
              <Checkbox
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                label="I agree to receive confirmation and updates (placeholder terms/privacy)."
              />
            </div>

            {error ? (
              <div className="mt-4 rounded-[var(--hw-radius)] border border-[rgba(229,57,53,.20)] bg-[var(--hw-red-soft)] p-3 text-sm text-[var(--hw-muted)]">
                Could not confirm ({error}). Try again.
              </div>
            ) : null}

            <div className="mt-5">
              <Button disabled={!ready} onClick={onConfirm}>
                {submitting ? "Confirming…" : "Confirm and Continue"}
              </Button>
            </div>

            <div className="mt-3 text-sm leading-7 text-[var(--hw-muted)]">
              Next: a quick “what happens next” screen, then your Homeowner dashboard.
            </div>
          </Card>
        </div>

        <div className="mt-6 text-sm text-[var(--hw-muted)]">
          <Link href={{ pathname: "/marketplace/providers", query: { service } }}>Back</Link>
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
