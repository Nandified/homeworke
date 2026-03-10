import Link from "next/link";
import Image from "next/image";

import { Button, Container } from "@/components/ui";

export function SiteHeader({ ctaHref = "/estimate" }: { ctaHref?: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--hw-line)] bg-white/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-8 w-40">
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
      <Container className="flex flex-col gap-3 py-10 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-[var(--hw-muted)]">Homeworke · Chicago-first home services</div>
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
  );
}
