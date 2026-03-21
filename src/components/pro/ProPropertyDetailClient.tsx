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

  // Apply local override (UI-only) without flashing.
  React.useLayoutEffect(() => {
    try {
      const override = window.localStorage.getItem(`hw_prop_nickname_v1:${item.id}`) || "";
      if (override && override !== item.nickname) {
        setItem((p) => ({ ...p, nickname: override }));
        setNickname(override);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  return (
    <div className="grid gap-6">
      {/* Hero */}
      <Card className="overflow-hidden">
        <div className="relative h-[220px] bg-[linear-gradient(135deg,rgba(229,57,53,.18),rgba(17,24,39,.05))]">
          <div className="absolute left-5 top-5 flex flex-wrap items-center gap-2">
            <Chip>{item.sharedWithMe ? "Shared" : "My property"}</Chip>
            <Chip>Projects: {item.projectsCount || 0}</Chip>
          </div>
          <div className="absolute right-5 top-5">
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
          </div>

          <div className="absolute bottom-5 left-5 right-5">
            <div className="text-2xl font-extrabold tracking-tight text-[var(--hw-ink)] md:text-3xl">{shortTitle(item)}</div>
            {subAddress(item) ? <div className="mt-1 text-sm text-[var(--hw-muted)]">{subAddress(item)}</div> : null}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link href={withDemo(`/pro/express-estimate?property=${encodeURIComponent(item.id)}`)}>
                <Button>Start Express Estimate</Button>
              </Link>
              <Link href={withDemo(`/pro/jobs?property=${encodeURIComponent(item.id)}`)}>
                <Button variant="secondary">View jobs</Button>
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--hw-muted)]">
              <span className="font-semibold text-[var(--hw-ink)]">Owner:</span>
              <span>{item.ownerName || "—"}</span>
            </div>
          </div>
        </div>

        <div className="p-6">
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

      {/* Edit modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit property">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label className="text-xs">Nickname</Label>
            <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="e.g., Home, Lake Condo" />
            <div className="text-xs text-[var(--hw-muted)]">This is a label for you—address stays the same.</div>
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
