"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button, Card, Checkbox, Container, Input, Label, Pill } from "@/components/ui";

function prettyProvider(id?: string) {
  if (!id) return "Selected provider";
  const map: Record<string, string> = { alpha: "Alpha Home Services", oak: "Oak & Stone", north: "Northside Pros" };
  return map[id] || id;
}

export default function Page(props: { searchParams: { provider?: string; service?: string } }) {
  const provider = props.searchParams.provider;
  const service = props.searchParams.service || "General";

  const [date, setDate] = useState("");
  const [window, setWindow] = useState("Morning");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const ready = useMemo(() => Boolean(date && email && consent), [date, email, consent]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <Container className="py-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Scheduling</div>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Schedule {service}</h1>
            <div className="mt-2 max-w-3xl text-sm leading-7 text-[var(--hw-muted)]">
              This is the capture moment. We collect email to confirm the appointment and silently create your account.
            </div>
          </div>
          <Pill>Capture now</Pill>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
            <div className="text-sm font-semibold">Appointment details</div>
            <div className="mt-2 text-sm text-[var(--hw-muted)]">Provider: {prettyProvider(provider)}</div>

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
                    <Button key={t} variant={window === t ? "primary" : "secondary"} onClick={() => setWindow(t)}>
                      {t}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-sm font-semibold">Confirm</div>
            <div className="mt-3">
              <Label>Email</Label>
              <div className="mt-2">
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
              </div>
            </div>
            <div className="mt-4">
              <Checkbox
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                label="I agree to receive confirmation and updates (placeholder terms/privacy)."
              />
            </div>
            <div className="mt-5">
              <Button disabled={!ready}>Confirm appointment</Button>
            </div>
            <div className="mt-3 text-sm leading-7 text-[var(--hw-muted)]">
              Next: deliver confirmation via magic link and route you into the Homeowner dashboard.
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
