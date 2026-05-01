"use client";

import * as React from "react";
import Link from "next/link";

import { PortalShell } from "@/components/portal-shell";
import { HO_NAV } from "@/components/ho/nav";
import { Button, Card, CardHeader, Divider, Input, Label, Modal } from "@/components/ui";

type TeamRole = "broker" | "lender" | "insurance" | "inspector";

type LinkedPro = {
  role: TeamRole;
  code: string; // /p/<code>
  displayName?: string;
  email?: string;
  phone?: string;
  linkedAt: string;
};

type Session = {
  token: string;
  partner?: null | { partnerId: string; partnerName: string };
};

const STORAGE_KEY = "hw_ho_team_v1";

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem("hw_session_v1");
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

function readTeam(): Record<TeamRole, LinkedPro | null> {
  const empty: Record<TeamRole, LinkedPro | null> = {
    broker: null,
    lender: null,
    insurance: null,
    inspector: null,
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY) || "";
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<Record<TeamRole, LinkedPro | null>>;
    return { ...empty, ...parsed };
  } catch {
    return empty;
  }
}

function writeTeam(next: Record<TeamRole, LinkedPro | null>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

function roleLabel(role: TeamRole) {
  if (role === "broker") return "Real Estate Broker";
  if (role === "lender") return "Mortgage Lender";
  if (role === "insurance") return "Home Insurance Agent";
  return "Home Inspector";
}

function parsePartnerCode(input: string): string {
  const raw = (input || "").trim();
  if (!raw) return "";

  // Accept: frj, /p/frj, https://.../p/frj, https://.../p/frj?x=y
  try {
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      const u = new URL(raw);
      const parts = u.pathname.split("/").filter(Boolean);
      const idx = parts.indexOf("p");
      const code = idx >= 0 ? parts[idx + 1] : "";
      return (code || "").trim();
    }
  } catch {
    // fall through
  }

  const parts = raw.split("?")[0].split("/").filter(Boolean);
  const idx = parts.indexOf("p");
  if (idx >= 0) return (parts[idx + 1] || "").trim();

  // If it's just a bare code.
  return raw.replace(/[^a-zA-Z0-9_-]/g, "").trim();
}

