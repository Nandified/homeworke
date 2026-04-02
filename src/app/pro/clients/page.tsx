"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { PortalShell } from "@/components/portal-shell";
import { PRO_NAV } from "@/components/pro/nav";
import { Button, Card, Chip, EmptyState, Input } from "@/components/ui";
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

type ClientRow = {
  key: string;
  name: string;
  email: string;
  status: "Invited" | "Active";
};

export default function Page() {
  const [q, setQ] = useState("");
  const [clientProps, setClientProps] = useState<StoredClientProperty[]>([]);

  useEffect(() => {
    // In demo mode, Properties + Instant Estimate store client properties in localStorage.
    // This page derives a client list from those entries so the flows feel connected.
    setClientProps(readClientProps());

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_CLIENT_PROPS) setClientProps(readClientProps());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const derivedClients = useMemo<ClientRow[]>(() => {
    const map = new Map<string, ClientRow>();

    for (const p of clientProps) {
      const email = (p.clientEmail || "").trim().toLowerCase();
      if (!email) continue;
      const name = (p.clientName || p.ownerName || "Client").trim();

      // Today we don't have a true accept/open signal, so default client-added-from-property as "Invited".
      // Once the email-confirm flow exists, we'll flip to Active when acceptedAt is present.
      const status: ClientRow["status"] = p.acceptedAt ? "Active" : "Invited";
      const key = email;

      const existing = map.get(key);
      if (!existing) {
        map.set(key, { key, name, email, status });
      } else {
        // Prefer Active if any entry is Active, and prefer a longer/more specific name.
        const nextStatus = existing.status === "Active" || status === "Active" ? "Active" : "Invited";
        const nextName = existing.name.length >= name.length ? existing.name : name;
        map.set(key, { ...existing, name: nextName, status: nextStatus });
      }
    }

    const out = Array.from(map.values());
    out.sort((a, b) => a.name.localeCompare(b.name));
    if ((q || "").trim()) {
      const needle = q.trim().toLowerCase();
      return out.filter((c) => c.name.toLowerCase().includes(needle) || c.email.toLowerCase().includes(needle));
    }
    return out;
  }, [clientProps, q]);

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
            {derivedClients.length ? (
              derivedClients.map((c) => (
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
              ))
            ) : (
              <div className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-5">
                <div className="text-sm font-semibold text-[var(--hw-ink)]">No clients yet</div>
                <div className="mt-1 text-sm text-[var(--hw-muted)]">
                  Add a <span className="font-semibold text-[var(--hw-ink)]">Client property</span> from Properties or Instant Estimate and it will show up here.
                </div>
              </div>
            )}
          </div>
        </Card>

        <EmptyState
          title="Invite a client"
          text="Send an invite link so your buyer/seller can share a project and message with your office."
          action={
            <Link href={withDemo("/pro/clients?invite=1")}>
              <Button>Generate invite link (stub)</Button>
            </Link>
          }
        />
      </div>
    </PortalShell>
  );
}
