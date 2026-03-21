"use client";

import * as React from "react";

import { Button, Card, Chip, Divider, Input, Pill } from "@/components/ui";
import { isDemoMode } from "@/lib/demo";

import { usePartnerContext } from "./usePartnerContext";

type ApiProperty = {
  id: string;
  createdAt: string;
  address: string;
  nickname?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  sharedWithMe?: boolean | null;
  ownerName?: string | null;
  projectsCount?: number | null;
};

function normalizeAddress(s: string) {
  return (s || "").replace(/\s+/g, " ").trim();
}

function shortLabel(p: ApiProperty) {
  const main = p.nickname || p.address;
  return normalizeAddress(main);
}

function subtitle(p: ApiProperty) {
  if (p.nickname) return normalizeAddress(p.address);
  return "";
}

function propertyBadge(p: ApiProperty) {
  if (p.sharedWithMe) return "Shared";
  return "My property";
}

export function ProPropertiesClient(props: { empty: React.ReactNode }) {
  // partnerId is used only to know whether we're in a partner-linked context.
  // The properties endpoint is token-based in mock mode.
  const { partnerId } = usePartnerContext();
  const [items, setItems] = React.useState<ApiProperty[] | null>(null);
  const [tab, setTab] = React.useState<"my" | "shared">("my");
  const [q, setQ] = React.useState("");

  React.useEffect(() => {
    // Allow demo to load even if partner context isn't present yet.
    const url = new URL("/api/properties", window.location.origin);
    if (isDemoMode()) {
      url.searchParams.set("demo", "1");
    } else {
      // until auth is wired, always use the demo token for PRO portal.
      url.searchParams.set("token", "demo");
    }

    fetch(url)
      .then((r) => r.json())
      .then((j) => setItems(j.properties || []))
      .catch(() => setItems([]));
  }, [partnerId]);

  if (items === null) {
    return (
      <div className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-5 text-sm text-[var(--hw-muted)]">
        Loading properties…
      </div>
    );
  }

  if (!items.length) return <>{props.empty}</>;

  const filtered = items
    .filter((p) => (tab === "shared" ? !!p.sharedWithMe : !p.sharedWithMe))
    .filter((p) => {
      const hay = `${p.nickname || ""} ${p.address || ""} ${p.city || ""} ${p.state || ""} ${p.zip || ""}`.toLowerCase();
      const needle = (q || "").trim().toLowerCase();
      if (!needle) return true;
      return hay.includes(needle);
    });

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTab("my")}
            className={
              "rounded-full px-4 py-2 text-xs font-semibold transition " +
              (tab === "my"
                ? "border border-[rgba(229,57,53,.25)] bg-[rgba(229,57,53,.10)] text-[var(--hw-red)]"
                : "border border-[var(--hw-line)] bg-white text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]")
            }
          >
            My properties
          </button>
          <button
            type="button"
            onClick={() => setTab("shared")}
            className={
              "rounded-full px-4 py-2 text-xs font-semibold transition " +
              (tab === "shared"
                ? "border border-[rgba(229,57,53,.25)] bg-[rgba(229,57,53,.10)] text-[var(--hw-red)]"
                : "border border-[var(--hw-line)] bg-white text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]")
            }
          >
            Shared with me
          </button>
          <Pill className="bg-white">{filtered.length}</Pill>
        </div>

        <div className="w-full sm:w-[320px]">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or address…" />
        </div>
      </div>

      {/* Grid */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => (
          <Card
            key={p.id}
            className="group overflow-hidden"
          >
            <div className="relative h-32 bg-[linear-gradient(135deg,rgba(229,57,53,.14),rgba(17,24,39,.04))]">
              <div className="absolute left-4 top-4">
                <Chip>{propertyBadge(p)}</Chip>
              </div>
              <div className="absolute right-4 top-4">
                <button
                  type="button"
                  className="rounded-full border border-[rgba(255,255,255,.7)] bg-white/80 px-3 py-1.5 text-xs font-semibold text-[var(--hw-ink)] shadow-sm hover:bg-white"
                >
                  Edit
                </button>
              </div>

              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-extrabold tracking-tight text-[var(--hw-ink)]">{shortLabel(p)}</div>
                    {subtitle(p) ? (
                      <div className="mt-0.5 truncate text-xs text-[var(--hw-muted)]">{subtitle(p)}</div>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[11px] font-semibold text-[var(--hw-muted)]">Projects</div>
                    <div className="text-sm font-extrabold text-[var(--hw-ink)]">{p.projectsCount || 0}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="secondary">
                  Property detail
                </Button>
                <Button size="sm" variant="ghost">
                  View projects
                </Button>
                <Button size="sm" variant="ghost">
                  Start estimate
                </Button>
              </div>

              <Divider className="my-4" />

              <div className="text-xs text-[var(--hw-muted)]">
                {p.sharedWithMe ? "Shared by" : "Owner"}: <span className="font-semibold text-[var(--hw-ink)]">{p.ownerName || "—"}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {!filtered.length ? (
        <div className="mt-5">
          <Card className="p-5">
            <div className="text-sm font-semibold text-[var(--hw-ink)]">No matches</div>
            <div className="mt-1 text-sm text-[var(--hw-muted)]">Try a different search, or switch tabs.</div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
