"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Input, Textarea } from "@/components/ui";

function RequestAccessClient() {
  const sp = useSearchParams();
  const role = sp.get("role") ?? "partner";
  const type = sp.get("type") ?? "access";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit() {
    setStatus("sending");
    try {
      const res = await fetch("/api/access-request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role, type, name, email, phone, company, notes }),
      });
      if (!res.ok) throw new Error("request_failed");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  const scheduleUrl = process.env.NEXT_PUBLIC_SCHEDULE_DEMO_URL;

  return (
    <div className="mx-auto w-full max-w-lg rounded-2xl border border-[var(--hw-line)] bg-white p-6 shadow-sm">
        <div className="text-xl font-extrabold tracking-tight text-[var(--hw-ink)]">
          {type === "apply" ? "Apply to join" : "Request access"}
        </div>
        <div className="mt-1 text-sm text-[var(--hw-muted)]">
          Role: <span className="font-semibold text-[var(--hw-ink)]">{role}</span>
        </div>

        <div className="mt-5 grid gap-3">
          <div className="grid gap-2">
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Name</div>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          </div>
          <div className="grid gap-2">
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Email</div>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </div>
          <div className="grid gap-2">
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Phone</div>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(xxx) xxx-xxxx" />
          </div>
          <div className="grid gap-2">
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Company</div>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Brokerage / Contractor / Team" />
          </div>
          <div className="grid gap-2">
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Notes</div>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything we should know?" rows={4} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={submit} disabled={status === "sending" || !email}>
              {status === "sending" ? "Sending…" : "Submit"}
            </Button>
            {scheduleUrl ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  window.open(scheduleUrl, "_blank", "noreferrer");
                }}
              >
                Schedule a demo
              </Button>
            ) : null}
          </div>

          {status === "sent" ? <div className="text-sm text-[var(--hw-muted)]">Submitted. We’ll follow up shortly.</div> : null}
          {status === "error" ? <div className="text-sm text-[var(--hw-red)]">Could not submit. Try again.</div> : null}

          <div className="text-xs text-[var(--hw-muted)]">
            We’ll review requests and send invite-only access when approved.
          </div>
        </div>
    </div>
  );
}

export default function RequestAccessPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-[var(--hw-surface)] px-4 py-10">
      <Suspense fallback={null}>
        <RequestAccessClient />
      </Suspense>
    </main>
  );
}
