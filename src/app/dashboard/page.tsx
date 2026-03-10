import Link from "next/link";
import Image from "next/image";

import { Button, Card, Container, Pill } from "@/components/ui";

const lanes = [
  {
    key: "homeowner",
    title: "Homeowner Dashboard",
    note: "Request service, track appointments, review estimates, and see updates.",
    href: "/dashboard/homeowner",
  },
  {
    key: "partner",
    title: "Partner / Real Estate Pro Dashboard",
    note: "Client status, sharing preferences, and CRM signals.",
    href: "/dashboard/partner",
  },
  {
    key: "provider",
    title: "Service Provider Dashboard",
    note: "Offers, availability, active jobs, and check-ins.",
    href: "/dashboard/provider",
  },
  {
    key: "hg",
    title: "Home Guide (Ops) Dashboard",
    note: "Intake queue, triage, assignments, and exceptions.",
    href: "/dashboard/hg",
  },
  {
    key: "pm",
    title: "Project Manager Dashboard",
    note: "Today’s visits, on-the-way updates, and verification steps.",
    href: "/dashboard/pm",
  },
  {
    key: "admin",
    title: "Admin Dashboard",
    note: "Company-wide visibility: users, pros, providers, money, ops.",
    href: "/dashboard/admin",
  },
];

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <header className="sticky top-0 z-20 border-b border-[var(--hw-line)] bg-white/80 backdrop-blur">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-8 w-36">
              <Image
                src="/brand/Homeworke - Logo Main W Slogan (Black & Red).png"
                alt="Homeworke"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            <Link href="/marketplace">
              <Button variant="ghost">Marketplace</Button>
            </Link>
            <Link href="/real-estate-pros">
              <Button variant="ghost">Real Estate Pros</Button>
            </Link>
            <Link href="/integrations">
              <Button variant="ghost">Integrations</Button>
            </Link>
          </nav>
        </Container>
      </header>

      <main>
        <Container className="py-10">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Dashboards</div>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Choose your dashboard</h1>
              <div className="mt-2 max-w-3xl text-sm leading-7 text-[var(--hw-muted)]">
                Each user type gets a focused view. For now these are scaffolds so we can connect flows and keep shipping.
              </div>
            </div>
            <Pill>v1 scaffold</Pill>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {lanes.map((l) => (
              <Card key={l.key} className="p-6">
                <div className="text-sm font-semibold">{l.title}</div>
                <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">{l.note}</div>
                <div className="mt-4">
                  <Link href={l.href}>
                    <Button>Open</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </main>

      <footer className="border-t border-[var(--hw-line)] bg-white">
        <Container className="flex flex-col gap-3 py-10 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-[var(--hw-muted)]">Homeworke · Making Homeownership Easy</div>
          <div className="flex flex-wrap gap-2">
            <Link href="/privacy">
              <Button variant="ghost">Privacy</Button>
            </Link>
            <Link href="/terms">
              <Button variant="ghost">Terms</Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost">Contact</Button>
            </Link>
          </div>
        </Container>
      </footer>
    </div>
  );
}
