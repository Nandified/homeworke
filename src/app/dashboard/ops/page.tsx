import Link from "next/link";
import { Button, Card, Container, Pill } from "@/components/ui";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <Container className="py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Dashboard</div>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Ops (Home Guide / PM)</h1>
            <div className="mt-2 max-w-3xl text-sm leading-7 text-[var(--hw-muted)]">
              v1 scaffold. Next we’ll build the intake queue, assignments, and exception alerts.
            </div>
          </div>
          <Pill>HG / PM</Pill>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
            <div className="text-sm font-semibold">Active appointments</div>
            <div className="mt-2 text-sm text-[var(--hw-muted)]">Soon: live list with delays, no-shows, and escalations.</div>
            <div className="mt-4">
              <Link href="/appointments/demo">
                <Button>View example</Button>
              </Link>
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-sm font-semibold">Event stream</div>
            <div className="mt-2 text-sm text-[var(--hw-muted)]">Ingest + integrations spec for downstream automation.</div>
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
