"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { PortalShell } from "@/components/portal-shell";
import { PRO_NAV } from "@/components/pro/nav";
import { Button, Card, Chip, Input, Modal, Picker } from "@/components/ui";
import { withDemo } from "@/lib/demo";

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
  const [inviteLinkToast, setInviteLinkToast] = useState("");

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
    return hasSearch ? derivedClients : derivedClients.slice(0, 8);
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
      description="Invite clients, track shared projects, and keep everyone in the loop."
      primaryAction={
        <Link href={withDemo("/pro/clients?invite=1")}>
          <Button>Invite client</Button>
        </Link>
      }
    >
      <div className="grid gap-6">
        <Card className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-[var(--hw-ink)]">My Clients</div>
              <div className="mt-1 text-sm text-[var(--hw-muted)]">
                Clients you’ve added via Properties or Instant Estimate.
              </div>
            </div>
            <div className="w-full sm:w-72">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients…" />
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {visibleClients.length ? (
              <div className={"grid gap-3 " + ((q || "").trim() ? "" : "max-h-[420px] overflow-auto pr-1") }>
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

          <div className="mt-6 rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[var(--hw-ink)]">Your Client Invite Link</div>
                <div className="mt-1 text-sm text-[var(--hw-muted)]">
                  Share this with clients so they can connect to your workspace.
                </div>
              </div>
            </div>

            <div className="mt-4 relative rounded-[var(--hw-radius-lg)] border-2 border-[var(--hw-line)] bg-white px-3 py-3 overflow-hidden">
              <div className="pr-[96px]">
                <div className="text-xs font-semibold text-[var(--hw-ink)] whitespace-nowrap overflow-x-auto">{partnerInviteLink}</div>
              </div>
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(partnerInviteLink);
                      setInviteLinkToast("Copied");
                      window.setTimeout(() => setInviteLinkToast(""), 1200);
                    } catch {
                      setInviteLinkToast("Copy failed");
                      window.setTimeout(() => setInviteLinkToast(""), 1200);
                    }
                  }}
                  disabled={!partnerInviteLink}
                >
                  Copy
                </Button>
              </div>
            </div>

            {inviteLinkToast ? <div className="mt-2 text-xs font-semibold text-[var(--hw-muted)]">{inviteLinkToast}</div> : null}
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
                  onChange={(id) => setInviteRole((id as any) || "")}
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
                      const row: StoredInvitedClient = {
                        id,
                        createdAt: new Date().toISOString(),
                        firstName: inviteFirst.trim() || undefined,
                        lastName: inviteLast.trim() || undefined,
                        email,
                        phone: invitePhone.trim() || undefined,
                        role: (inviteRole as any) || undefined,
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
