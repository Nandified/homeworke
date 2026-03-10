import Link from "next/link";
import { Button, Card, Container, Pill } from "@/components/ui";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <Container className="py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Dashboard</div>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Admin</h1>
            <div className="mt-2 max-w-3xl text-sm leading-7 text-[var(--hw-muted)]">
              Checklist-based scaffold. Next we’ll add company-wide visibility across users, pros, providers, revenue, and
              ops queues.
            </div>
          </div>
          <Pill>ADM</Pill>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="p-6">
            <div className="text-sm font-semibold">Users</div>
            <div className="mt-2 text-sm text-[var(--hw-muted)]">Homeowners, pros, providers.</div>
            <div className="mt-4">
              <Button variant="ghost" disabled>
                View
              </Button>
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-sm font-semibold">Ops visibility</div>
            <div className="mt-2 text-sm text-[var(--hw-muted)]">Queues, assignments, exceptions.</div>
            <div className="mt-4">
              <Link href="/dashboard/hg">
                <Button variant="ghost">Go to HG</Button>
              </Link>
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-sm font-semibold">Integrations</div>
            <div className="mt-2 text-sm text-[var(--hw-muted)]">Event stream + CRM placeholders.</div>
            <div className="mt-4">
              <Link href="/integrations">
                <Button variant="ghost">Open</Button>
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
