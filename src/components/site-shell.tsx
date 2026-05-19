import Link from "next/link";
import Image from "next/image";
import type { MouseEventHandler } from "react";

import { Button, Container } from "@/components/ui";
import { MyHomeworkeMenu } from "@/components/MyHomeworkeMenu";

type EstimateClickHandler = MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>;

export function SiteHeader({ ctaHref = "/estimate", ctaOnClick }: { ctaHref?: string; ctaOnClick?: EstimateClickHandler }) {
  return (
    <header className="sticky top-0 z-[160] border-b border-[var(--hw-line)] bg-white/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="block w-[132px] shrink-0" aria-label="Homeworke home">
          <Image
            src="/brand/homeworke-logo.png"
            alt="Homeworke"
            width={248}
            height={80}
            priority
            className="h-auto w-full"
          />
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
          <MyHomeworkeMenu />
          {ctaOnClick ? (
            <Button className="hidden sm:inline-flex" onClick={(event) => ctaOnClick(event)}>
              Request an estimate
            </Button>
          ) : (
            <Link href={ctaHref} className="hidden sm:block">
              <Button>Request an estimate</Button>
            </Link>
          )}
        </div>
      </Container>
    </header>
  );
}

export function SiteFooter({
  estimateHref = "/#instant-estimate-upload",
  estimateOnClick,
}: {
  estimateHref?: string;
  estimateOnClick?: EstimateClickHandler;
}) {
  return (
    <footer className="border-t border-[var(--hw-line)] bg-white">
      <Container className="py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Homeworke</div>
            <div className="mt-2 text-sm text-[var(--hw-muted)]">Home services, handled end-to-end</div>
            <div className="mt-4">
              {estimateOnClick ? (
                <Button onClick={(event) => estimateOnClick(event)}>Get an Instant Estimate</Button>
              ) : (
                <Link href={estimateHref}>
                  <Button>Get an Instant Estimate</Button>
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-1 md:gap-1">
            <Link href="/services" className="text-sm text-[var(--hw-muted)] hover:text-[var(--hw-ink)]">Services</Link>
            <Link href="/how-it-works" className="text-sm text-[var(--hw-muted)] hover:text-[var(--hw-ink)]">How it works</Link>
            <Link href="/chicago" className="text-sm text-[var(--hw-muted)] hover:text-[var(--hw-ink)]">Chicago</Link>
            <Link href="/contact" className="text-sm text-[var(--hw-muted)] hover:text-[var(--hw-ink)]">Contact</Link>
            <Link href="/privacy" className="text-sm text-[var(--hw-muted)] hover:text-[var(--hw-ink)]">Privacy</Link>
            <Link href="/terms" className="text-sm text-[var(--hw-muted)] hover:text-[var(--hw-ink)]">Terms</Link>
            <div className="col-span-2 mt-2 text-xs font-semibold uppercase tracking-wider text-[var(--hw-muted)] md:col-span-1 md:mt-3">Portals</div>
            <Link href="/login/homeowner" className="text-sm text-[var(--hw-muted)] hover:text-[var(--hw-ink)]">Homeowner sign in</Link>
            <Link href="/login/partner" className="text-sm text-[var(--hw-muted)] hover:text-[var(--hw-ink)]">Real Estate Pro sign in</Link>
            <Link href="/login/provider" className="text-sm text-[var(--hw-muted)] hover:text-[var(--hw-ink)]">Service Provider sign in</Link>
          </div>
        </div>

        <div className="mt-8 text-xs text-[var(--hw-muted)]">© {new Date().getFullYear()} Homeworke. All rights reserved.</div>
      </Container>
    </footer>
  );
}
