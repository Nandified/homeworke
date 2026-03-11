import Link from "next/link";

import { Button, Card, Container, Pill } from "@/components/ui";
import { isDemoMode, withDemo } from "@/lib/demo";

export type PortalNavItem = { href: string; label: string };

export function PortalShell(props: {
  role: string;
  title: string;
  nav: PortalNavItem[];
  /** Optional eyebrow label (defaults to "Portal") */
  eyebrow?: string;
  /** Optional description under the page title */
  description?: string;
  /** Optional single primary action for the page */
  primaryAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b border-[var(--hw-line)] bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <Container className="flex h-14 items-center justify-between md:h-16">
          <Link
            href="/"
            className="text-sm font-extrabold tracking-tight text-[var(--hw-ink)]"
          >
            Homeworke
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-3 md:flex">
            {isDemoMode() ? <Pill className="bg-white">Demo</Pill> : null}
            <Link href={withDemo("/portal")}>
              <Button variant="ghost">Portals</Button>
            </Link>
            <Pill>{props.role}</Pill>
          </nav>

          {/* Mobile nav — compact row */}
          <div className="flex items-center gap-2 md:hidden">
            {isDemoMode() ? <Pill>Demo</Pill> : null}
            <Pill>{props.role}</Pill>
            <Link href={withDemo("/portal")}>
              <Button variant="ghost">Portals</Button>
            </Link>
          </div>
        </Container>
      </header>

      <main>
        <Container className="py-8 md:py-12">
          {/* ── Page heading ── */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
                {props.eyebrow || "Portal"}
              </span>
              <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-[var(--hw-ink)] md:text-3xl">
                {props.title}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[var(--hw-muted)]">
                {props.description || "v1 build: navigation and information architecture first. Data wiring next."}
              </p>
            </div>
            {props.primaryAction ? <div className="shrink-0">{props.primaryAction}</div> : null}
          </div>

          {/* ── Layout: sidebar + content ── */}
          {isDemoMode() ? (
            <div className="mb-6 rounded-[var(--hw-radius-lg)] border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.06)] p-4 text-sm text-[var(--hw-ink)]">
              <span className="font-semibold">Demo mode:</span> sample data is enabled for all portals.
            </div>
          ) : null}

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
            {/* Sidebar — horizontal scroll on mobile, vertical on desktop */}
            <aside className="lg:col-span-3">
              <Card className="p-5">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
                  Navigation
                </span>

                {/* Mobile: horizontal pill-style row */}
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
                  {props.nav.map((n) => (
                    <Link
                      key={n.href}
                      href={withDemo(n.href)}
                      className="shrink-0 rounded-full border border-[var(--hw-line)] px-4 py-2 text-sm font-semibold text-[var(--hw-ink)] transition-colors hover:bg-[var(--hw-soft)]"
                    >
                      {n.label}
                    </Link>
                  ))}
                </div>

                {/* Desktop: vertical stack */}
                <nav className="mt-3 hidden flex-col gap-0.5 lg:flex">
                  {props.nav.map((n) => (
                    <Link
                      key={n.href}
                      href={withDemo(n.href)}
                      className="rounded-[var(--hw-radius-sm)] px-3 py-2.5 text-sm font-semibold text-[var(--hw-ink)] transition-colors hover:bg-[var(--hw-soft)]"
                    >
                      {n.label}
                    </Link>
                  ))}
                </nav>
              </Card>
            </aside>

            {/* Main content area */}
            <section className="min-w-0 lg:col-span-9">
              {props.children}
            </section>
          </div>
        </Container>
      </main>
    </div>
  );
}
