"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Sparkles, XCircle } from "lucide-react";

import { Button, Input, Textarea } from "@/components/ui";

function RequestAccessClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const rawRole = sp.get("role") ?? (sp.get("source") === "nahrep" ? "real-estate-pro" : "partner");
  const type = sp.get("type") ?? "access";
  const isNahrepEarlyAccess = sp.get("source") === "nahrep" && sp.get("campaign") === "early-access";
  const role = rawRole === "partner" || rawRole === "real-estate-pro" || rawRole === "real_estate_pro" ? "real_estate_pro" : rawRole;
  const roleLabel = role === "real_estate_pro" ? "Real Estate Pro" : role;

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
      if (isNahrepEarlyAccess) {
        window.setTimeout(() => router.push("/nahrep"), 1800);
      } else {
        window.setTimeout(() => setStatus((current) => (current === "sent" ? "idle" : current)), 4200);
      }
    } catch {
      setStatus("error");
      window.setTimeout(() => setStatus((current) => (current === "error" ? "idle" : current)), 4200);
    }
  }

  const scheduleUrl = process.env.NEXT_PUBLIC_SCHEDULE_DEMO_URL;

  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-[var(--hw-red)]/20 blur-[80px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 bottom-12 h-72 w-72 rounded-full bg-[var(--hw-red)]/12 blur-[90px]"
      />

      {status === "sent" || status === "error" ? (
        <div className="fixed left-1/2 top-6 z-[200] w-[calc(100vw-32px)] max-w-md -translate-x-1/2 rounded-[20px] border border-[rgba(229,57,53,.20)] bg-white/95 p-4 shadow-[0_24px_70px_rgba(17,24,39,.18)] backdrop-blur">
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] ${status === "sent" ? "bg-emerald-50 text-emerald-600" : "bg-[rgba(229,57,53,.08)] text-[var(--hw-red)]"}`}>
              {status === "sent" ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            </div>
            <div>
              <div className="text-sm font-extrabold text-[var(--hw-ink)]">
                {status === "sent" ? "Request submitted" : "Submission failed"}
              </div>
              <div className="mt-1 text-sm leading-5 text-[var(--hw-muted)]">
                {status === "sent" ? "We’ll follow up shortly with early access details." : "Please try again in a moment."}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="relative overflow-hidden rounded-[28px] border border-[rgba(229,57,53,.18)] bg-white/90 p-6 shadow-[0_30px_90px_rgba(17,24,39,.14)] backdrop-blur md:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[var(--hw-red)]/18 blur-[52px]"
        />

        <div className="relative flex items-start justify-between gap-5">
          <div>
            <Image
              src="/brand/homeworke-logo.png"
              alt="Homeworke"
              width={248}
              height={80}
              priority
              className="h-auto w-[210px]"
            />
            <div className="mt-5 text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">
              {type === "apply" ? "Apply to join" : "Request access"}
            </div>
            <div className="mt-1 text-sm text-[var(--hw-muted)]">
              Role: <span className="font-semibold text-[var(--hw-ink)]">{roleLabel}</span>
            </div>
          </div>
          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.08)] text-[var(--hw-red)] sm:flex">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>

        <div className="relative mt-6 grid gap-3">
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
            <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Brokerage / Team" />
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

          <div className="rounded-[16px] border border-[var(--hw-line)] bg-[var(--hw-soft)] px-4 py-3 text-xs leading-5 text-[var(--hw-muted)]">
            We’ll review requests and send early access details when approved.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RequestAccessPage() {
  return (
    <main
      className="min-h-[calc(100vh-64px)] overflow-hidden px-4 py-10 md:py-14"
      style={{
        background:
          "radial-gradient(760px 380px at 52% 0%, rgba(229,57,53,.12), transparent 60%), linear-gradient(180deg, #fff, #F8FAFC)",
      }}
    >
      <Suspense fallback={null}>
        <RequestAccessClient />
      </Suspense>
    </main>
  );
}
