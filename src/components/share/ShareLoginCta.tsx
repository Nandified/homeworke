"use client";

import { useState } from "react";

import { Button, Input } from "@/components/ui";

export function ShareLoginCta(props: { email?: string; next: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [email, setEmail] = useState(props.email || "");

  const hasEmail = !!props.email;

  async function send(to: string) {
    setStatus("sending");
    try {
      const res = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: to, next: props.next }),
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (hasEmail) {
    return (
      <div className="grid gap-3">
        <div className="text-sm text-[var(--hw-muted)]">
          To book repairs and see more details, we can email you a one-time login link.
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => send(props.email!)} disabled={status === "sending"}>
            {status === "sending" ? "Sending…" : `Email login link to ${props.email}`}
          </Button>
          {status === "sent" ? <div className="text-sm text-[var(--hw-muted)]">Sent. Check your inbox.</div> : null}
          {status === "error" ? <div className="text-sm text-[var(--hw-red)]">Could not send. Try again.</div> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="text-sm text-[var(--hw-muted)]">To continue, enter your email and we’ll send a one-time login link.</div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
        <Button onClick={() => send(email)} disabled={!email || status === "sending"}>
          {status === "sending" ? "Sending…" : "Email me a login link"}
        </Button>
      </div>
      {status === "sent" ? <div className="text-sm text-[var(--hw-muted)]">Sent. Check your inbox.</div> : null}
      {status === "error" ? <div className="text-sm text-[var(--hw-red)]">Could not send. Try again.</div> : null}
    </div>
  );
}
