import Link from "next/link";

import { Button, Container } from "@/components/ui";

export function SiteHeader({ ctaHref = "/estimate" }: { ctaHref?: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--hw-line)] bg-white/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="text-sm font-extrabold tracking-tight text-[var(--hw-ink)]">
          Homeworke
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          <Link href="/services">
            <Button variant="ghost">Services</Button>
          </Link>
          <Link href="/how-it-works">
            <Button variant="ghost">How it works</Button>
          </Link>
          <Link href="/chicago">
            <Button variant="ghost">Chicago</Button>
          </Link>
          <Link href="/contact">
            <Button variant="ghost">Contact</Button>
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href={ctaHref}>
            <Button>Get an Instant Estimate</Button>
          </Link>
        </div>
      </Container>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--hw-line)] bg-white">
      <Container className="py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Homeworke</div>
            <div className="mt-2 text-sm text-[var(--hw-muted)]">Chicago-first home services</div>
            <div className="mt-4">
              <Link href="/estimate">
                <Button>Get an Instant Estimate</Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-1 md:gap-1">
            <Link href="/services" className="text-sm text-[var(--hw-muted)] hover:text-[var(--hw-ink)]">Services</Link>
            <Link href="/how-it-works" className="text-sm text-[var(--hw-muted)] hover:text-[var(--hw-ink)]">How it works</Link>
            <Link href="/chicago" className="text-sm text-[var(--hw-muted)] hover:text-[var(--hw-ink)]">Chicago</Link>
            <Link href="/contact" className="text-sm text-[var(--hw-muted)] hover:text-[var(--hw-ink)]">Contact</Link>
            <Link href="/privacy" className="text-sm text-[var(--hw-muted)] hover:text-[var(--hw-ink)]">Privacy</Link>
            <Link href="/terms" className="text-sm text-[var(--hw-muted)] hover:text-[var(--hw-ink)]">Terms</Link>
          </div>
        </div>

        <div className="mt-8 text-xs text-[var(--hw-muted)]">© {new Date().getFullYear()} Homeworke. All rights reserved.</div>
      </Container>
    </footer>
  );
}
