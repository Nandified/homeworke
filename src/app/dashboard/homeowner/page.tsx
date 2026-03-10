import Link from "next/link";
import { Button, Card, Container, Pill } from "@/components/ui";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <Container className="py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Dashboard</div>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Homeowner</h1>
            <div className="mt-2 max-w-3xl text-sm leading-7 text-[var(--hw-muted)]">
              v1 scaffold. Next we’ll wire this to real work orders, estimates, and appointment timeline.
            </div>
          </div>
          <Pill>HO</Pill>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
            <div className="text-sm font-semibold">Active appointment</div>
            <div className="mt-2 text-sm text-[var(--hw-muted)]">Example: live timeline experience.</div>
            <div className="mt-4">
              <Link href="/appointments/demo">
                <Button>View appointment</Button>
              </Link>
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-sm font-semibold">Get service</div>
            <div className="mt-2 text-sm text-[var(--hw-muted)]">Browse the marketplace and request service.</div>
            <div className="mt-4">
              <Link href="/marketplace">
                <Button variant="ghost">Open marketplace</Button>
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
