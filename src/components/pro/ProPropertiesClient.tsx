"use client";

import * as React from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button, Card, Chip, Divider, EmptyState, Input, Label, Modal, Pill } from "@/components/ui";
import { isDemoMode, withDemo } from "@/lib/demo";

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

type StoredProperty = {
  id: string;
  address: string;
  nickname?: string;
  createdAt: string;
};

const STORAGE_KEYS = {
  customProps: "hw_props_custom_v1",
  photoPrefix: "hw_prop_photo_v1:",
} as const;

function readCustomProperties(): StoredProperty[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.customProps) || "[]";
    const arr = JSON.parse(raw) as StoredProperty[];
    return Array.isArray(arr) ? arr.filter((p) => p && typeof p.id === "string") : [];
  } catch {
    return [];
  }
}

function writeCustomProperties(items: StoredProperty[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.customProps, JSON.stringify(items.slice(0, 50)));
  } catch {
    // ignore
  }
}

export function ProPropertiesClient(props: {
  empty: React.ReactNode;
  addOpen?: boolean;
  onAddOpenChange?: (v: boolean) => void;
}) {
  // partnerId is used only to know whether we're in a partner-linked context.
  // The properties endpoint is token-based in mock mode.
  const { partnerId } = usePartnerContext();
  const router = useRouter();
  const [items, setItems] = React.useState<ApiProperty[] | null>(null);
  const [tab, setTab] = React.useState<"my" | "shared">("my");
  const [q, setQ] = React.useState("");

  const [addOpenInternal, setAddOpenInternal] = React.useState(false);
  const addOpen = props.addOpen ?? addOpenInternal;
  const setAddOpen = props.onAddOpenChange ?? setAddOpenInternal;

  const [newAddress, setNewAddress] = React.useState("");
  const [newNickname, setNewNickname] = React.useState("");

  const [photos, setPhotos] = React.useState<Record<string, string>>({});

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
      .then((j) => {
        const base = (j.properties || []) as ApiProperty[];

        // Merge custom properties stored locally (demo UX until DB is wired).
        const custom = readCustomProperties().map<ApiProperty>((p) => ({
          id: p.id,
          createdAt: p.createdAt,
          address: p.address,
          nickname: p.nickname || null,
          sharedWithMe: false,
          ownerName: "Fernando Rocha Jr",
          projectsCount: 0,
        }));

        const seen = new Set<string>();
        const merged: ApiProperty[] = [];
        [...custom, ...base].forEach((p) => {
          if (seen.has(p.id)) return;
          seen.add(p.id);
          merged.push(p);
        });

        setItems(merged);

        // Load photos (if any) from localStorage.
        const nextPhotos: Record<string, string> = {};
        merged.forEach((p) => {
          try {
            const v = window.localStorage.getItem(`${STORAGE_KEYS.photoPrefix}${p.id}`) || "";
            if (v) nextPhotos[p.id] = v;
          } catch {}
        });
        setPhotos(nextPhotos);
      })
      .catch(() => setItems([]));
  }, [partnerId]);

  if (items === null) {
    return (
      <div className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-5 text-sm text-[var(--hw-muted)]">
        Loading properties…
      </div>
    );
  }

  if (!items.length) {
    return (
      <div>
        <EmptyState
          title="No properties yet"
          text="Properties will appear once a client shares a work order or you add one manually."
        />
      </div>
    );
  }

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
            className="group overflow-hidden transition hover:shadow-[0_14px_40px_rgba(17,24,39,.10)] cursor-pointer"
            onClick={() => router.push(withDemo(`/pro/properties/${encodeURIComponent(p.id)}`))}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push(withDemo(`/pro/properties/${encodeURIComponent(p.id)}`));
              }
            }}
          >
            <div className="relative h-36 overflow-hidden bg-[linear-gradient(135deg,rgba(229,57,53,.14),rgba(17,24,39,.04))]">
              {(() => {
                const photo = photos[p.id] || (p.id === "prop_demo_6" ? "/demo_prop_demo_6.jpg" : "");
                return photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : null;
              })()}
              {/* Brand tint overlay (keep red-led, avoid muddy brown) */}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(229,57,53,.18),rgba(229,57,53,.05),rgba(255,255,255,.0))]" />

              <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-1.5">
                <Chip className="px-2.5 py-1 text-[11px]">{propertyBadge(p)}</Chip>
                <Chip className="shrink-0 px-2.5 py-1 text-[11px]">Projects: {p.projectsCount || 0}</Chip>
              </div>
            </div>

            <div className="p-4">
              <div className="min-w-0">
                <div className="truncate text-sm font-extrabold tracking-tight text-[var(--hw-ink)]">{shortLabel(p)}</div>
                {subtitle(p) ? <div className="mt-0.5 truncate text-xs text-[var(--hw-muted)]">{subtitle(p)}</div> : null}
              </div>

              <Divider className="my-4" />

              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-[var(--hw-muted)]">
                  {p.sharedWithMe ? "Shared by" : "Owner"}: <span className="font-semibold text-[var(--hw-ink)]">{p.ownerName || "—"}</span>
                </div>
                <div className="text-xs font-semibold text-[var(--hw-muted)]">View details →</div>
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

      {/* Add property modal (demo) */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add property">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label className="text-xs">Address</Label>
            <Input value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="123 Main St, Chicago, IL 606.." />
            <div className="text-xs text-[var(--hw-muted)]">We’ll wire Google Places autocomplete next. For now, type the full address.</div>
          </div>

          <div className="grid gap-2">
            <Label className="text-xs">Nickname (optional)</Label>
            <Input value={newNickname} onChange={(e) => setNewNickname(e.target.value)} placeholder="Home, Lake Condo…" />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const address = newAddress.trim();
                if (!address) return;
                const id = `prop_local_${Math.random().toString(36).slice(2, 10)}`;
                const createdAt = new Date().toISOString();
                const nextStored = [{ id, address, nickname: newNickname.trim() || undefined, createdAt }, ...readCustomProperties()];
                writeCustomProperties(nextStored);

                const next: ApiProperty = {
                  id,
                  createdAt,
                  address,
                  nickname: newNickname.trim() || null,
                  sharedWithMe: false,
                  ownerName: "Fernando Rocha Jr",
                  projectsCount: 0,
                };

                setItems((prev) => (prev ? [next, ...prev] : [next]));
                setNewAddress("");
                setNewNickname("");
                setAddOpen(false);
              }}
            >
              Add
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
