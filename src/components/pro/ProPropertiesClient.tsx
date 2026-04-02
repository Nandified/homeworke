"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { formatPhoneUS } from "@/lib/phone";
import { Button, Card, Chip, Divider, EmptyState, Input, Label, Modal } from "@/components/ui";
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
  /** Properties the PRO added on behalf of a client ("secret account" creation). */
  clientProperty?: boolean | null;
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

function propertyBadge(p: ApiProperty) {
  if (p.sharedWithMe) return "Shared with me";
  if (p.clientProperty) return "Client property";
  return "My property";
}

type StoredProperty = {
  id: string;
  address: string;
  nickname?: string;
  createdAt: string;
};

type StoredClientProperty = {
  id: string;
  createdAt: string;
  address: string;
  nickname?: string;
  propertyType?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
};

const STORAGE_KEYS = {
  customProps: "hw_props_custom_v1",
  clientProps: "hw_props_client_v1",
  photoPrefix: "hw_prop_photo_v1:",
  addrPhotoPrefix: "hw_addr_photo_v1:",
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

function readClientProperties(): StoredClientProperty[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.clientProps) || "[]";
    const arr = JSON.parse(raw) as StoredClientProperty[];
    return Array.isArray(arr) ? arr.filter((p) => p && typeof p.id === "string") : [];
  } catch {
    return [];
  }
}

