"use client";

import * as React from "react";
import Link from "next/link";

import { UserAvatar, useStoredProfile } from "@/components/user-avatar";
import { AIWorkOrderIntakeCard } from "@/components/ai/AIWorkOrderIntakeCard";
import { Button, Card, Chip, Divider, EmptyState, Input, Label, Modal } from "@/components/ui";
import { withDemo } from "@/lib/demo";

export type ProPropertyDetail = {
  id: string;
  createdAt: string;
  address: string;
  nickname?: string | null;
  sharedWithMe?: boolean | null;
  ownerName?: string | null;
  projectsCount?: number | null;
};

function shortTitle(p: ProPropertyDetail) {
  return (p.nickname || p.address || "Property").trim();
}

function subAddress(p: ProPropertyDetail) {
  if (!p.nickname) return "";
  return (p.address || "").trim();
}

function normalizeAddressKey(s: string) {
  return (s || "").replace(/\s+/g, " ").trim().toLowerCase();
}

// (intentionally blank)

export function ProPropertyDetailClient(props: { property: ProPropertyDetail; openEdit?: boolean }) {
  const [item, setItem] = React.useState<ProPropertyDetail>(props.property);
  const profile = useStoredProfile();
  const [editOpen, setEditOpen] = React.useState(!!props.openEdit);
  const [nickname, setNickname] = React.useState(props.property.nickname || "");
  const [photoUrl, setPhotoUrl] = React.useState("");

  const [requestOpen, setRequestOpen] = React.useState(false);

  const [googleOpen, setGoogleOpen] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [googleErr, setGoogleErr] = React.useState("");
  const [googlePhotos, setGooglePhotos] = React.useState<Array<{ ref: string; width: number; height: number }>>([]);

  React.useLayoutEffect(() => {
    try {
      const v = window.localStorage.getItem(`hw_prop_photo_v1:${props.property.id}`) || "";
      setPhotoUrl(v);
    } catch {}
  }, [props.property.id]);

  // Apply local override (UI-only) without flashing.
  React.useLayoutEffect(() => {
    try {
      const override = window.localStorage.getItem(`hw_prop_nickname_v1:${item.id}`) || "";
      if (override && override !== item.nickname) {
        setItem((p) => ({ ...p, nickname: override }));
        setNickname(override);
      }
    } catch {}
  }, [item.id, item.nickname]);

  const chosenPhoto = (photoUrl || (item.id === "prop_demo_6" ? "/demo_prop_demo_6.jpg" : "")).trim();

  const addrKey = item.address ? `hw_addr_photo_v1:${normalizeAddressKey(item.address)}` : "";
  const cachedByAddr = (() => {
    if (!addrKey) return "";
    try {
      return window.localStorage.getItem(addrKey) || "";
    } catch {
      return "";
    }
  })();

  const autoPhoto = !chosenPhoto && !cachedByAddr && item.address ? `/api/google/streetview?address=${encodeURIComponent(item.address)}&size=1200x675&fov=80&pitch=10` : "";
  const heroPhoto = chosenPhoto || cachedByAddr || autoPhoto;
  const isUsingStreetView = heroPhoto.startsWith("/api/google/streetview");
  const isUsingMap = heroPhoto.startsWith("/api/google/staticmap");

  const heroPhotoResolved = heroPhoto.startsWith("google_place:")
    ? `/api/google/place-photo?ref=${encodeURIComponent(heroPhoto.replace(/^google_place:/, ""))}&maxwidth=1600`
    : heroPhoto;

  const sharedPros = React.useMemo<Array<{ name: string; photoUrl?: string }>>(() => {
    if (item.id.startsWith("prop_demo_")) {
      return [
        { name: "Fernando Rocha Jr" },
        { name: "Oscar Toledo" },
        { name: "Jennifer Correa" },
        { name: "Mike Moulis" },
      ];
    }
    return [{ name: profile.fullName || "You", photoUrl: profile.photoDataUrl || "" }];
  }, [item.id, profile.fullName, profile.photoDataUrl]);

//

  return (
    <div className="grid gap-6">
      {/* Hero */}
      <Card className="overflow-visible">
        <div className="relative h-[340px] overflow-hidden rounded-t-[var(--hw-radius-lg)] bg-[linear-gradient(135deg,rgba(229,57,53,.18),rgba(17,24,39,.05))]">
          {/* Photo */}
          {heroPhotoResolved ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroPhotoResolved} alt="" className="absolute inset-0 h-full w-full rounded-t-[var(--hw-radius-lg)] object-cover object-[50%_40%]" />
          ) : null}

          {/* Brand tint overlay only when we don't have an image */}
          {!heroPhotoResolved ? (
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(229,57,53,.14),rgba(229,57,53,.04),rgba(0,0,0,0))]" />
          ) : null}

          {/* Top pills */}
          <div className="absolute left-5 top-5 flex flex-wrap items-center gap-2">
            <Chip>{item.sharedWithMe ? "Shared" : "My property"}</Chip>
            <Chip>Projects: {item.projectsCount || 0}</Chip>
          </div>

          {/* Top-right action */}
          <div className="absolute right-5 top-5">
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
          </div>
        </div>

        {/* Below-image header (keeps photo visible) */}
        <div className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="text-2xl font-extrabold tracking-tight text-[var(--hw-ink)] md:text-3xl">{shortTitle(item)}</div>
              {subAddress(item) ? <div className="mt-1 text-sm text-[var(--hw-muted)]">{subAddress(item)}</div> : null}
              <div className="mt-3 text-xs text-[var(--hw-muted)]">
                <span className="font-semibold text-[var(--hw-ink)]">Owner:</span> <span className="text-[var(--hw-ink)]">{item.ownerName || "—"}</span>
              </div>
            </div>

            <div className="shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={withDemo(`/pro/express-estimate?property=${encodeURIComponent(item.id)}`)}>
                  <Button>Start Instant Estimate</Button>
                </Link>
              </div>
            </div>
          </div>

          <Divider className="my-5" />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--hw-ink)]">Shared with pros</div>
              <div className="mt-1 text-sm text-[var(--hw-muted)]">
                {item.id.startsWith("prop_demo_") ? "Real estate pros connected to this homeowner (demo)." : "Real estate pros connected to this homeowner."}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {sharedPros.map((p) => {
                return (
                  <div key={p.name} className="group relative flex flex-col items-center gap-1">
                    <UserAvatar fullName={p.name} photoUrl={p.photoUrl || undefined} size={30} />

                    {/* Desktop label: initials (e.g. FRJ) */}
                    <div className="hidden max-w-[92px] truncate text-[11px] font-extrabold tracking-tight text-[var(--hw-muted)] sm:block">
                      {(p.name || "").
                        trim()
                        .split(/\s+/)
                        .filter(Boolean)
                        .slice(0, 3)
                        .map((x) => x[0] || "")
                        .join("")
                        .toUpperCase() || ""}
                    </div>

                    {/* Gentle hover tooltip (desktop) */}
                    <div className="pointer-events-none absolute -top-10 z-50 hidden whitespace-nowrap rounded-full border border-[var(--hw-line)] bg-white px-3 py-1 text-xs font-semibold text-[var(--hw-ink)] shadow-sm group-hover:block">
                      {p.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Active Services */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Active services</div>
            <div className="mt-1 text-sm text-[var(--hw-muted)]">Current work in progress for this address.</div>
          </div>
          <Button variant="secondary" onClick={() => setRequestOpen(true)}>
            Request service
          </Button>
        </div>
        <Divider className="my-5" />
        <EmptyState title="No active services" text="When you start a job, it will appear here with status and next steps." />
      </Card>

      {/* Record of Services */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Record of services</div>
            <div className="mt-1 text-sm text-[var(--hw-muted)]">A clean log of completed work for your client’s future disclosures.</div>
          </div>
        </div>

        <Divider className="my-5" />

        {item.id.startsWith("prop_demo_") ? (
          <div className="grid gap-4">
            <Card className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--hw-ink)]">House Repairs</div>
                  <div className="mt-1 text-sm text-[var(--hw-muted)]">
                    Status: <span className="font-semibold text-[var(--hw-red)]">Completed</span>
                  </div>
                </div>
                <Chip>Apr 30, 2024</Chip>
              </div>

              <Divider className="my-4" />

              <div className="grid gap-2 text-sm">
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span className="text-[var(--hw-muted)]">Home Guide:</span>
                  <span className="font-semibold text-[var(--hw-ink)]">Fernando Rocha Jr</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span className="text-[var(--hw-muted)]">Project Manager:</span>
                  <span className="font-semibold text-[var(--hw-ink)]">Frank Rocha</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span className="text-[var(--hw-muted)]">Service Item:</span>
                  <span className="font-semibold text-[var(--hw-ink)]">Restoration</span>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <EmptyState title="No service history yet" text="Once you request or complete services for this property, they’ll show up here." />
        )}
      </Card>

      {/* Request service modal */}
      <Modal open={requestOpen} onClose={() => setRequestOpen(false)} title="Request service" mobilePlacement="center">
        <AIWorkOrderIntakeCard
          eyebrow="Work order"
          title="What do you need help with?"
          prefillIssue={`Property: ${item.address}\n\n`}
          showServicingPill={true}
        />
      </Modal>

      {/* Google photo picker */}
      <Modal
        open={googleOpen}
        onClose={() => {
          setGoogleOpen(false);
          setGoogleErr("");
          setGooglePhotos([]);
          setEditOpen(true);
        }}
        title="Select property photo"
        mobilePlacement="center"
      >
        <div className="grid gap-4">
          {googleErr ? <div className="rounded-[var(--hw-radius-lg)] border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.06)] p-3 text-sm text-[var(--hw-ink)]">{googleErr}</div> : null}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={isUsingStreetView ? "ghost" : "secondary"}
              disabled={!item.address || isUsingStreetView}
              onClick={() => {
                const src = `/api/google/streetview?address=${encodeURIComponent(item.address)}&size=1200x675&fov=80&pitch=10`;
                setPhotoUrl(src);
                setGoogleOpen(false);
                setEditOpen(true);
              }}
            >
              Street View
            </Button>
            <Button
              size="sm"
              variant={isUsingMap ? "ghost" : "secondary"}
              disabled={!item.address || isUsingMap}
              onClick={() => {
                const src = `/api/google/staticmap?address=${encodeURIComponent(item.address)}&size=1200x540&scale=2&zoom=16`;
                setPhotoUrl(src);
                setGoogleOpen(false);
                setEditOpen(true);
              }}
            >
              Map
            </Button>
          </div>

          {googleLoading ? (
            <div className="text-sm text-[var(--hw-muted)]">Loading Google photos…</div>
          ) : googlePhotos.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {googlePhotos.map((p) => {
                const thumb = `/api/google/place-photo?ref=${encodeURIComponent(p.ref)}&maxwidth=600`;
                return (
                  <button
                    key={p.ref}
                    type="button"
                    className="group relative overflow-hidden rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-[var(--hw-soft)] text-left transition hover:shadow-[0_10px_24px_rgba(17,24,39,.10)]"
                    onClick={() => {
                      setPhotoUrl(`google_place:${p.ref}`);
                      setGoogleOpen(false);
                      setEditOpen(true);
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumb} alt="" className="h-[110px] w-full object-cover sm:h-[120px]" />
                    <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,.28))]" />
                    <div className="absolute bottom-2 right-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[var(--hw-ink)] opacity-0 transition group-hover:opacity-100">
                      Select
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit property">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label className="text-xs">Nickname</Label>
            <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="e.g., Home, Lake Condo" />
            <div className="text-xs text-[var(--hw-muted)]">This is a label for you—address stays the same.</div>
          </div>

          <div className="grid gap-2">
            <Label className="text-xs">Property photo</Label>

            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      const dataUrl = typeof reader.result === "string" ? reader.result : "";
                      if (!dataUrl) return;
                      setPhotoUrl(dataUrl);
                    };
                    reader.readAsDataURL(file);
                    e.currentTarget.value = "";
                  }}
                />
                <Button size="sm" variant="secondary">
                  Upload photo
                </Button>
              </label>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  // Close the edit modal first; otherwise both modals share z-index and the photo picker appears "behind" it.
                  setEditOpen(false);
                  // Next tick so the close animation commits before opening the picker.
                  window.setTimeout(() => setGoogleOpen(true), 20);

                  setGoogleErr("");
                  setGoogleLoading(true);
                  try {
                    const address = item.address;
                    const r = await fetch(`/api/google/places-photos?address=${encodeURIComponent(address)}&limit=6`);
                    const j = (await r.json()) as { ok?: boolean; photos?: Array<{ ref: string; width: number; height: number }>; error?: string };
                    if (!r.ok || !j?.ok) throw new Error(j?.error || "failed");
                    setGooglePhotos(Array.isArray(j.photos) ? j.photos : []);
                  } catch {
                    setGoogleErr("Couldn’t load Google photos for this address.");
                    setGooglePhotos([]);
                  } finally {
                    setGoogleLoading(false);
                  }
                }}
              >
                Choose from Google
              </Button>
              {photoUrl ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setPhotoUrl("");
                    if (addrKey) {
                      try {
                        window.localStorage.removeItem(addrKey);
                      } catch {}
                    }
                  }}
                >
                  Remove
                </Button>
              ) : null}
            </div>

            <div className="text-xs text-[var(--hw-muted)]">
              Recommended style: <span className="font-semibold text-[var(--hw-ink)]">16:9 landscape</span>.
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                try {
                  window.localStorage.setItem(`hw_prop_nickname_v1:${item.id}`, nickname);
                } catch {}
                setItem((p) => ({ ...p, nickname }));

                try {
                  if (photoUrl) window.localStorage.setItem(`hw_prop_photo_v1:${item.id}`, photoUrl);
                  else window.localStorage.removeItem(`hw_prop_photo_v1:${item.id}`);
                } catch {}

                // Also cache by normalized address (fast repeat loads across the portal).
                if (addrKey) {
                  try {
                    if (photoUrl) window.localStorage.setItem(addrKey, photoUrl);
                    else window.localStorage.removeItem(addrKey);
                  } catch {}
                }

                setEditOpen(false);
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
