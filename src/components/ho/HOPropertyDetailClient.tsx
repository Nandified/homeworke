"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AIWorkOrderIntakeCard } from "@/components/ai/AIWorkOrderIntakeCard";
import { Button, Card, Chip, Divider, EmptyState, Input, Label, Modal } from "@/components/ui";

export type HOPropertyDetail = {
  id: string;
  createdAt: string;
  address: string;
  nickname?: string | null;
  propertyType?: string | null;
  projectsCount?: number | null;
};

const STORAGE_KEYS = {
  customProps: "hw_props_custom_v1__HO",
  photoPrefix: "hw_prop_photo_v1__HO:",
  addrPhotoPrefix: "hw_addr_photo_v1__HO:",
  nicknamePrefix: "hw_prop_nickname_v1__HO:",
} as const;

function shortTitle(p: HOPropertyDetail) {
  return (p.nickname || p.address || "Property").trim();
}

function subAddress(p: HOPropertyDetail) {
  if (!p.nickname) return "";
  return (p.address || "").trim();
}

function normalizeAddressKey(s: string) {
  return (s || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function HOPropertyDetailClient(props: { property: HOPropertyDetail; openEdit?: boolean }) {
  const router = useRouter();
  const [item, setItem] = React.useState<HOPropertyDetail>(props.property);
  const [editOpen, setEditOpen] = React.useState(!!props.openEdit);
  const [nickname, setNickname] = React.useState(props.property.nickname || "");
  const [photoUrl, setPhotoUrl] = React.useState("");
  const [requestOpen, setRequestOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteText, setDeleteText] = React.useState("");

  const addrKey = item.address ? `${STORAGE_KEYS.addrPhotoPrefix}${normalizeAddressKey(item.address)}` : "";
  const deleteArmed = deleteText.trim().toUpperCase() === "DELETE";

  React.useLayoutEffect(() => {
    try {
      const byId = window.localStorage.getItem(`${STORAGE_KEYS.photoPrefix}${props.property.id}`) || "";
      const byAddress = props.property.address ? window.localStorage.getItem(`${STORAGE_KEYS.addrPhotoPrefix}${normalizeAddressKey(props.property.address)}`) || "" : "";
      setPhotoUrl(byId || byAddress);
    } catch {}
  }, [props.property.address, props.property.id]);

  React.useLayoutEffect(() => {
    try {
      const override = window.localStorage.getItem(`${STORAGE_KEYS.nicknamePrefix}${item.id}`) || "";
      if (override && override !== item.nickname) {
        setItem((p) => ({ ...p, nickname: override }));
        setNickname(override);
      }
    } catch {}
  }, [item.id, item.nickname]);

  const autoPhoto = !photoUrl && item.address ? `/api/google/streetview?address=${encodeURIComponent(item.address)}&size=1200x675&fov=80&pitch=10` : "";
  const heroPhoto = photoUrl || autoPhoto;

  return (
    <div className="grid gap-6">
      <Card className="overflow-visible">
        <div className="relative h-[340px] overflow-hidden rounded-t-[var(--hw-radius-lg)] bg-[linear-gradient(135deg,rgba(229,57,53,.18),rgba(17,24,39,.05))]">
          {heroPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroPhoto} alt="" className="absolute inset-0 h-full w-full rounded-t-[var(--hw-radius-lg)] object-cover object-[50%_40%]" />
          ) : null}
          {!heroPhoto ? <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(229,57,53,.14),rgba(229,57,53,.04),rgba(0,0,0,0))]" /> : null}

          <div className="absolute left-5 top-5 flex flex-wrap items-center gap-2">
            <Chip>My property</Chip>
            {item.propertyType ? <Chip>{item.propertyType}</Chip> : null}
            <Chip>Projects: {item.projectsCount || 0}</Chip>
          </div>

          <div className="absolute right-5 top-5">
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="text-2xl font-extrabold tracking-tight text-[var(--hw-ink)] md:text-3xl">{shortTitle(item)}</div>
              {subAddress(item) ? <div className="mt-1 text-sm text-[var(--hw-muted)]">{subAddress(item)}</div> : null}
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <Chip>Saved as: My property</Chip>
                {item.propertyType ? <Chip>Type: {item.propertyType}</Chip> : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/ho/express-estimate?property=${encodeURIComponent(item.id)}`}>
                <Button>Start Instant Estimate</Button>
              </Link>
              <Button variant="secondary" onClick={() => setRequestOpen(true)}>
                Request service
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Active jobs</div>
            <div className="mt-1 text-sm text-[var(--hw-muted)]">Open service work, scheduling, and project progress for this address.</div>
          </div>
          <Link href={`/ho/support?property=${encodeURIComponent(item.id)}`}>
            <Button variant="secondary">Report an issue</Button>
          </Link>
        </div>
        <Divider className="my-5" />
        <EmptyState title="No active jobs" text="When work starts for this property, it will appear here with status and next steps." />
      </Card>

      <Card className="p-6">
        <div>
          <div className="text-sm font-semibold text-[var(--hw-ink)]">Property record</div>
          <div className="mt-1 text-sm text-[var(--hw-muted)]">Completed services and documents will build a clean home history over time.</div>
        </div>
        <Divider className="my-5" />
        <EmptyState title="No service history yet" text="Completed Homeworke services for this property will show here." />
      </Card>

      <Modal open={requestOpen} onClose={() => setRequestOpen(false)} title="Request service" mobilePlacement="center">
        <AIWorkOrderIntakeCard eyebrow="Work Order" title="What do you need help with?" prefillIssue={`Property: ${item.address}\n\n`} showServicingPill={true} />
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete property" mobilePlacement="center">
        <div className="grid gap-4">
          <div className="rounded-[var(--hw-radius-lg)] border border-[rgba(229,57,53,.22)] bg-[rgba(229,57,53,.06)] p-4 text-sm text-[var(--hw-ink)]">
            <div className="font-extrabold text-[var(--hw-red)]">Warning: This can’t be undone.</div>
            <div className="mt-2 text-[var(--hw-muted)]">
              You’re about to delete <span className="font-semibold text-[var(--hw-ink)]">{shortTitle(item)}</span> from your saved properties.
            </div>
          </div>
          <div className="grid gap-2">
            <Label className="text-xs">Type DELETE to confirm</Label>
            <Input value={deleteText} onChange={(e) => setDeleteText(e.target.value)} placeholder="DELETE" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!deleteArmed}
              onClick={() => {
                const current = readJson<Array<{ id?: string }>>(STORAGE_KEYS.customProps, []);
                writeJson(
                  STORAGE_KEYS.customProps,
                  current.filter((p) => String(p?.id || "") !== String(item.id)),
                );
                try {
                  window.localStorage.removeItem(`${STORAGE_KEYS.nicknamePrefix}${item.id}`);
                  window.localStorage.removeItem(`${STORAGE_KEYS.photoPrefix}${item.id}`);
                  if (addrKey) window.localStorage.removeItem(addrKey);
                } catch {}
                router.push("/ho/properties");
              }}
            >
              Permanently delete
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit property">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label className="text-xs">Nickname</Label>
            <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="e.g., Home, Lake Condo" />
            <div className="text-xs text-[var(--hw-muted)]">This is a private label for your saved property.</div>
          </div>

          <div className="grid gap-2">
            <Label className="text-xs">Property photo</Label>
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
                    if (dataUrl) setPhotoUrl(dataUrl);
                  };
                  reader.readAsDataURL(file);
                  e.currentTarget.value = "";
                }}
              />
              <Button size="sm" variant="secondary">
                Upload photo
              </Button>
            </label>
            {photoUrl ? (
              <Button size="sm" variant="ghost" onClick={() => setPhotoUrl("")}>
                Remove photo
              </Button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              variant="ghost"
              className="text-[var(--hw-red)]"
              onClick={() => {
                setEditOpen(false);
                setDeleteText("");
                window.setTimeout(() => setDeleteOpen(true), 20);
              }}
            >
              Delete property
            </Button>

            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const nextNickname = nickname.trim();
                  setItem((p) => ({ ...p, nickname: nextNickname || null }));
                  try {
                    window.localStorage.setItem(`${STORAGE_KEYS.nicknamePrefix}${item.id}`, nextNickname);
                    if (photoUrl) window.localStorage.setItem(`${STORAGE_KEYS.photoPrefix}${item.id}`, photoUrl);
                    else window.localStorage.removeItem(`${STORAGE_KEYS.photoPrefix}${item.id}`);
                    if (addrKey) {
                      if (photoUrl) window.localStorage.setItem(addrKey, photoUrl);
                      else window.localStorage.removeItem(addrKey);
                    }
                  } catch {}

                  const current = readJson<Array<{ id?: string; nickname?: string }>>(STORAGE_KEYS.customProps, []);
                  const updated = current.map((p) => (String(p?.id || "") === String(item.id) ? { ...p, nickname: nextNickname || undefined } : p));
                  writeJson(STORAGE_KEYS.customProps, updated);
                  setEditOpen(false);
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
