"use client";

import { useState } from "react";

import {
  Button,
  Card,
  Checkbox,
  Chip,
  Container,
  Divider,
  EmptyState,
  Input,
  Label,
  Modal,
  Pill,
  RadioCardGroup,
  StatTile,
  Textarea,
  Toast,
} from "@/components/ui";

export default function Page() {
  const [modalOpen, setModalOpen] = useState(false);
  const [radio, setRadio] = useState("open_marketplace");

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <Container className="py-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Styleguide</div>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Homeworke UI Kit</h1>
            <div className="mt-2 max-w-3xl text-sm leading-7 text-[var(--hw-muted)]">
              Phase 1 deliverable: tokens + reusable components. No product features.
            </div>
          </div>
          <Pill>Primary: #E53935</Pill>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <StatTile label="Primary" value="#E53935" note="Use for decisive actions only." />
          <StatTile label="Radius" value="18px" note="Cards and primary surfaces." />
          <StatTile label="Shadow" value="Soft" note="0 10px 30px rgba(17,24,39,.08)" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <div className="text-sm font-semibold">Buttons</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button disabled>Disabled</Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-sm font-semibold">Chips and pills</div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Pill>Trust-first marketplace</Pill>
              <Chip>Licensed and insured</Chip>
              <Chip>Identity gated</Chip>
            </div>
          </Card>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <div className="text-sm font-semibold">Form controls</div>
            <div className="mt-4 grid gap-3">
              <div>
                <Label>Service</Label>
                <div className="mt-2">
                  <Input placeholder="What do you need help with?" />
                </div>
              </div>
              <div>
                <Label>Details</Label>
                <div className="mt-2">
                  <Textarea placeholder="Tell us the basics. Keep it short." />
                </div>
              </div>
              <Checkbox label="I agree to terms (placeholder)" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-sm font-semibold">Choice group (radio cards)</div>
            <div className="mt-4">
              <RadioCardGroup
                name="funnel"
                value={radio}
                onChange={setRadio}
                options={[
                  {
                    value: "partner_origin",
                    title: "Partner-origin funnel",
                    text: "Homeowner arrives via partner link. Sharing defaults on with per-request control.",
                  },
                  {
                    value: "open_marketplace",
                    title: "Open marketplace",
                    text: "Browse and schedule first. Capture email/phone at confirmation via magic link.",
                  },
                ]}
              />
            </div>
          </Card>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <div className="text-sm font-semibold">Empty state</div>
            <div className="mt-4">
              <EmptyState
                title="No active work orders"
                text="When this is wired up, homeowners will see requests, appointments, and estimates here."
                action={<Button variant="secondary">Create request</Button>}
              />
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-sm font-semibold">Modal and toast shells</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setModalOpen(true)}>
                Open modal
              </Button>
            </div>

            <Divider className="my-5" />

            <div className="grid gap-2">
              <Toast title="Saved" text="Toast shell (no provider yet)." />
            </div>
          </Card>
        </div>

        <Modal open={modalOpen} title="Example modal" onClose={() => setModalOpen(false)}>
          <div className="text-sm leading-7 text-[var(--hw-muted)]">
            Modal shell only in Phase 1. We’ll add focus trap, ESC close, and portal behavior in a later phase.
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => setModalOpen(false)}>Done</Button>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </Modal>
      </Container>
    </div>
  );
}
