"use client";

import * as React from "react";
import Link from "next/link";

import { PortalShell } from "@/components/portal-shell";
import { HO_NAV } from "@/components/ho/nav";
import { Button, Card, CardHeader, Divider, Input, Label, Modal } from "@/components/ui";
import { isDemoMode } from "@/lib/demo";
import { resolvePartner } from "@/lib/partners";
import { PROFILE_STORAGE_KEYS } from "@/components/user-avatar";

type TeamRole = "broker" | "lender" | "insurance" | "inspector";

type LinkedPro = {
  role: TeamRole;
  code: string; // /p/<code>
  displayName?: string;
  headshotUrl?: string;
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

  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [pickerRole, setPickerRole] = React.useState<TeamRole>("broker");
  const [query, setQuery] = React.useState("");

  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteRole, setInviteRole] = React.useState<TeamRole>("broker");
  const [inviteName, setInviteName] = React.useState("");
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteError, setInviteError] = React.useState("");

  const [toast, setToast] = React.useState<string | null>(null);

  const [groupOpen, setGroupOpen] = React.useState(false);
  const [groupSelected, setGroupSelected] = React.useState<Record<TeamRole, boolean>>({
    broker: true,
    lender: true,
    insurance: true,
    inspector: true,
  });

  function headshotForCode(code: string): string {
    const fromProfile = resolvePartner(code) as any;
    const headshot = (fromProfile?.headshot_url || "").toString();
    if (headshot) return headshot;

    // If this device has the pro's profile photo stored (e.g. they used /pro/account), use it.
    try {
      const local = window.localStorage.getItem(PROFILE_STORAGE_KEYS.photoDataUrl) || "";
      if (local && code.toLowerCase() === "frj") return local;
    } catch {}

    return "";
  }

  // Load + auto-link broker if homeowner came in through a partner link.
  // In demo mode, default the broker to /p/frj so you can see the full interactions.
  React.useEffect(() => {
    const base = readTeam();

    try {
      const s = loadSession();
      const partnerId = s?.partner?.partnerId ? String(s.partner.partnerId) : "";
      const partnerName = s?.partner?.partnerName ? String(s.partner.partnerName) : "";

      const demoDefault = isDemoMode() ? "frj" : "";

      const effectiveId = partnerId || demoDefault;
      const effectiveName = partnerName || (effectiveId ? "FRJ Demo Partner" : "");

      if (effectiveId && !base.broker) {
        base.broker = {
          role: "broker",
          code: effectiveId,
          displayName: effectiveName || undefined,
          headshotUrl: headshotForCode(effectiveId) || undefined,
          linkedAt: new Date().toISOString(),
        };
      }

      // Hydrate missing headshots for any linked pros.
      let changed = false;
      (Object.keys(base) as TeamRole[]).forEach((r) => {
        const v = base[r];
        if (!v?.code) return;
        if (v.headshotUrl) return;
        const hs = headshotForCode(v.code);
        if (hs) {
          base[r] = { ...v, headshotUrl: hs };
          changed = true;
        }
      });

      if (effectiveId || changed) writeTeam(base);
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

  function openPicker(role: TeamRole) {
    setPickerRole(role);
    setQuery("");
    setPickerOpen(true);
  }

  function openInvite(role: TeamRole) {
    setInviteRole(role);
    setInviteName("");
    setInviteEmail("");
    setInviteError("");
    setInviteOpen(true);
  }

  function unlink(role: TeamRole) {
    const next = { ...team, [role]: null } as Record<TeamRole, LinkedPro | null>;
    setTeam(next);
    writeTeam(next);
  }

  const PRO_DIRECTORY = React.useMemo(() => {
    // Seeded example; replace with real DB-backed search.
    const frj = resolvePartner("frj");
    return [
      {
        code: "frj",
        name: (frj as any)?.display_name || "Fernando Rocha Jr",
        headshotUrl: (frj as any)?.headshot_url || "",
      },
    ] as Array<{ code: string; name: string; headshotUrl?: string }>;
  }, []);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PRO_DIRECTORY;
    return PRO_DIRECTORY.filter((p) => {
      const hay = `${p.name} ${p.code}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, PRO_DIRECTORY]);

  function selectPro(code: string, name?: string, headshotUrl?: string) {
    const hs = headshotUrl || headshotForCode(code);
    const next: Record<TeamRole, LinkedPro | null> = {
      ...team,
      [pickerRole]: {
        role: pickerRole,
        code,
        displayName: name || undefined,
        headshotUrl: hs || undefined,
        linkedAt: new Date().toISOString(),
      },
    };
    setTeam(next);
    writeTeam(next);
    setPickerOpen(false);
    setToast(`${roleLabel(pickerRole)} linked`);
  }

  function sendInvite() {
    const nm = inviteName.trim();
    const em = inviteEmail.trim();
    if (!nm) {
      setInviteError("Name is required.");
      return;
    }
    if (!em || !em.includes("@")) {
      setInviteError("Enter a valid email.");
      return;
    }

    // Stub: this will become an API call that sends an invite email.
    setInviteOpen(false);
    setToast(`Invite sent to ${nm} (${em})`);
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
              const headshot = v?.headshotUrl || "";

              return (
                <Card key={r} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[rgba(229,57,53,.18)] bg-[linear-gradient(135deg,rgba(229,57,53,.10),rgba(17,24,39,.02))] shadow-sm">
                        {headshot ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={headshot} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-xs font-extrabold text-[var(--hw-ink)]">
                            {v?.code ? initials(v.displayName || v.code) : ""}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        {v?.code ? (
                          <div className="text-base font-extrabold tracking-tight text-[var(--hw-ink)] truncate">{display}</div>
                        ) : (
                          <div className="text-base font-extrabold tracking-tight text-[var(--hw-ink)] truncate">{roleLabel(r)}</div>
                        )}
                        <div className="mt-0.5 text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">{roleLabel(r)}</div>
                        {v?.code ? (
                          <div className="mt-1 text-sm text-[var(--hw-muted)] truncate">Homeworke Pro • /p/{v.code}</div>
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
                        <Button size="sm" variant="secondary" onClick={() => openPicker(r)}>
                          Search
                        </Button>
                      )}
                    </div>
                  </div>

                  {v?.code ? (
                    <div className="mt-4 flex items-center justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openPicker(r)}>
                        Change
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

      <Modal open={pickerOpen} title={`Find ${roleLabel(pickerRole)}`} onClose={() => setPickerOpen(false)}>
        <div className="grid gap-4">
          <div className="text-sm text-[var(--hw-muted)]">Search Homeworke Pros. If they’re not on the platform yet, invite them.</div>

          <div className="grid gap-2">
            <Label className="text-xs">Search</Label>
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or code…" />
          </div>

          <div className="grid gap-2">
            {results.length ? (
              results.slice(0, 8).map((p) => (
                <button
                  key={p.code}
                  type="button"
                  className="flex items-center justify-between gap-3 rounded-[14px] border border-[var(--hw-line)] bg-white px-4 py-3 text-left transition hover:bg-[var(--hw-soft)]"
                  onClick={() => selectPro(p.code, p.name, (p as any).headshotUrl)}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[var(--hw-ink)] truncate">{p.name}</div>
                    <div className="mt-0.5 text-xs text-[var(--hw-muted)] truncate">/p/{p.code}</div>
                  </div>
                  <div className="text-xs font-semibold text-[var(--hw-red)]">Select</div>
                </button>
              ))
            ) : (
              <div className="rounded-[14px] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-4 text-sm text-[var(--hw-muted)]">
                No matches.
              </div>
            )}
          </div>

          <Divider />

          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-[var(--hw-muted)]">Not on Homeworke yet?</div>
            <Button variant="secondary" onClick={() => openInvite(pickerRole)}>
              Invite to Homeworke
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={inviteOpen} title={`Invite a Pro`} onClose={() => setInviteOpen(false)}>
        <div className="grid gap-4">
          <div className="text-sm text-[var(--hw-muted)]">We’ll email them an invite to join Homeworke. They can pick their role during signup.</div>

          <div className="grid gap-2">
            <Label className="text-xs">Name</Label>
            <Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Full name" />
          </div>

          <div className="grid gap-2">
            <Label className="text-xs">Email</Label>
            <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@example.com" inputMode="email" />
            {inviteError ? <div className="text-xs text-[var(--hw-red)]">{inviteError}</div> : null}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={sendInvite}>
              Send invite
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
