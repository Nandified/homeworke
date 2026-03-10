import Link from "next/link";

import { Button, Card, Container, Pill } from "@/components/ui";

const portals = [
  {
    key: "homeowner",
    title: "Homeowner",
    note: "Dashboard, messages, properties, pro team, support, account.",
    href: "/ho/dashboard",
  },
  {
    key: "pro",
    title: "Real Estate Pro",
    note: "Dashboard, estimates, clients, properties, messages, support, account.",
    href: "/pro/dashboard",
  },
  {
    key: "sp",
    title: "Service Provider",
    note: "Find work, messages, quarters, bids, support, account.",
    href: "/sp/find-work",
  },
  {
    key: "hg",
    title: "Home Guide",
    note: "Dashboard, projects, estimates, messages, directories, help desk, account.",
    href: "/hg/dashboard",
  },
];

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <Container className="py-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">App</div>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Choose your portal</h1>
            <div className="mt-2 max-w-3xl text-sm leading-7 text-[var(--hw-muted)]">
              This mirrors Homeworke 2.0 portal structure. We will wire data and RBAC next.
            </div>
          </div>
          <Pill>Rebuild v1</Pill>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {portals.map((p) => (
            <Card key={p.key} className="p-6">
              <div className="text-sm font-semibold">{p.title}</div>
              <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">{p.note}</div>
              <div className="mt-4">
                <Link href={p.href}>
                  <Button variant="secondary">Open</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </div>
  );
}
