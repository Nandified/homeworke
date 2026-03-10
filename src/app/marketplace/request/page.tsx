"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button, Card, Chip, Container, Input, Pill, RadioCardGroup, Textarea } from "@/components/ui";
import homepage from "@/content/homepage_v1_opus.json";

function classifyIssue(text: string) {
  const t = text.toLowerCase();
  if (t.includes("leak") || t.includes("pipe") || t.includes("toilet") || t.includes("faucet")) return "Plumbing";
  if (t.includes("no power") || t.includes("outlet") || t.includes("breaker") || t.includes("electrical")) return "Electrical";
  if (t.includes("ac") || t.includes("heat") || t.includes("hvac") || t.includes("furnace")) return "HVAC";
  if (t.includes("roof") || t.includes("shingle")) return "Roofing";
  if (t.includes("paint") || t.includes("drywall")) return "Drywall/Paint";
  return "General";
}

export default function Page() {
  const [issue, setIssue] = useState("");
  const [details, setDetails] = useState("");
  const [quick, setQuick] = useState(homepage.quickSelect.options[0]);
  const suggested = useMemo(() => (issue.trim() ? classifyIssue(issue) : null), [issue]);

  const selectedService = suggested || quick;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <Container className="py-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Open marketplace</div>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Request service</h1>
            <div className="mt-2 max-w-3xl text-sm leading-7 text-[var(--hw-muted)]">
              Describe the problem or select a service. We’ll suggest a small set of vetted providers.
            </div>
          </div>
          <Pill>Capture happens at scheduling</Pill>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <div className="text-sm font-semibold">{homepage.hero.chatLabel}</div>
            <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">{homepage.hero.chatHelper}</div>

            <div className="mt-4">
              <Input
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                placeholder={homepage.hero.chatPlaceholder}
                aria-label="Describe your issue"
              />
              <div className="mt-3">
                <Textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Optional: timing, photos you have, anything urgent."
                  aria-label="Additional details"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Chip>Suggests service: {suggested || "—"}</Chip>
              <Chip>Selected: {selectedService}</Chip>
            </div>

            <div className="mt-6">
              <Link
                href={{
                  pathname: "/marketplace/providers",
                  query: { service: selectedService, issue: issue.trim() || undefined },
                }}
              >
                <Button>See providers</Button>
              </Link>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-sm font-semibold">{homepage.quickSelect.label}</div>
            <div className="mt-4">
              <RadioCardGroup
                name="service"
                value={quick}
                onChange={setQuick}
                options={homepage.quickSelect.options.map((o) => ({ value: o, title: o }))}
              />
            </div>
          </Card>
        </div>

        <div className="mt-6 text-sm text-[var(--hw-muted)]">
          <Link href="/">Back home</Link>
        </div>
      </Container>
    </div>
  );
}
