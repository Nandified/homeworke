"use client";

import { useState } from "react";

import { Button, Input } from "@/components/ui";

export function MagicLinkRequestForm(props: {
  next: string;
  title?: string;
  description?: string;
  defaultEmail?: string;
  submitLabel?: string;
}) {
  const [email, setEmail] = useState(props.defaultEmail ?? "");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function send() {
    setStatus("sending");
    try {
      const res = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, next: props.next }),
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="grid gap-4">
      {props.title ? <div className="text-lg font-extrabold tracking-tight text-[var(--hw-ink)]">{props.title}</div> : null}
      {props.description ? <div className="text-sm leading-relaxed text-[var(--hw-muted)]">{props.description}</div> : null}

      <div className="grid gap-2">
        <div className="text-sm font-semibold text-[var(--hw-ink)]">Email</div>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          inputMode="email"
          autoComplete="email"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={send} disabled={!email || status === "sending"}>
          {status === "sending" ? "Sending…" : props.submitLabel ?? "Email me a sign-in link"}
        </Button>
        {status === "sent" ? (
          <div className="text-sm text-[var(--hw-muted)]">Link requested. Check your email (dev: link is logged server-side).</div>
        ) : null}
        {status === "error" ? <div className="text-sm text-[var(--hw-red)]">Could not send link. Try again.</div> : null}
      </div>

      <div className="text-xs text-[var(--hw-muted)]">
        We’ll email you a one-time sign-in link.
      </div>
    </div>
  );
}
