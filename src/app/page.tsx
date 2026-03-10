import Link from "next/link";

import { Button, Card, Container, Pill } from "@/components/ui";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <Container className="py-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Homeworke</div>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Homeworke 3.0</h1>
            <div className="mt-2 max-w-3xl text-sm leading-7 text-[var(--hw-muted)]">
              App rebuild from the approved Source of Truth. Start by selecting a portal (2.0 parity).
            </div>
          </div>
          <Pill>Rebuild</Pill>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <div className="text-sm font-semibold">Portals</div>
            <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">
              Homeowner, Real Estate Pro, Service Provider, Home Guide.
            </div>
            <div className="mt-4">
              <Link href="/portal">
                <Button>Open portal selector</Button>
              </Link>
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-sm font-semibold">Spec</div>
            <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">
              Canonical: <code>HOMEWORKE_3.0_SOURCE_OF_TRUTH.md</code>
            </div>
          </Card>
        </div>
      </Container>
    </div>
  );
}
