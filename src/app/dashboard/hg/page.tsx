import Link from "next/link";
import { Button, Card, Container, Pill } from "@/components/ui";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <Container className="py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Dashboard</div>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Home Guide (Ops)</h1>
            <div className="mt-2 max-w-3xl text-sm leading-7 text-[var(--hw-muted)]">
              Checklist-based scaffold. Next we’ll implement the intake queue, triage actions, and assignment tools with an
              audit trail.
            </div>
          </div>
          <Pill>HG</Pill>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
            <div className="text-sm font-semibold">Intake queue (next)</div>
            <div className="mt-2 text-sm text-[var(--hw-muted)]">New requests, triage status, assignment to PM/provider.</div>
            <div className="mt-4">
              <Link href="/appointments/demo">
                <Button>View live example</Button>
              </Link>
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-sm font-semibold">Event stream</div>
            <div className="mt-2 text-sm text-[var(--hw-muted)]">Ingest + integrations spec for automation.</div>
            <div className="mt-4">
              <Link href="/integrations">
                <Button variant="ghost">View</Button>
              </Link>
            </div>
          </Card>
        </div>

        <div className="mt-6">
          <Link href="/dashboard">
            <Button variant="ghost">Back to dashboards</Button>
          </Link>
        </div>
      </Container>
    </div>
  );
}
