"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

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
  /** Hide the page heading block (Portal/Title/Description). Useful for dashboard-first mobile. */
  hideHeading?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [rolePopoverOpen, setRolePopoverOpen] = React.useState(false);

  const fullPath = React.useMemo(() => {
    const qs = searchParams?.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }, [pathname, searchParams]);

  const returnTo = searchParams?.get("returnTo") || "";

  const stackKey = "hw_portal_nav_stack_v1";

  const [backTarget, setBackTarget] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // 1) Prefer explicit returnTo
    if (returnTo && returnTo.startsWith("/")) {
      setBackTarget(returnTo);
      return;
    }

    // 2) Maintain an in-session stack so every portal page can go back.
    try {
      const raw = window.sessionStorage.getItem(stackKey);
      const stack = (raw ? (JSON.parse(raw) as string[]) : []).filter((p) => typeof p === "string" && p.startsWith("/"));
      const top = stack[stack.length - 1];
      if (top !== fullPath) stack.push(fullPath);

      // Cap to avoid unbounded growth.
      const capped = stack.slice(-25);
      window.sessionStorage.setItem(stackKey, JSON.stringify(capped));

      const prev = capped.length >= 2 ? capped[capped.length - 2] : null;
      setBackTarget(prev);
    } catch {
      setBackTarget(null);
    }
  }, [fullPath, returnTo]);

  React.useEffect(() => {
    if (!rolePopoverOpen) return;
    const t = window.setTimeout(() => setRolePopoverOpen(false), 2000);
    return () => window.clearTimeout(t);
  }, [rolePopoverOpen]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b border-[var(--hw-line)] bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <Container className="relative flex h-14 items-center md:h-16">
          {/* Left */}
          <div className="flex flex-1 items-center gap-2">
            {backTarget ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  // If explicit returnTo exists, follow it. Otherwise pop stack.
                  if (returnTo && returnTo.startsWith("/")) {
                    router.push(withDemo(returnTo));
                    return;
                  }

                  try {
                    const raw = window.sessionStorage.getItem(stackKey);
                    const stack = (raw ? (JSON.parse(raw) as string[]) : []).filter((p) => typeof p === "string" && p.startsWith("/"));
                    // Remove current page (top)
                    if (stack[stack.length - 1] === fullPath) stack.pop();
                    const prev = stack.pop();
                    window.sessionStorage.setItem(stackKey, JSON.stringify(stack));
                    if (prev) router.push(withDemo(prev));
                    else router.push(withDemo(props.nav?.[0]?.href || "/"));
                  } catch {
                    router.back();
                  }
                }}
                className="hidden md:inline-flex"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            ) : null}

            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--hw-line)] bg-white px-3 py-2 text-sm font-semibold text-[var(--hw-ink)] shadow-sm md:hidden"
              aria-label="Open menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>Menu</span>
            </button>

            {/* Mobile back button (only when available) */}
            {backTarget ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  if (returnTo && returnTo.startsWith("/")) {
                    router.push(withDemo(returnTo));
                    return;
                  }
                  try {
                    const raw = window.sessionStorage.getItem(stackKey);
                    const stack = (raw ? (JSON.parse(raw) as string[]) : []).filter((p) => typeof p === "string" && p.startsWith("/"));
                    if (stack[stack.length - 1] === fullPath) stack.pop();
                    const prev = stack.pop();
                    window.sessionStorage.setItem(stackKey, JSON.stringify(stack));
                    if (prev) router.push(withDemo(prev));
                    else router.back();
                  } catch {
                    router.back();
                  }
                }}
                className="md:hidden"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            ) : null}

            {/* Desktop logo (left-aligned) */}
            <Link href="/" className="hidden md:block text-lg font-extrabold tracking-tight text-[var(--hw-red)] md:text-xl">
              Homeworke
            </Link>
          </div>

          {/* Center (mobile): centered logo */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 md:hidden text-xl font-extrabold tracking-tight text-[var(--hw-red)]"
          >
            Homeworke
          </Link>

          {/* Right */}
          <div className="flex flex-1 items-center justify-end gap-2">
            {isDemoMode() ? <Pill className="bg-white">Demo</Pill> : null}

            <div className="relative">
              <button type="button" onClick={() => setRolePopoverOpen((v) => !v)} aria-label="Portal info">
                <Pill
                  className={
                    "border-[rgba(229,57,53,.18)] bg-[linear-gradient(135deg,rgba(229,57,53,.10),rgba(229,57,53,.02))] text-[var(--hw-ink)]"
                  }
                >
                  {props.role}
                </Pill>
              </button>

              {rolePopoverOpen ? (
                <div className="absolute right-0 top-[46px] z-30 w-56 rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-3 shadow-[0_20px_60px_rgba(0,0,0,.18)]">
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Portal</div>
                  <div className="mt-1 text-sm font-semibold text-[var(--hw-ink)]">{props.title}</div>
                </div>
              ) : null}
            </div>
          </div>
        </Container>
      </header>

      {/* Mobile nav drawer */}
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[86%] max-w-sm bg-white shadow-[0_20px_60px_rgba(0,0,0,.25)]">
            <div className="flex items-center justify-between border-b border-[var(--hw-line)] px-5 py-4">
              <div>
                <div className="text-base font-extrabold tracking-tight text-[var(--hw-red)]">Homeworke</div>
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Portal</div>
                <div className="mt-0.5 text-sm font-semibold text-[var(--hw-ink)]">{props.title}</div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setMobileNavOpen(false)}>
                Close
              </Button>
            </div>

            <div className="p-5">
              {props.primaryAction ? <div className="mb-4">{props.primaryAction}</div> : null}

              <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Navigation</div>
              <nav className="mt-3 grid gap-1">
                {props.nav.map((n) => {
                  const active = typeof window !== "undefined" && window.location.pathname === n.href;
                  return (
                    <Link
                      key={n.href}
                      href={withDemo(n.href)}
                      onClick={() => setMobileNavOpen(false)}
                      className={
                        "rounded-[var(--hw-radius-sm)] px-3 py-3 text-sm font-semibold transition-colors " +
                        (active
                          ? "bg-[rgba(229,57,53,.08)] text-[var(--hw-red)]"
                          : "text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]")
                      }
                    >
                      {n.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      ) : null}

      <main>
        <Container className="py-8 md:py-12">
          {/* ── Page heading ── */}
          {props.hideHeading ? null : (
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
              {props.primaryAction ? <div className="shrink-0 hidden md:block">{props.primaryAction}</div> : null}
            </div>
          )}

          {/* ── Layout: sidebar + content ── */}
          {isDemoMode() ? (
            <div className="mb-6 rounded-[var(--hw-radius-lg)] border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.06)] p-4 text-sm text-[var(--hw-ink)]">
              <span className="font-semibold">Demo mode:</span> sample data is enabled for all portals.
            </div>
          ) : null}

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
            {/* Sidebar (desktop only) */}
            <aside className="hidden lg:block lg:col-span-3">
              <Card className="p-5">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Navigation</span>
                <nav className="mt-3 flex flex-col gap-0.5">
                  {props.nav.map((n) => {
                    const active = typeof window !== "undefined" && window.location.pathname === n.href;
                    return (
                      <Link
                        key={n.href}
                        href={withDemo(n.href)}
                        className={
                          "rounded-[var(--hw-radius-sm)] px-3 py-2.5 text-sm font-semibold transition-colors " +
                          (active
                            ? "bg-[rgba(229,57,53,.08)] text-[var(--hw-red)]"
                            : "text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]")
                        }
                      >
                        {n.label}
                      </Link>
                    );
                  })}
                </nav>
              </Card>
            </aside>

            {/* Main content area */}
            <section className="min-w-0 lg:col-span-9">{props.children}</section>
          </div>
        </Container>
      </main>
    </div>
  );
}
