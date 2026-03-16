"use client";

import { useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Button, Card, Container, Input, Pill, Textarea } from "@/components/ui";
import { stageFile } from "@/lib/staged-files";

export default function PartnerExpressEstimateStartPage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const code = params.code;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const canSubmit = useMemo(() => Boolean(file && email && email.includes("@")), [file, email]);

  async function submit() {
    if (!file) return;
    setStatus("sending");
    try {
      const staged = await stageFile(file);
      const next = `/express-estimate?staged=${encodeURIComponent(staged)}&partner=${encodeURIComponent(code)}`;
      const res = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, next }),
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("sent");

      // Keep a tiny local draft so we can prefill later when we wire DB.
      try {
        localStorage.setItem(
          `hw_public_express_estimate_${staged}`,
          JSON.stringify({ address, notes, partner: code, createdAt: Date.now() })
        );
      } catch {}
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <Container className="py-10 md:py-16">
        <div className="flex flex-wrap items-center gap-2">
          <Pill>Partner link</Pill>
          <Pill>Express Estimate</Pill>
        </div>

        <h1 className="mt-6 text-balance text-4xl font-extrabold tracking-tight text-[var(--hw-ink)]">Upload a report</h1>
        <p className="mt-4 max-w-2xl text-pretty text-base leading-7 text-[var(--hw-muted)]">
          Upload an inspection or appraisal PDF. We’ll email you a one-time link to view your estimate.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Card className="p-6 lg:col-span-7">
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Step 1: Upload PDF</div>
            <div className="mt-4 grid gap-3">
              <label className="block cursor-pointer rounded-[var(--hw-radius-lg)] border border-dashed border-[var(--hw-line)] bg-[var(--hw-soft)] p-4 hover:bg-white">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[var(--hw-ink)]">{file ? file.name : "Choose a PDF to upload"}</div>
                    <div className="mt-1 text-sm text-[var(--hw-muted)]">{file ? "Ready." : "Drag & drop or click to browse."}</div>
                  </div>
                  <div className="shrink-0">
                    <Button
                      size="sm"
                      variant="secondary"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }}
                    >
                      Browse
                    </Button>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  className="hidden"
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>

              <div>
                <div className="text-sm font-semibold text-[var(--hw-ink)]">Property address (optional)</div>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, Chicago, IL" />
              </div>

              <div>
                <div className="text-sm font-semibold text-[var(--hw-ink)]">Notes (optional)</div>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything you want us to focus on?" />
              </div>
            </div>
          </Card>

          <Card className="p-6 lg:col-span-5">
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Step 2: Verify email to view</div>
            <div className="mt-2 text-sm text-[var(--hw-muted)]">
              To prevent abuse, we email you a one-time link before we show results.
            </div>

            <div className="mt-4 grid gap-2">
              <div className="text-sm font-semibold text-[var(--hw-ink)]">Email</div>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" inputMode="email" />
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <Button onClick={submit} disabled={!canSubmit || status === "sending"}>
                {status === "sending" ? "Sending…" : "Email me a link"}
              </Button>

              {status === "sent" ? (
                <div className="text-sm text-[var(--hw-muted)]">
                  Link requested. Check your email. (Dev mode: the link is logged server-side.)
                </div>
              ) : null}
              {status === "error" ? <div className="text-sm text-[var(--hw-red)]">Could not send link. Try again.</div> : null}

              <Button variant="ghost" onClick={() => router.push(`/p/${code}`)}>
                Back to partner page
              </Button>
            </div>
          </Card>
        </div>
      </Container>
    </div>
  );
}
