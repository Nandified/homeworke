"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { PortalShell } from "@/components/portal-shell";
import { PRO_NAV } from "@/components/pro/nav";
import { Button, Card, CardHeader, Chip, Input, Label, Modal, Picker } from "@/components/ui";
import { withDemo } from "@/lib/demo";

import { ChevronDown, ChevronUp, Share2, UserPlus } from "lucide-react";

type StoredClientProperty = {
  id: string;
  createdAt: string;
  address: string;
  nickname?: string;
  propertyType?: string;
  ownerName?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;

  // Future: when email-confirm flow exists.
  acceptedAt?: string;
  inviteSentAt?: string;
};

const STORAGE_KEY_CLIENT_PROPS = "hw_props_client_v1";

function readClientProps(): StoredClientProperty[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_CLIENT_PROPS) || "[]";
    const arr = JSON.parse(raw) as StoredClientProperty[];
    return Array.isArray(arr) ? arr.filter((p) => p && typeof p.id === "string") : [];
  } catch {
    return [];
  }
}

type StoredInvitedClient = {
  id: string;
  createdAt: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  role?: "Homeowner" | "Homebuyer";
  acceptedAt?: string;
  inviteSentAt?: string;
};

const STORAGE_KEY_INVITED_CLIENTS = "hw_clients_v1";

function readInvitedClients(): StoredInvitedClient[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_INVITED_CLIENTS) || "[]";
    const arr = JSON.parse(raw) as StoredInvitedClient[];
    return Array.isArray(arr) ? arr.filter((c) => c && typeof c.id === "string" && typeof c.email === "string") : [];
  } catch {
    return [];
  }
}

function writeInvitedClients(items: StoredInvitedClient[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY_INVITED_CLIENTS, JSON.stringify(items.slice(0, 500)));
  } catch {
    // ignore
  }
}

type ClientRow = {
  key: string;
  name: string;
  email: string;
  status: "Invited" | "Active";
};

