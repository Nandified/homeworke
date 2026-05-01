"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { formatPhoneUS } from "@/lib/phone";
import { Button, Card, Chip, Divider, EmptyState, Input, Label, Modal } from "@/components/ui";

type Session = { token: string };

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem("hw_session_v1");
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

type ApiProperty = {
  id: string;
  createdAt: string;
  address: string;
  nickname?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
  propertyType?: string | null;
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

// HO portal must be isolated from PRO portal localStorage.
const SCOPE = "HO" as const;

const STORAGE_KEYS = {
  customProps: `hw_props_custom_v1__${SCOPE}`,
  photoPrefix: `hw_prop_photo_v1__${SCOPE}:`,
  addrPhotoPrefix: `hw_addr_photo_v1__${SCOPE}:`,
} as const;

type StoredProperty = {
  id: string;
  address: string;
  nickname?: string;
  createdAt: string;
  propertyType?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
};

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
    window.localStorage.setItem(STORAGE_KEYS.customProps, JSON.stringify(items.slice(0, 200)));
  } catch {
    // ignore
  }
}

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("read_failed"));
    reader.readAsDataURL(file);
  });
}

function CountBadge({ n }: { n: number }) {
  return (
    <span className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full border border-[var(--hw-line)] bg-white px-2 py-0.5 text-[11px] font-extrabold text-[var(--hw-ink)]">
      {n}
    </span>
  );
}

function TabButton(props: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={
        "rounded-full border px-4 py-2 text-xs font-semibold transition " +
        (props.active
          ? "border-[rgba(229,57,53,.45)] bg-[rgba(229,57,53,.08)] text-[var(--hw-red)]"
          : "border-[var(--hw-line)] bg-white text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]")
      }
      aria-pressed={props.active}
    >
      {props.children}
    </button>
  );
}

