import Link from "next/link";

import { Button, Card, Container, Pill } from "@/components/ui";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <Container className="py-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Rebuild</div>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Homeworke 3.0</h1>
            <div className="mt-2 max-w-3xl text-sm leading-7 text-[var(--hw-muted)]">
              Spec locked. Phase shipping only. Nothing is final until implemented against the approved Source of Truth.
            </div>
          </div>
          <Pill>Phase 1 in progress</Pill>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <div className="text-sm font-semibold">Source of Truth</div>
            <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">
              See <code>HOMEWORKE_3.0_SOURCE_OF_TRUTH.md</code> in the repo root.
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-sm font-semibold">UI Kit</div>
            <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">
              Phase 1 deliverable: tokens + reusable components.
            </div>
            <div className="mt-4">
              <Link href="/ui">
                <Button variant="secondary">Open styleguide</Button>
              </Link>
            </div>
          </Card>
        </div>

        <div className="mt-4">
          <Card className="p-6">
            <div className="text-sm font-semibold">Archive</div>
            <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">
              Previous work preserved under <code>archive/v0/</code>.
            </div>
          </Card>
        </div>
      </Container>
    </div>
  );
}
