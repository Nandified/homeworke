"use client";

import Link from "next/link";
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
  Pill,
  RadioCardGroup,
  StatTile,
  Textarea,
  Toast,
} from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { SiteFooter, SiteHeader } from "@/components/site-shell";

export default function UiKitPage() {
  const [mode, setMode] = useState("quick");

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <SiteHeader />
      <main>
        <Container className="py-12">
          <PageHeader
            eyebrow="Internal"
            title="UI Kit"
            subtitle="Design system building blocks for Homeworke. If it looks right here, it’ll look right everywhere."
            pill="Phase 1"
            secondaryAction={{ label: "Back home", href: "/" }}
            primaryAction={{ label: "View dashboards", href: "/partner/dashboard" }}
          />

          <Divider className="my-10" />

          <section className="grid gap-6">
            <h2 className="text-sm font-semibold text-[var(--hw-ink)]">Buttons</h2>
            <div className="flex flex-wrap gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
          </section>

          <Divider className="my-10" />

          <section className="grid gap-6">
            <h2 className="text-sm font-semibold text-[var(--hw-ink)]">Pills / Chips</h2>
            <div className="flex flex-wrap gap-2">
              <Pill>Chicago-first</Pill>
              <Pill>Free estimates</Pill>
              <Chip>Draft</Chip>
              <Chip>Published</Chip>
            </div>
          </section>

          <Divider className="my-10" />

          <section className="grid gap-6">
            <h2 className="text-sm font-semibold text-[var(--hw-ink)]">Cards + Stats</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <StatTile label="Work orders" value="12" note="Across shared clients" />
              <StatTile label="Unread messages" value="3" note="Across threads" />
              <StatTile label="SLA alerts" value="1" note="Needs attention" />
            </div>
            <Card className="p-6">
              <div className="text-sm font-semibold text-[var(--hw-ink)]">Example card</div>
              <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">
                Rounded corners, soft shadow, calm neutrals, and one clear primary action.
              </div>
              <div className="mt-4 flex gap-2">
                <Button>Primary action</Button>
                <Button variant="secondary">Secondary</Button>
              </div>
            </Card>
          </section>

          <Divider className="my-10" />

          <section className="grid gap-6">
            <h2 className="text-sm font-semibold text-[var(--hw-ink)]">Forms</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-6">
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" placeholder="you@company.com" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" placeholder="Add context..." />
                  </div>
                  <Checkbox label="I agree to the terms" />
                  <div className="flex gap-2">
                    <Button>Save</Button>
                    <Button variant="secondary">Cancel</Button>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="text-sm font-semibold text-[var(--hw-ink)]">Radio card group</div>
                <div className="mt-3">
                  <RadioCardGroup
                    name="mode"
                    value={mode}
                    onChange={setMode}
                    options={[
                      { value: "quick", title: "Quick intake", text: "Frictionless, finish later." },
                      { value: "verified", title: "Verified", text: "Collect license + compliance." },
                    ]}
                  />
                </div>
              </Card>
            </div>
          </section>

          <Divider className="my-10" />

          <section className="grid gap-6">
            <h2 className="text-sm font-semibold text-[var(--hw-ink)]">Empty states + Toast</h2>
            <EmptyState
              title="Nothing here yet"
              text="Empty states should explain what happens next and provide a single clear CTA."
              action={
                <Link href="/services">
                  <Button>Browse services</Button>
                </Link>
              }
            />
            <div className="max-w-sm">
              <Toast title="Saved" text="Your changes were saved." />
            </div>
          </section>

          {/* Modal preview removed for now (keep /ui client-safe). */}
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
