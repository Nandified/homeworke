"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button, Input } from "@/components/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const ROLE_META: Record<
  string,
  {
    title: string;
    subtitle: string;
    allowSelfSignup: boolean;
    nextDefault: string;
    requestCtas?: { kind: "access" | "apply"; label: string }[];
  }
> = {
  homeowner: {
    title: "Homeowner login",
    subtitle: "Get help with repairs, estimates, and scheduling.",
    allowSelfSignup: true,
    nextDefault: "/ho/dashboard",
  },
  partner: {
    title: "Partner / Real Estate Pro login",
    subtitle: "This portal is invite-only. If you need access, request it below.",
    allowSelfSignup: false,
    nextDefault: "/pro/dashboard",
    requestCtas: [
      { kind: "access", label: "Request access" },
      { kind: "access", label: "Schedule a demo" },
    ],
  },
  provider: {
    title: "Service Provider login",
    subtitle: "Existing providers can sign in. New providers can apply to join.",
    allowSelfSignup: false,
    nextDefault: "/sp/dashboard",
    requestCtas: [
      { kind: "apply", label: "Apply to join" },
      { kind: "access", label: "Schedule a demo" },
    ],
  },
  ops: {
    title: "Homeworke team login",
    subtitle: "For Home Guides, PMs, and Admins. Invite-only.",
    allowSelfSignup: false,
    nextDefault: "/hg/dashboard",
  },
};

function normalizeRole(role: string | undefined | null) {
  if (!role) return null;
  const r = role.toLowerCase();
  if (["homeowner", "ho"].includes(r)) return "homeowner";
  if (["partner", "pro", "realestate", "real-estate"].includes(r)) return "partner";
  if (["provider", "sp", "contractor"].includes(r)) return "provider";
  if (["ops", "hg", "pm", "admin", "team"].includes(r)) return "ops";
  return null;
}

export default function LoginClient(props: { role?: string | null }) {
  const sp = useSearchParams();
  const role = normalizeRole(props.role) ?? normalizeRole(sp.get("role")) ?? "homeowner";
  const meta = ROLE_META[role] ?? ROLE_META.homeowner;

  const next = sp.get("next")?.startsWith("/") ? (sp.get("next") as string) : meta.nextDefault;

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => {
    try {
      return getSupabaseBrowserClient();
    } catch {
      return null;
    }
  }, []);

  async function sendMagicLink() {
    setError(null);
    setStatus("sending");
    try {
      if (!supabase) throw new Error("supabase_not_configured");

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          shouldCreateUser: meta.allowSelfSignup,
        },
      });
      if (error) throw error;
      setStatus("sent");
    } catch (e: unknown) {
      setStatus("error");
      const msg = e && typeof e === "object" && "message" in e ? String((e as any).message) : null;
      setError(msg ?? "Could not send link");
    }
  }

  async function continueWithGoogle() {
    setError(null);
    try {
      if (!supabase) throw new Error("supabase_not_configured");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) throw error;
    } catch (e: unknown) {
      const msg = e && typeof e === "object" && "message" in e ? String((e as any).message) : null;
      setError(msg ?? "Could not start Google login");
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div aria-hidden className="pointer-events-none absolute -inset-6 rounded-[28px] bg-[radial-gradient(circle_at_20%_10%,rgba(229,57,53,.14),transparent_55%),radial-gradient(circle_at_80%_30%,rgba(229,57,53,.08),transparent_55%)]" />

      <div className="relative rounded-3xl border border-[rgba(229,57,53,.14)] bg-white/90 p-7 shadow-[0_18px_60px_rgba(17,24,39,.12)] backdrop-blur">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--hw-muted)]">Homeworke</div>
        <div className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">{meta.title}</div>
        <div className="mt-1 text-sm leading-relaxed text-[var(--hw-muted)]">{meta.subtitle}</div>

        <div className="mt-6 grid gap-3">
          <Button onClick={sendMagicLink} disabled={!email || status === "sending"}>
            {status === "sending" ? "Sending…" : "Email me a sign-in link"}
          </Button>

          <div className="grid gap-2">
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Email</div>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" />
            <div className="text-xs text-[var(--hw-muted)]">We’ll email you a one-time link to continue.</div>
          </div>

          {status === "sent" ? (
            <div className="rounded-2xl border border-[rgba(16,185,129,.22)] bg-[rgba(16,185,129,.08)] px-4 py-3 text-sm text-[var(--hw-ink)]">
              Link sent. Check your inbox (and spam). You can request another link anytime.
            </div>
          ) : null}
          {status === "error" || error ? (
            <div className="rounded-2xl border border-[rgba(229,57,53,.25)] bg-[rgba(229,57,53,.08)] px-4 py-3 text-sm text-[var(--hw-ink)]">
              {error ?? "Could not send link."}
            </div>
          ) : null}

          <div className="my-1 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--hw-line)]" />
            <div className="text-xs text-[var(--hw-muted)]">or</div>
            <div className="h-px flex-1 bg-[var(--hw-line)]" />
          </div>

          <Button onClick={continueWithGoogle} variant="secondary">
            Continue with Google
          </Button>

          {meta.requestCtas?.length ? (
            <div className="mt-4 grid gap-2 border-t border-[var(--hw-line)] pt-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Need access?</div>
              <div className="flex flex-wrap gap-2">
                {meta.requestCtas.map((c) => (
                  <Button
                    key={c.label}
                    variant="ghost"
                    onClick={() => {
                      const qp = new URLSearchParams();
                      qp.set("role", role);
                      qp.set("type", c.kind);
                      window.location.href = `/request-access?${qp.toString()}`;
                    }}
                  >
                    {c.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="text-xs text-[var(--hw-muted)]">
            We’ll email you a one-time sign-in link.
          </div>
        </div>
      </div>
    </div>
  );
}