export default function Page() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [clientProps, setClientProps] = useState<StoredClientProperty[]>([]);
  const [invitedClients, setInvitedClients] = useState<StoredInvitedClient[]>([]);

  const [inviteOpen, setInviteOpen] = useState(false);

  const [copiedInviteLink, setCopiedInviteLink] = useState(false);
  const [inviteExpanded, setInviteExpanded] = useState(false);
  const [inviteLinkEmail, setInviteLinkEmail] = useState("");
  const [inviteLinkFirst, setInviteLinkFirst] = useState("");
  const [inviteLinkLast, setInviteLinkLast] = useState("");
  const [inviteLinkAddress, setInviteLinkAddress] = useState("");
  const [inviteLinkSending, setInviteLinkSending] = useState(false);
  const [inviteLinkResult, setInviteLinkResult] = useState<null | { ok: boolean; message: string }>(null);

  const [inviteFirst, setInviteFirst] = useState("");
  const [inviteLast, setInviteLast] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteRole, setInviteRole] = useState<"Homeowner" | "Homebuyer" | "">("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteToast, setInviteToast] = useState("");

  useEffect(() => {
    // In demo mode, Properties + Instant Estimate store client properties in localStorage.
    // This page derives a client list from those entries so the flows feel connected.
    setClientProps(readClientProps());
    setInvitedClients(readInvitedClients());

    // Open modal via URL flag (Invite client button)
    try {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("invite") === "1") setInviteOpen(true);
    } catch {
      // ignore
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_CLIENT_PROPS) setClientProps(readClientProps());
      if (e.key === STORAGE_KEY_INVITED_CLIENTS) setInvitedClients(readInvitedClients());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const derivedClients = useMemo<ClientRow[]>(() => {
    const map = new Map<string, ClientRow>();

    for (const c of invitedClients) {
      const email = (c.email || "").trim().toLowerCase();
      if (!email) continue;
      const name = `${c.firstName || ""} ${c.lastName || ""}`.trim() || "Client";
      const status: ClientRow["status"] = c.acceptedAt ? "Active" : "Invited";
      map.set(email, { key: email, name, email, status });
    }

    for (const p of clientProps) {
      const email = (p.clientEmail || "").trim().toLowerCase();
      if (!email) continue;
      const name = (p.clientName || p.ownerName || "Client").trim();

      // Today we don't have a true accept/open signal, so default client-added-from-property as "Invited".
      // Once the email-confirm flow exists, we'll flip to Active when acceptedAt is present.
      const status: ClientRow["status"] = p.acceptedAt ? "Active" : "Invited";

      const existing = map.get(email);
      if (!existing) {
        map.set(email, { key: email, name, email, status });
      } else {
        // Prefer Active if any entry is Active, and prefer a longer/more specific name.
        const nextStatus = existing.status === "Active" || status === "Active" ? "Active" : "Invited";
        const nextName = existing.name.length >= name.length ? existing.name : name;
        map.set(email, { ...existing, name: nextName, status: nextStatus });
      }
    }

    const out = Array.from(map.values());
    out.sort((a, b) => a.name.localeCompare(b.name));
    if ((q || "").trim()) {
      const needle = q.trim().toLowerCase();
      return out.filter((c) => c.name.toLowerCase().includes(needle) || c.email.toLowerCase().includes(needle));
    }
    return out;
  }, [clientProps, invitedClients, q]);

  const visibleClients = useMemo(() => {
    // Keep the list from growing endlessly; make it scrollable instead.
    // If user is searching, show all matches.
    const hasSearch = !!(q || "").trim();
    return hasSearch ? derivedClients : derivedClients.slice(0, 6);
  }, [derivedClients, q]);

  const partnerInviteLink = useMemo(() => {
    if (typeof window === "undefined") return "";
    // Mirror dashboard behavior: use the partner code in the URL if present.
    // Fallback to frj in demo.
    const path = window.location.pathname || "";
    const m = path.match(/^\/p\/([^/]+)/);
    const code = (m?.[1] || "frj").trim();
    return `${window.location.origin}/p/${code}`;
  }, []);

  return (
    <PortalShell
      role="PRO"
      title="My Clients"
      portalTitle="Real Estate Pro"
      nav={PRO_NAV as unknown as { href: string; label: string }[]}
      hideHeading
    >
      <div className="grid gap-6">
        <Card className="p-6">
          <CardHeader
            title="My Clients"
            subtitle="Invite clients, track shared projects, and keep everyone in the loop."
            action={
              <Link href={withDemo("/pro/clients?invite=1")}>
                <Button>Invite client</Button>
              </Link>
            }
          />

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <input
              className="h-10 w-full rounded-[999px] border border-[var(--hw-line)] bg-[var(--hw-soft)] px-4 text-sm outline-none transition focus:border-[rgba(229,57,53,.35)] focus:ring-4 focus:ring-[rgba(229,57,53,.10)]"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search clients…"
            />
            <div className="shrink-0 text-xs text-[var(--hw-muted)]">
              {derivedClients.length} result{derivedClients.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {visibleClients.length ? (
              <div className={"grid gap-3 " + ((q || "").trim() ? "" : "max-h-[320px] overflow-auto pr-1") }>
                {visibleClients.map((c) => (
                  <div
                    key={c.key}
                    className="flex flex-col gap-2 rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[var(--hw-ink)]">{c.name}</div>
                      <div className="truncate text-sm text-[var(--hw-muted)]">{c.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Chip>{c.status}</Chip>
                      <Link href={withDemo("/pro/messages")}>
                        <Button variant="secondary">View messages</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-5">
                <div className="text-sm font-semibold text-[var(--hw-ink)]">No clients yet</div>
                <div className="mt-1 text-sm text-[var(--hw-muted)]">
                  Add a <span className="font-semibold text-[var(--hw-ink)]">Client property</span> from Properties or Instant Estimate and it will show up here.
                </div>
              </div>
            )}
          </div>

          {(q || "").trim() === "" && derivedClients.length > visibleClients.length ? (
            <div className="mt-3 text-xs text-[var(--hw-muted)]">
              Showing {visibleClients.length} of {derivedClients.length}. Search to find a specific client.
            </div>
          ) : null}

        </Card>

        {/* Invite link card (same layout/behavior as dashboard) */}
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[var(--hw-ink)]">Your Client Invite Link</div>
              <div className="mt-1 text-sm text-[var(--hw-muted)]">Share this with clients to connect clients and projects to your workspace.</div>
            </div>
            <Link href={withDemo("/pro/clients")} className="shrink-0">
              <Button size="sm" variant="secondary">View clients</Button>
            </Link>
          </div>

          <div className="mt-4 grid gap-4">
            <div className="relative rounded-[var(--hw-radius-lg)] border-2 border-[var(--hw-line)] bg-white px-3 py-3 overflow-hidden">
              {/* Scrollable link text */}
              <div className="pr-[172px]">
                <div className="text-xs font-semibold text-[var(--hw-ink)] whitespace-nowrap overflow-x-auto">
                  {partnerInviteLink}
                </div>
              </div>

              {/* Overlay actions (same row) */}
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(partnerInviteLink);
                      setCopiedInviteLink(true);
                      window.setTimeout(() => setCopiedInviteLink(false), 1300);
                    } catch {}
                  }}
                  disabled={!partnerInviteLink}
                >
                  {copiedInviteLink ? "Copied" : "Copy"}
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    try {
                      const text = `Here’s my Homeworke invite link: ${partnerInviteLink}`;
                      if (navigator.share) {
                        await navigator.share({ text, url: partnerInviteLink });
                      } else {
                        await navigator.clipboard.writeText(partnerInviteLink);
                        window.location.href = `sms:&body=${encodeURIComponent(text)}`;
                      }
                    } catch {
                      // ignore
                    }
                  }}
                  disabled={!partnerInviteLink}
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="text-xs font-medium text-[var(--hw-muted)]">Or invite via email here</div>
              <Button
                size="sm"
                className="w-auto px-6"
                onClick={() => {
                  setInviteLinkResult(null);
                  setInviteExpanded((v) => !v);
                }}
              >
                <UserPlus className="h-4 w-4" />
                Invite via email
                {inviteExpanded ? (
                  <ChevronUp className="h-4 w-4 opacity-70" />
                ) : (
                  <ChevronDown className="h-4 w-4 opacity-70" />
                )}
              </Button>
            </div>

            {inviteExpanded ? (
              <div className="grid gap-3 animate-[fadeScaleIn_150ms_ease-out]">
                <div>
                  <Label htmlFor="invite-email">Client email</Label>
                  <Input
                    id="invite-email"
                    placeholder="email@example.com"
                    value={inviteLinkEmail}
                    onChange={(e) => setInviteLinkEmail(e.target.value)}
                    inputMode="email"
                    autoComplete="email"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="invite-first">First name</Label>
                    <Input id="invite-first" placeholder="First name" value={inviteLinkFirst} onChange={(e) => setInviteLinkFirst(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="invite-last">Last name</Label>
                    <Input id="invite-last" placeholder="Last name" value={inviteLinkLast} onChange={(e) => setInviteLinkLast(e.target.value)} />
                  </div>
                </div>

                <div>
                  <Label htmlFor="invite-address">Property Address</Label>
                  <Input
                    id="invite-address"
                    placeholder="123 Main St, Chicago, IL"
                    value={inviteLinkAddress}
                    onChange={(e) => setInviteLinkAddress(e.target.value)}
                    autoComplete="street-address"
                  />
                </div>

                <div className="flex justify-center sm:justify-end">
                  <Button
                    size="sm"
                    className="w-auto px-8"
                    disabled={inviteLinkSending || !inviteLinkEmail.trim().includes("@")}
                    onClick={async () => {
                      setInviteLinkResult(null);
                      setInviteLinkSending(true);
                      try {
                        // Stub send: store invited client locally so they show on My Clients.
                        const email = inviteLinkEmail.trim().toLowerCase();
                        const prev = readInvitedClients();
                        const id = "cli_" + Math.random().toString(16).slice(2);
                        const row: StoredInvitedClient = {
                          id,
                          createdAt: new Date().toISOString(),
                          firstName: inviteLinkFirst.trim() || undefined,
                          lastName: inviteLinkLast.trim() || undefined,
                          email,
                          inviteSentAt: new Date().toISOString(),
                        };
                        const out = [row, ...prev.filter((c) => (c.email || "").trim().toLowerCase() !== email)];
                        writeInvitedClients(out);
                        setInvitedClients(out);

                        setInviteLinkResult({ ok: true, message: `Invite sent to ${email}` });
                        setInviteLinkEmail("");
                        setInviteLinkFirst("");
                        setInviteLinkLast("");
                        setInviteLinkAddress("");
                        window.setTimeout(() => setInviteExpanded(false), 600);
                      } catch {
                        setInviteLinkResult({ ok: false, message: "Invite failed (stub error)" });
                      } finally {
                        setInviteLinkSending(false);
                      }
                    }}
                  >
                    {inviteLinkSending ? "Sending…" : "Send invite"}
                  </Button>
                </div>

                {inviteLinkResult ? (
                  <div className={"text-xs font-semibold " + (inviteLinkResult.ok ? "text-emerald-700" : "text-[var(--hw-red)]")}>{inviteLinkResult.message}</div>
                ) : null}
              </div>
            ) : null}
          </div>
        </Card>

        <Modal
          open={inviteOpen}
          onClose={() => {
            setInviteOpen(false);
            // Clear invite=1 so refresh doesn't reopen
            try {
              const url = new URL(window.location.href);
              url.searchParams.delete("invite");
              router.replace(url.pathname + (url.search ? url.search : ""));
            } catch {}
          }}
          title="Invite a client"
          mobilePlacement="center"
          scrollKey="invite"
        >
          <div className="grid gap-4">
            <div className="text-sm text-[var(--hw-muted)]">
              Add a client to your workspace. (Email delivery will be wired next — for now this creates an “Invited” client.)
            </div>

            {inviteToast ? <div className="text-xs font-semibold text-[var(--hw-red)]">{inviteToast}</div> : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <Input value={inviteFirst} onChange={(e) => setInviteFirst(e.target.value)} placeholder="First name" />
              <Input value={inviteLast} onChange={(e) => setInviteLast(e.target.value)} placeholder="Last name" />

              <div className="sm:col-span-2">
                <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Email" />
              </div>

              <div className="sm:col-span-2">
                <Input value={invitePhone} onChange={(e) => setInvitePhone(e.target.value)} placeholder="Phone" />
              </div>

              <div className="sm:col-span-2">
                <Picker
                  value={inviteRole}
                  placeholder="Role"
                  options={[
                    { id: "Homeowner", label: "Homeowner" },
                    { id: "Homebuyer", label: "Homebuyer" },
                  ]}
                  onChange={(id) => setInviteRole(id === "Homeowner" || id === "Homebuyer" ? id : "")}
                />
              </div>

              <div className="sm:col-span-2 flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setInviteOpen(false);
                    try {
                      const url = new URL(window.location.href);
                      url.searchParams.delete("invite");
                      router.replace(url.pathname + (url.search ? url.search : ""));
                    } catch {}
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={inviteBusy || !(inviteEmail || "").trim()}
                  onClick={() => {
                    const email = inviteEmail.trim().toLowerCase();
                    if (!email) return;
                    setInviteBusy(true);
                    try {
                      const prev = readInvitedClients();
                      const id = "cli_" + Math.random().toString(16).slice(2);
                      const role: StoredInvitedClient["role"] =
                        inviteRole === "Homeowner" || inviteRole === "Homebuyer" ? inviteRole : undefined;
                      const row: StoredInvitedClient = {
                        id,
                        createdAt: new Date().toISOString(),
                        firstName: inviteFirst.trim() || undefined,
                        lastName: inviteLast.trim() || undefined,
                        email,
                        phone: invitePhone.trim() || undefined,
                        role,
                        inviteSentAt: new Date().toISOString(),
                      };
                      const out = [row, ...prev.filter((c) => (c.email || "").trim().toLowerCase() !== email)];
                      writeInvitedClients(out);
                      setInvitedClients(out);

                      setInviteToast("Client invited.");
                      window.setTimeout(() => setInviteToast(""), 1600);

                      setInviteFirst("");
                      setInviteLast("");
                      setInviteEmail("");
                      setInvitePhone("");
                      setInviteRole("");
                      setInviteOpen(false);
                      try {
                        const url = new URL(window.location.href);
                        url.searchParams.delete("invite");
                        router.replace(url.pathname + (url.search ? url.search : ""));
                      } catch {}
                    } finally {
                      setInviteBusy(false);
                    }
                  }}
                >
                  {inviteBusy ? "Inviting…" : "Invite client"}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </PortalShell>
  );
}