function writeClientProperties(items: StoredClientProperty[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.clientProps, JSON.stringify(items.slice(0, 200)));
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
  const [tab, setTab] = React.useState<"all" | "my" | "shared" | "clients">("all");
  const [q, setQ] = React.useState("");

  const [addOpenInternal, setAddOpenInternal] = React.useState(false);
  const addOpen = props.addOpen ?? addOpenInternal;
  const setAddOpen = props.onAddOpenChange ?? setAddOpenInternal;

  const [newAddress, setNewAddress] = React.useState("");
  const [newNickname, setNewNickname] = React.useState("");
  const [newPropertyType, setNewPropertyType] = React.useState<"Condo" | "House" | "Multi-Units" | "Town house" | "Commercial" | "">("");

  const [newClientFirstName, setNewClientFirstName] = React.useState("");
const [newClientLastName, setNewClientLastName] = React.useState("");
  const [newClientEmail, setNewClientEmail] = React.useState("");
  const [newClientPhone, setNewClientPhone] = React.useState("");

  const [addMode, setAddMode] = React.useState<"property" | "client">("client");

  React.useEffect(() => {
    // Context-aware default: when the modal opens, default to the current tab.
    if (!addOpen) return;
    if (tab === "clients") setAddMode("client");
    if (tab === "my") setAddMode("property");
    if (tab === "all") setAddMode("property");
    // If we're on "shared", default to "client" since this page is PRO-centric.
    if (tab === "shared") setAddMode("client");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addOpen]);
  const [newPhotoDataUrl, setNewPhotoDataUrl] = React.useState<string>("");
  const [addTouched, setAddTouched] = React.useState(false);

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
          clientProperty: false,
          ownerName: "Fernando Rocha Jr",
          projectsCount: 0,
        }));

        // Local-only "client properties" (added by the PRO on behalf of a client).
        const clientProps = readClientProperties().map<ApiProperty>((p) => ({
          id: p.id,
          createdAt: p.createdAt,
          address: p.address,
          nickname: p.nickname || null,
          sharedWithMe: false,
          clientProperty: true,
          ownerName: p.clientName || null,
          ownerEmail: p.clientEmail || null,
          ownerPhone: p.clientPhone || null,
          propertyType: p.propertyType || null,
          projectsCount: 0,
        }));

        const seen = new Set<string>();
        const merged: ApiProperty[] = [];
        // Order matters: we want PRO-created client props and manual props to feel "first-class" in demo.
        ;[...clientProps, ...custom, ...base].forEach((p) => {
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
    .filter((p) => {
      if (tab === "all") return true;
      if (tab === "shared") return !!p.sharedWithMe;
      if (tab === "clients") return !!p.clientProperty;
      // "my" tab
      return !p.sharedWithMe && !p.clientProperty;
    })
    .filter((p) => {
      const hay = `${p.nickname || ""} ${p.address || ""} ${p.city || ""} ${p.state || ""} ${p.zip || ""} ${p.ownerName || ""} ${p.ownerEmail || ""}`.toLowerCase();
      const needle = (q || "").trim().toLowerCase();
      if (!needle) return true;
      return hay.includes(needle);
    });

  const counts = {
    all: items.length,
    my: items.filter((p) => !p.sharedWithMe && !p.clientProperty).length,
    clients: items.filter((p) => !!p.clientProperty).length,
    shared: items.filter((p) => !!p.sharedWithMe).length,
  };

  const req = {
    clientFirst: addMode === "client" ? newClientFirstName.trim() : "ok",
    clientLast: addMode === "client" ? newClientLastName.trim() : "ok",
    clientEmail: addMode === "client" ? newClientEmail.trim() : "ok",
    clientPhone: addMode === "client" ? newClientPhone.trim() : "ok",
    address: newAddress.trim(),
    type: newPropertyType,
    photo: newPhotoDataUrl.trim(),
  };

  const normalizeAddr = (s: string) => (s || "").replace(/\s+/g, " ").trim().toLowerCase();
  const addrNorm = normalizeAddr(req.address);
  const dupAddr = !!addrNorm && items.some((p) => normalizeAddr(p.address) === addrNorm);

  const missing = {
    clientFirst: addMode === "client" && !req.clientFirst,
    clientLast: addMode === "client" && !req.clientLast,
    clientEmail: addMode === "client" && !req.clientEmail,
    clientPhone: addMode === "client" && !req.clientPhone,
    address: !req.address || dupAddr,
    type: !req.type,
    // Photo is optional.
    photo: false,
  };

  const canSubmit = !Object.values(missing).some(Boolean);
  const errRing = "border-[var(--hw-red)] ring-4 ring-[rgba(229,57,53,.10)]";

  function CountBadge({ n }: { n: number }) {
    return (
      <span className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full border border-[var(--hw-line)] bg-white px-2 py-0.5 text-[11px] font-extrabold text-[var(--hw-ink)]">
        {n}
      </span>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
            <button
              type="button"
              onClick={() => setTab("all")}
              className={
                "rounded-full px-4 py-2 text-xs font-semibold transition " +
                (tab === "all"
                  ? "border border-[rgba(229,57,53,.25)] bg-[rgba(229,57,53,.10)] text-[var(--hw-red)]"
                  : "border border-[var(--hw-line)] bg-white text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]")
              }
            >
              All <CountBadge n={counts.all} />
            </button>

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
              My properties <CountBadge n={counts.my} />
            </button>

            <button
              type="button"
              onClick={() => setTab("clients")}
              className={
                "rounded-full px-4 py-2 text-xs font-semibold transition " +
                (tab === "clients"
                  ? "border border-[rgba(229,57,53,.25)] bg-[rgba(229,57,53,.10)] text-[var(--hw-red)]"
                  : "border border-[var(--hw-line)] bg-white text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]")
              }
            >
              Client properties <CountBadge n={counts.clients} />
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
              Shared with me <CountBadge n={counts.shared} />
            </button>
          </div>

          <div className="w-full sm:w-[380px]">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or address…" />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="mt-4 grid gap-5 sm:grid-cols-2">
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
                const chosen = photos[p.id] || (p.id === "prop_demo_6" ? "/demo_prop_demo_6.jpg" : "");
                const auto = !chosen && p.address ? `/api/google/streetview?address=${encodeURIComponent(p.address)}&size=800x450&fov=80&pitch=10` : "";
                const photoRaw = chosen || auto;
                const photo = photoRaw.startsWith("google_place:")
                  ? `/api/google/place-photo?ref=${encodeURIComponent(photoRaw.replace(/^google_place:/, ""))}&maxwidth=900`
                  : photoRaw;
                const hasPhoto = !!photo;
                return (
                  <>
                    {hasPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    ) : null}
                    {/* Brand tint overlay only when we don't have an image */}
                    {!hasPhoto ? (
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(229,57,53,.18),rgba(229,57,53,.05),rgba(255,255,255,.0))]" />
                    ) : null}
                  </>
                );
              })()}

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
                <div className="min-w-0 text-xs text-[var(--hw-muted)] truncate">
                  {p.sharedWithMe ? "Shared by" : "Owner"}: <span className="font-semibold text-[var(--hw-ink)]">{p.ownerName || "—"}</span>
                </div>
                <div className="shrink-0 whitespace-nowrap text-xs font-semibold text-[var(--hw-red)]">Details →</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {!filtered.length ? (
        <div className="mt-5 rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-6">
          {(() => {
            const isEmptyTab =
              (tab === "clients" && counts.clients === 0) ||
              (tab === "shared" && counts.shared === 0) ||
              (tab === "my" && counts.my === 0) ||
              (tab === "all" && counts.all === 0);

            if (isEmptyTab && (q || "").trim() === "") {
              const title =
                tab === "clients"
                  ? "No client properties yet"
                  : tab === "shared"
                    ? "No shared properties yet"
                    : tab === "my"
                      ? "No properties yet"
                      : "No properties yet";

              const text =
                tab === "clients"
                  ? "Add your first client property to start tracking projects, estimates, and shared work—making homeownership easier for your clients."
                  : tab === "shared"
                    ? "When a client shares a report with you, it will show up here."
                    : "Add a property to start running instant estimates and organizing projects in one place.";

              return (
                <>
                  <div className="text-base font-extrabold tracking-tight text-[var(--hw-ink)]">{title}</div>
                  <div className="mt-1 text-sm leading-relaxed text-[var(--hw-muted)]">{text}</div>
                </>
              );
            }

            return (
              <>
                <div className="text-sm font-semibold text-[var(--hw-ink)]">No matches</div>
                <div className="mt-1 text-sm text-[var(--hw-muted)]">Try a different search, or switch tabs.</div>
              </>
            );
          })()}
        </div>
      ) : null}

      {/* Add property modal (demo) */}
      <Modal
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
        }}
        title="Add property"
        mobilePlacement="center"
        scrollKey={addMode}
      >
        <div className="grid gap-4">
          {/* Mode toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAddMode("client")}
              className={
                "rounded-full px-3 py-2 text-xs font-semibold transition " +
                (addMode === "client"
                  ? "border border-[rgba(229,57,53,.25)] bg-[rgba(229,57,53,.10)] text-[var(--hw-red)]"
                  : "border border-[var(--hw-line)] bg-white text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]")
              }
            >
              Client property
            </button>
            <button
              type="button"
              onClick={() => setAddMode("property")}
              className={
                "rounded-full px-3 py-2 text-xs font-semibold transition " +
                (addMode === "property"
                  ? "border border-[rgba(229,57,53,.25)] bg-[rgba(229,57,53,.10)] text-[var(--hw-red)]"
                  : "border border-[var(--hw-line)] bg-white text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]")
              }
            >
              My property
            </button>
          </div>

          {/* Keep desktop height stable; on mobile avoid giant empty gaps. */}
          <div className="grid gap-4">
            {addMode === "client" ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label className="text-xs">Client first name</Label>
                    <Input
                      value={newClientFirstName}
                      onChange={(e) => setNewClientFirstName(e.target.value)}
                      placeholder="Jane"
                      className={addTouched && missing.clientFirst ? errRing : ""}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs">Client last name</Label>
                    <Input
                      value={newClientLastName}
                      onChange={(e) => setNewClientLastName(e.target.value)}
                      placeholder="Client"
                      className={addTouched && missing.clientLast ? errRing : ""}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label className="text-xs">Email</Label>
                  <Input
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="jane@email.com"
                    inputMode="email"
                    className={addTouched && missing.clientEmail ? errRing : ""}
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="text-xs">Phone</Label>
                  <Input
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(formatPhoneUS(e.target.value))}
                    placeholder="(312) 555-0123"
                    inputMode="tel"
                    className={addTouched && missing.clientPhone ? errRing : ""}
                  />
                </div>
              </>
            ) : null}

            <div className="grid gap-2">
              <Label className="text-xs">Address</Label>
              {addTouched && dupAddr ? (
                <div className="text-xs font-semibold text-[var(--hw-red)]">This property already exists in your account.</div>
              ) : null}
              <AddressAutocomplete
                value={newAddress}
                onChange={setNewAddress}
                placeholder="123 Main St, Chicago, IL 606.."
                className={addTouched && missing.address ? errRing : ""}
                country="us"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-xs">Nickname (optional)</Label>
              <Input value={newNickname} onChange={(e) => setNewNickname(e.target.value)} placeholder="Home, Lake Condo…" />
            </div>

            <div className="grid gap-2">
              <Label className="text-xs">Type of property</Label>
              <select
                className={`h-11 w-full rounded-[var(--hw-radius-sm)] border border-[var(--hw-line)] bg-gradient-to-b from-white to-[var(--hw-soft)] px-3 text-sm text-[var(--hw-ink)] shadow-[0_10px_22px_rgba(17,24,39,.06)] outline-none transition hover:shadow-[0_12px_26px_rgba(17,24,39,.08)] focus:border-[rgba(229,57,53,.35)] focus:ring-4 focus:ring-[rgba(229,57,53,.10)] ${addTouched && missing.type ? errRing : ""}`}
                value={newPropertyType}
                onChange={(e) => setNewPropertyType(e.target.value as typeof newPropertyType)}
              >
                <option value="">Type of Property</option>
                <option value="Condo">Condo</option>
                <option value="House">House</option>
                <option value="Multi-Units">Multi-Units</option>
                <option value="Town house">Town house</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label className="text-xs">Photo (optional)</Label>
              <input
                type="file"
                accept="image/*"
                className="block w-full text-sm text-[var(--hw-muted)] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--hw-soft)] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-[var(--hw-ink)] hover:file:bg-[rgba(229,57,53,.08)]"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    const dataUrl = await fileToDataUrl(f);
                    setNewPhotoDataUrl(dataUrl);
                  } catch {
                    // ignore
                  }
                }}
                />
              {newPhotoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={newPhotoDataUrl} alt="" className="mt-2 h-28 w-full rounded-[var(--hw-radius-sm)] object-cover" />
              ) : null}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setAddOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setAddTouched(true);
                if (!canSubmit) return;
                const address = newAddress.trim();
                if (!address) return;

                const id = `${addMode === "client" ? "prop_client" : "prop_local"}_${Math.random().toString(36).slice(2, 10)}`;
                const createdAt = new Date().toISOString();

                if (newPhotoDataUrl) {
                  try {
                    window.localStorage.setItem(`${STORAGE_KEYS.photoPrefix}${id}`, newPhotoDataUrl);
                  } catch {}
                }

                if (addMode === "client") {
                  const clientName = `${newClientFirstName} ${newClientLastName}`.trim();
                  if (!clientName) return;

                  const nextStored: StoredClientProperty[] = [
                    {
                      id,
                      createdAt,
                      address,
                      nickname: newNickname.trim() || undefined,
                      propertyType: newPropertyType || undefined,
                      clientName,
                      clientEmail: newClientEmail.trim() || undefined,
                      clientPhone: newClientPhone.trim() || undefined,
                    },
                    ...readClientProperties(),
                  ];
                  writeClientProperties(nextStored);

                  const next: ApiProperty = {
                    id,
                    createdAt,
                    address,
                    nickname: newNickname.trim() || null,
                    sharedWithMe: false,
                    clientProperty: true,
                    ownerName: clientName,
                    ownerEmail: newClientEmail.trim() || null,
                    ownerPhone: newClientPhone.trim() || null,
                    propertyType: newPropertyType || null,
                    projectsCount: 0,
                  };

                  setItems((prev) => (prev ? [next, ...prev] : [next]));
                  if (newPhotoDataUrl) setPhotos((prev) => ({ ...prev, [id]: newPhotoDataUrl }));

                  setNewClientFirstName("");
                  setNewClientLastName("");
                  setNewClientEmail("");
                  setNewClientPhone("");
                } else {
                  const nextStored = [{ id, address, nickname: newNickname.trim() || undefined, createdAt }, ...readCustomProperties()];
                  writeCustomProperties(nextStored);

                  const next: ApiProperty = {
                    id,
                    createdAt,
                    address,
                    nickname: newNickname.trim() || null,
                    sharedWithMe: false,
                    clientProperty: false,
                    ownerName: "Fernando Rocha Jr",
                    projectsCount: 0,
                  };

                  setItems((prev) => (prev ? [next, ...prev] : [next]));
                  if (newPhotoDataUrl) setPhotos((prev) => ({ ...prev, [id]: newPhotoDataUrl }));
                }

                setNewAddress("");
                setNewNickname("");
                setNewPropertyType("");
                setNewPhotoDataUrl("");
                setAddOpen(false);
              }}
            >
              {addMode === "client" ? "Add property" : "Add"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