export function HOPropertiesClient(props: { empty: React.ReactNode; addOpen?: boolean; onAddOpenChange?: (v: boolean) => void }) {
  const router = useRouter();
  const [items, setItems] = React.useState<ApiProperty[] | null>(null);
  const [tab, setTab] = React.useState<"all" | "my">("all");
  const [q, setQ] = React.useState("");

  const [addOpenInternal, setAddOpenInternal] = React.useState(false);
  const addOpen = props.addOpen ?? addOpenInternal;
  const setAddOpen = props.onAddOpenChange ?? setAddOpenInternal;

  const [newAddress, setNewAddress] = React.useState("");
  const [newNickname, setNewNickname] = React.useState("");
  const [newPropertyType, setNewPropertyType] = React.useState<"Condo" | "House" | "Multi-Units" | "Town house" | "Commercial" | "">("");

  const [newOwnerName, setNewOwnerName] = React.useState("");
  const [newOwnerEmail, setNewOwnerEmail] = React.useState("");
  const [newOwnerPhone, setNewOwnerPhone] = React.useState("");

  const [newPhotoDataUrl, setNewPhotoDataUrl] = React.useState<string>("");
  const [addTouched, setAddTouched] = React.useState(false);
  const [photos, setPhotos] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    const s = loadSession();
    if (!s?.token) {
      setItems([]);
      return;
    }

    const url = new URL("/api/properties", window.location.origin);
    url.searchParams.set("token", s.token);

    fetch(url)
      .then((r) => r.json())
      .then((j) => {
        const base = (j.properties || []) as ApiProperty[];

        // Merge HO-local properties stored locally (demo UX until DB is wired).
        const custom = readCustomProperties().map<ApiProperty>((p) => ({
          id: p.id,
          createdAt: p.createdAt,
          address: p.address,
          nickname: p.nickname || null,
          ownerName: p.ownerName || null,
          ownerEmail: p.ownerEmail || null,
          ownerPhone: p.ownerPhone || null,
          propertyType: p.propertyType || null,
          projectsCount: 0,
        }));

        const seen = new Set<string>();
        const merged: ApiProperty[] = [];
        [...custom, ...base].forEach((p) => {
          if (!p?.id) return;
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
            if (v) {
              nextPhotos[p.id] = v;
              return;
            }

            const addrKey = `${STORAGE_KEYS.addrPhotoPrefix}${normalizeAddress(p.address).toLowerCase()}`;
            const byAddr = window.localStorage.getItem(addrKey) || "";
            if (byAddr) nextPhotos[p.id] = byAddr;
          } catch {}
        });
        setPhotos(nextPhotos);
      })
      .catch(() => setItems([]));
  }, []);

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
        <EmptyState title="No properties yet" text="Add a property to speed up service requests and scheduling." />
      </div>
    );
  }

  const filtered = items
    .filter((p) => {
      if (tab === "all") return true;
      return true;
    })
    .filter((p) => {
      const hay = `${p.nickname || ""} ${p.address || ""} ${p.city || ""} ${p.state || ""} ${p.zip || ""} ${p.ownerName || ""} ${p.ownerEmail || ""}`.toLowerCase();
      const needle = (q || "").trim().toLowerCase();
      if (!needle) return true;
      return hay.includes(needle);
    });

  const counts = {
    all: items.length,
  };

  const req = {
    address: newAddress.trim(),
    nickname: newNickname.trim(),
    type: newPropertyType,
    ownerName: newOwnerName.trim(),
    ownerEmail: newOwnerEmail.trim(),
    ownerPhone: newOwnerPhone.trim(),
    photo: newPhotoDataUrl.trim(),
  };

  const normalizeAddr = (s: string) => (s || "").replace(/\s+/g, " ").trim().toLowerCase();
  const addrNorm = normalizeAddr(req.address);
  const dupAddr = !!addrNorm && items.some((p) => normalizeAddr(p.address) === addrNorm);

  const missing = {
    address: !req.address || dupAddr,
    type: !req.type,
  };

  const canSubmit = !Object.values(missing).some(Boolean);
  const errRing = "border-[var(--hw-red)] ring-4 ring-[rgba(229,57,53,.10)]";

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <TabButton active={tab === "all"} onClick={() => setTab("all")}>
              All <CountBadge n={counts.all} />
            </TabButton>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <input
            className="h-10 w-full rounded-[999px] border border-[var(--hw-line)] bg-[var(--hw-soft)] px-4 text-sm outline-none transition focus:border-[rgba(229,57,53,.35)] focus:ring-4 focus:ring-[rgba(229,57,53,.10)]"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or address…"
          />
          <div className="shrink-0 text-xs text-[var(--hw-muted)]">{filtered.length} result{filtered.length === 1 ? "" : "s"}</div>
        </div>
      </div>

      {/* Cards grid */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {filtered.map((p) => {
          const img = photos[p.id] || "";
          return (
            <Card key={p.id} className="overflow-hidden">
              <div className="relative h-36 w-full bg-[var(--hw-soft)]">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt="Property" className="h-full w-full object-cover" />
                ) : null}

                <div className="absolute left-3 top-3">
                  <span className="inline-flex items-center rounded-full border border-[var(--hw-line)] bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-[var(--hw-ink)] backdrop-blur">
                    Property
                  </span>
                </div>

                <div className="absolute right-3 top-3">
                  <span className="inline-flex items-center rounded-full border border-[var(--hw-line)] bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-[var(--hw-ink)] backdrop-blur">
                    Projects: {p.projectsCount || 0}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="text-sm font-extrabold tracking-tight text-[var(--hw-ink)]">{shortLabel(p)}</div>
                <div className="mt-1 text-xs text-[var(--hw-muted)]">{subtitle(p)}</div>

                <Divider className="my-3" />

                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 text-xs text-[var(--hw-muted)] truncate">
                    Owner: <span className="font-semibold text-[var(--hw-ink)]">{p.ownerName || "—"}</span>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-semibold text-[var(--hw-red)] hover:underline"
                    onClick={() => router.push(`/ho/properties?property=${encodeURIComponent(p.id)}`)}
                  >
                    Details →
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add property">
        <div className="grid gap-4">
          <div>
            <Label htmlFor="prop-address">Address</Label>
            <AddressAutocomplete value={newAddress} onChange={setNewAddress} placeholder="123 Main St, Chicago, IL" />
            {addTouched && missing.address ? (
              <div className="mt-1 text-xs text-[var(--hw-red)]">{dupAddr ? "This address is already saved." : "Address is required."}</div>
            ) : null}
          </div>

          <div>
            <Label htmlFor="prop-nickname">Nickname (optional)</Label>
            <Input id="prop-nickname" value={newNickname} onChange={(e) => setNewNickname(e.target.value)} placeholder="e.g. My home" />
          </div>

          <div>
            <Label htmlFor="prop-type">Property type</Label>
            <select
              id="prop-type"
              className={
                "h-10 w-full rounded-[var(--hw-radius-lg)] border bg-white px-3 text-sm outline-none transition focus:ring-4 focus:ring-[rgba(229,57,53,.10)] " +
                (addTouched && missing.type ? errRing : "border-[var(--hw-line)]")
              }
              value={newPropertyType}
              onChange={(e) => setNewPropertyType(e.target.value as any)}
            >
              <option value="">Select…</option>
              <option value="Condo">Condo</option>
              <option value="House">House</option>
              <option value="Multi-Units">Multi-Units</option>
              <option value="Town house">Town house</option>
              <option value="Commercial">Commercial</option>
            </select>
            {addTouched && missing.type ? <div className="mt-1 text-xs text-[var(--hw-red)]">Property type is required.</div> : null}
          </div>

          <Divider />

          <div className="grid gap-3">
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Owner info (optional)</div>
            <div>
              <Label htmlFor="owner-name">Owner name</Label>
              <Input id="owner-name" value={newOwnerName} onChange={(e) => setNewOwnerName(e.target.value)} placeholder="Name" />
            </div>
            <div>
              <Label htmlFor="owner-email">Owner email</Label>
              <Input id="owner-email" value={newOwnerEmail} onChange={(e) => setNewOwnerEmail(e.target.value)} placeholder="email@example.com" inputMode="email" />
            </div>
            <div>
              <Label htmlFor="owner-phone">Owner phone</Label>
              <Input
                id="owner-phone"
                value={newOwnerPhone}
                onChange={(e) => setNewOwnerPhone(formatPhoneUS(e.target.value))}
                placeholder="(555) 555-5555"
                inputMode="tel"
              />
            </div>
          </div>

          <Divider />

          <div>
            <Label htmlFor="prop-photo">Photo (optional)</Label>
            <Input
              id="prop-photo"
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  const url = await fileToDataUrl(f);
                  setNewPhotoDataUrl(url);
                } catch {
                  setNewPhotoDataUrl("");
                }
              }}
            />
            {newPhotoDataUrl ? (
              <div className="mt-2 rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={newPhotoDataUrl} alt="Preview" className="h-28 w-full rounded-[var(--hw-radius-lg)] object-cover" />
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setAddTouched(true);
                if (!canSubmit) return;

                const id = `prop_${Math.random().toString(36).slice(2, 10)}`;
                const createdAt = new Date().toISOString();

                const next: StoredProperty = {
                  id,
                  createdAt,
                  address: req.address,
                  nickname: req.nickname || undefined,
                  propertyType: req.type || undefined,
                  ownerName: req.ownerName || undefined,
                  ownerEmail: req.ownerEmail || undefined,
                  ownerPhone: req.ownerPhone || undefined,
                };

                const out = [next, ...readCustomProperties()];
                writeCustomProperties(out);

                if (req.photo) {
                  try {
                    window.localStorage.setItem(`${STORAGE_KEYS.photoPrefix}${id}`, req.photo);
                    window.localStorage.setItem(`${STORAGE_KEYS.addrPhotoPrefix}${normalizeAddress(req.address).toLowerCase()}`, req.photo);
                  } catch {}
                }

                setItems((prev) => {
                  const base = Array.isArray(prev) ? prev : [];
                  return [
                    {
                      id,
                      createdAt,
                      address: req.address,
                      nickname: req.nickname || null,
                      ownerName: req.ownerName || null,
                      ownerEmail: req.ownerEmail || null,
                      ownerPhone: req.ownerPhone || null,
                      propertyType: req.type || null,
                      projectsCount: 0,
                    },
                    ...base,
                  ];
                });

                setAddOpen(false);
                setAddTouched(false);
                setNewAddress("");
                setNewNickname("");
                setNewPropertyType("");
                setNewOwnerName("");
                setNewOwnerEmail("");
                setNewOwnerPhone("");
                setNewPhotoDataUrl("");
              }}
            >
              Save property
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
