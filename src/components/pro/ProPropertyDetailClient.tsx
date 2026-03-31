"use client";

import * as React from "react";
import Link from "next/link";

import { UserAvatar } from "@/components/user-avatar";
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

export function ProPropertyDetailClient(props: { property: ProPropertyDetail; openEdit?: boolean }) {
  const [item, setItem] = React.useState<ProPropertyDetail>(props.property);
  const [editOpen, setEditOpen] = React.useState(!!props.openEdit);
  const [nickname, setNickname] = React.useState(props.property.nickname || "");
  const [photoUrl, setPhotoUrl] = React.useState("");

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

  return (
    <div className="grid gap-6">
      {/* Hero */}
      <Card className="overflow-hidden">
        <div className="relative h-[260px] overflow-hidden bg-[linear-gradient(135deg,rgba(229,57,53,.18),rgba(17,24,39,.05))]">
          {/* Photo (UI-only via localStorage until Google Places is wired) */}
          {(() => {
            let photo = "";
            try {
              photo = window.localStorage.getItem(`hw_prop_photo_v1:${item.id}`) || "";
            } catch {}
            if (!photo && item.id === "prop_demo_6") photo = "/demo_prop_demo_6.jpg";
            return photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : null;
          })()}

          {/* Brand tint overlay (keep red-led, avoid muddy brown) */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(229,57,53,.14),rgba(229,57,53,.04),rgba(0,0,0,0))]" />

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
                  <Button>Start Express Estimate</Button>
                </Link>
                <Link href={withDemo(`/pro/jobs?property=${encodeURIComponent(item.id)}`)}>
                  <Button variant="secondary">View jobs</Button>
                </Link>
              </div>
            </div>
          </div>

          <Divider className="my-5" />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--hw-ink)]">Shared with</div>
              <div className="mt-1 text-sm text-[var(--hw-muted)]">People who can see project activity for this property (demo).</div>
            </div>
            <div className="flex items-center gap-2">
              <UserAvatar fullName="Fernando Rocha Jr" size={30} />
              <UserAvatar fullName="Oscar Toledo" size={30} />
              <UserAvatar fullName="Jennifer Correa" size={30} />
              <UserAvatar fullName="Mike Moulis" size={30} />
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
          <Button variant="secondary">Request service</Button>
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
      </Card>

      {/* Google photo picker */}
      <Modal
        open={googleOpen}
        onClose={() => {
          setGoogleOpen(false);
          setGoogleErr("");
          setGooglePhotos([]);
        }}
        title="Select property photo"
        mobilePlacement="center"
      >
        <div className="grid gap-4">
          {googleErr ? <div className="rounded-[var(--hw-radius-lg)] border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.06)] p-3 text-sm text-[var(--hw-ink)]">{googleErr}</div> : null}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={!item.address}
              onClick={() => {
                const src = `/api/google/streetview?address=${encodeURIComponent(item.address)}&size=1200x675&fov=80&pitch=0`;
                setPhotoUrl(src);
                setGoogleOpen(false);
              }}
            >
              Use Street View
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={!item.address}
              onClick={() => {
                const src = `/api/google/staticmap?address=${encodeURIComponent(item.address)}&size=1200x540&scale=2&zoom=16`;
                setPhotoUrl(src);
                setGoogleOpen(false);
              }}
            >
              Use Map
            </Button>
          </div>

          {googleLoading ? (
            <div className="text-sm text-[var(--hw-muted)]">Loading Google photos…</div>
          ) : googlePhotos.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {googlePhotos.map((p) => {
                const thumb = `/api/google/place-photo?ref=${encodeURIComponent(p.ref)}&maxwidth=600`;
                const full = `/api/google/place-photo?ref=${encodeURIComponent(p.ref)}&maxwidth=1200`;
                return (
                  <button
                    key={p.ref}
                    type="button"
                    className="group relative overflow-hidden rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-[var(--hw-soft)] text-left transition hover:shadow-[0_10px_24px_rgba(17,24,39,.10)]"
                    onClick={() => {
                      setPhotoUrl(full);
                      setGoogleOpen(false);
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
          ) : (
            <div className="text-sm text-[var(--hw-muted)]">No Google photo gallery found for this address. You can still use Street View.</div>
          )}
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
                  setGoogleOpen(true);
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
                <Button size="sm" variant="ghost" onClick={() => setPhotoUrl("")}
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
