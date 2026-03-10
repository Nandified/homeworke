import Link from "next/link";

import { Button, Card, Container, Pill } from "@/components/ui";

export type PortalNavItem = { href: string; label: string };

export function PortalShell(props: {
  role: string;
  title: string;
  nav: PortalNavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <header className="sticky top-0 z-20 border-b border-[var(--hw-line)] bg-white/80 backdrop-blur">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" className="text-sm font-extrabold tracking-tight text-[var(--hw-ink)]">
            Homeworke
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            <Link href="/portal">
              <Button variant="ghost">Portals</Button>
            </Link>
            <Pill>{props.role}</Pill>
          </nav>
        </Container>
      </header>

      <main>
        <Container className="py-10">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Portal</div>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{props.title}</h1>
              <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">
                v1 build: navigation and information architecture first. Data wiring next.
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
            <Card className="p-4 lg:col-span-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">Navigation</div>
              <div className="mt-3 grid gap-1">
                {props.nav.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    className="rounded-[var(--hw-radius-sm)] px-3 py-2 text-sm font-semibold text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]"
                  >
                    {n.label}
                  </Link>
                ))}
              </div>
            </Card>

            <div className="lg:col-span-9">{props.children}</div>
          </div>
        </Container>
      </main>
    </div>
  );
}