export default function Page() {
  const [team, setTeam] = React.useState<Record<TeamRole, LinkedPro | null>>(() => ({
    broker: null,
    lender: null,
    insurance: null,
    inspector: null,
  }));

  const [linkOpen, setLinkOpen] = React.useState(false);
  const [linkRole, setLinkRole] = React.useState<TeamRole>("broker");
  const [linkValue, setLinkValue] = React.useState("");
  const [linkName, setLinkName] = React.useState("");
  const [linkEmail, setLinkEmail] = React.useState("");
  const [linkPhone, setLinkPhone] = React.useState("");
  const [linkError, setLinkError] = React.useState<string>("");

  const [groupOpen, setGroupOpen] = React.useState(false);
  const [groupSelected, setGroupSelected] = React.useState<Record<TeamRole, boolean>>({
    broker: true,
    lender: true,
    insurance: true,
    inspector: true,
  });

  // Load + auto-link broker if homeowner came in through a partner link.
  React.useEffect(() => {
    const base = readTeam();

    try {
      const s = loadSession();
      const partnerId = s?.partner?.partnerId ? String(s.partner.partnerId) : "";
      const partnerName = s?.partner?.partnerName ? String(s.partner.partnerName) : "";

      if (partnerId && !base.broker) {
        base.broker = {
          role: "broker",
          code: partnerId,
          displayName: partnerName || undefined,
          linkedAt: new Date().toISOString(),
        };
        writeTeam(base);
      }
    } catch {
      // ignore
    }

    setTeam(base);
  }, []);

  const linkedCount = Object.values(team).filter(Boolean).length;

  const roles: TeamRole[] = ["broker", "lender", "insurance", "inspector"];

  const groupHref = React.useMemo(() => {
    const codes = roles
      .filter((r) => groupSelected[r] && team[r]?.code)
      .map((r) => String(team[r]?.code || ""))
      .filter(Boolean);
    const qs = new URLSearchParams();
    qs.set("group", "1");
    qs.set("to", codes.join(","));
    return `/ho/messages?${qs.toString()}`;
  }, [groupSelected, team, roles]);

  function openLink(role: TeamRole) {
    setLinkRole(role);

    const existing = team[role];
    setLinkValue(existing?.code ? `/p/${existing.code}` : "");
    setLinkName(existing?.displayName || "");
    setLinkEmail(existing?.email || "");
    setLinkPhone(existing?.phone || "");

    setLinkError("");
    setLinkOpen(true);
  }

  function unlink(role: TeamRole) {
    const next = { ...team, [role]: null } as Record<TeamRole, LinkedPro | null>;
    setTeam(next);
    writeTeam(next);
  }

  function saveLink() {
    const code = parsePartnerCode(linkValue);
    if (!code) {
      setLinkError("Paste a valid Homeworke link (e.g. /p/frj) or enter a code.");
      return;
    }

    const next: Record<TeamRole, LinkedPro | null> = {
      ...team,
      [linkRole]: {
        role: linkRole,
        code,
        displayName: linkName.trim() || undefined,
        email: linkEmail.trim() || undefined,
        phone: linkPhone.trim() || undefined,
        linkedAt: new Date().toISOString(),
      },
    };

    setTeam(next);
    writeTeam(next);
    setLinkOpen(false);
  }

  return (
    <PortalShell role="HO" title="Homeowner" portalTitle="Homeowner" nav={HO_NAV as any} hideHeading>
      <div className="grid gap-4">
        <Card className="p-6">
          <CardHeader
            title="My Team"
            subtitle="Link up to 4 professionals so you can share updates and message them when needed."
            action={
              <Button
                variant="secondary"
                disabled={linkedCount === 0}
                onClick={() => {
                  if (linkedCount === 0) return;
                  setGroupOpen(true);
                }}
              >
                Message multiple
              </Button>
            }
          />

          <Divider className="my-5" />

          <div className="grid gap-3 md:grid-cols-2">
            {roles.map((r) => {
              const v = team[r];
              const href = v?.code ? `/p/${encodeURIComponent(v.code)}` : "";

              const initials = (name: string) =>
                (name || "")
                  .trim()
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join("")
                  .toUpperCase();

              const display = v?.displayName || (v?.code ? `Pro: ${v.code}` : "");

              return (
                <Card key={r} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-[var(--hw-line)] bg-[var(--hw-soft)]">
                        {/* Placeholder headshot until we fetch from /p/<code>. */}
                        <div className="grid h-full w-full place-items-center text-xs font-extrabold text-[var(--hw-ink)]">
                          {v?.code ? initials(v.displayName || v.code) : ""}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="text-base font-extrabold tracking-tight text-[var(--hw-ink)]">{roleLabel(r)}</div>
                        {v?.code ? (
                          <div className="mt-1 text-sm text-[var(--hw-muted)] truncate">{display}</div>
                        ) : (
                          <div className="mt-1 text-sm text-[var(--hw-muted)]">Not linked yet</div>
                        )}

                        {v?.code && (v.email || v.phone) ? (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {v.phone ? (
                              <a
                                className="text-xs font-semibold text-[var(--hw-ink)] hover:underline"
                                href={`tel:${encodeURIComponent(v.phone)}`}
                              >
                                {v.phone}
                              </a>
                            ) : null}
                            {v.email ? (
                              <a
                                className="text-xs font-semibold text-[var(--hw-ink)] hover:underline"
                                href={`mailto:${encodeURIComponent(v.email)}`}
                              >
                                {v.email}
                              </a>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {v?.code ? (
                        <>
                          <Link href={href} className="inline-flex">
                            <Button size="sm" variant="secondary">
                              View
                            </Button>
                          </Link>
                          <Link href={`/ho/messages?to=${encodeURIComponent(v.code)}&role=${encodeURIComponent(r)}`} className="inline-flex">
                            <Button size="sm">Message</Button>
                          </Link>
                        </>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => openLink(r)}>
                          Link
                        </Button>
                      )}
                    </div>
                  </div>

                  {v?.code ? (
                    <div className="mt-4 flex items-center justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openLink(r)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => unlink(r)}>
                        Remove
                      </Button>
                    </div>
                  ) : null}
                </Card>
              );
            })}
          </div>
        </Card>
      </div>

      <Modal open={linkOpen} title={`Link ${roleLabel(linkRole)}`} onClose={() => setLinkOpen(false)}>
        <div className="grid gap-4">
          <div className="text-sm text-[var(--hw-muted)]">
            Paste their Homeworke link (example: <span className="font-semibold">https://homeworke-nu.vercel.app/p/frj</span>) or enter their code.
          </div>

          <div className="grid gap-2">
            <Label className="text-xs">Link or code</Label>
            <Input value={linkValue} onChange={(e) => setLinkValue(e.target.value)} placeholder="/p/frj or frj" />
            {linkError ? <div className="text-xs text-[var(--hw-red)]">{linkError}</div> : null}
          </div>

          <Divider />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label className="text-xs">Name (optional)</Label>
              <Input value={linkName} onChange={(e) => setLinkName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">Phone (optional)</Label>
              <Input value={linkPhone} onChange={(e) => setLinkPhone(e.target.value)} placeholder="(555) 555-5555" inputMode="tel" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label className="text-xs">Email (optional)</Label>
            <Input value={linkEmail} onChange={(e) => setLinkEmail(e.target.value)} placeholder="email@example.com" inputMode="email" />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setLinkOpen(false)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={saveLink}>
              Link
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={groupOpen} title="Message multiple" onClose={() => setGroupOpen(false)}>
        <div className="grid gap-4">
          <div className="text-sm text-[var(--hw-muted)]">Pick who to include. Default is 1:1 messages, but you can include multiple when needed.</div>

          <div className="grid gap-2">
            {roles.map((r) => {
              const v = team[r];
              const disabled = !v?.code;
              const checked = !!groupSelected[r] && !disabled;
              return (
                <button
                  key={r}
                  type="button"
                  className={
                    "flex items-center justify-between gap-3 rounded-[14px] border px-4 py-3 text-left transition " +
                    (disabled ? "border-[var(--hw-line)] bg-[var(--hw-soft)] text-[var(--hw-muted)]" : "border-[var(--hw-line)] bg-white hover:bg-[var(--hw-soft)]")
                  }
                  onClick={() => {
                    if (disabled) return;
                    setGroupSelected((prev) => ({ ...prev, [r]: !prev[r] }));
                  }}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[var(--hw-ink)]">{roleLabel(r)}</div>
                    <div className="mt-0.5 text-xs text-[var(--hw-muted)]">{v?.code ? `/p/${v.code}` : "Not linked"}</div>
                  </div>
                  <div className={
                    "h-5 w-5 rounded border grid place-items-center " +
                    (checked ? "border-[rgba(229,57,53,.35)] bg-[rgba(229,57,53,.12)]" : "border-[var(--hw-line)] bg-white")
                  }>
                    {checked ? <span className="h-2.5 w-2.5 rounded bg-[var(--hw-red)]" /> : null}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setGroupOpen(false)}>
              Cancel
            </Button>
            <Link href={groupHref} className="inline-flex">
              <Button variant="secondary">Start message</Button>
            </Link>
          </div>
        </div>
      </Modal>
    </PortalShell>
  );
}
