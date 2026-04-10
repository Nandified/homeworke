"use client";

import * as React from "react";
import Link from "next/link";

import { Button, Container, Pill } from "@/components/ui";
import { UserAvatar, useStoredProfile } from "@/components/user-avatar";
import { isDemoMode, withDemo } from "@/lib/demo";

export type PortalNavItem = { href: string; label: string };

function NavIcon(props: { name: string; className?: string }) {
  const cn = props.className || "";
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": true as const,
    className: cn,
  };

  switch (props.name) {
    case "dashboard":
      return (
        <svg {...common}>
          <path d="M4 13h7V4H4v9ZM13 20h7V11h-7v9ZM4 20h7v-5H4v5ZM13 9h7V4h-7v5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case "bolt":
      return (
        <svg {...common}>
          <path d="M13 2 3 14h7l-1 8 12-14h-7l1-6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case "briefcase":
      return (
        <svg {...common}>
          <path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M4 7h16v13H4V7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M20 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "home":
      return (
        <svg {...common}>
          <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case "chat":
      return (
        <svg {...common}>
          <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.7 8.7 0 0 1-3.2-.6L3 21l1.6-6.3A8.7 8.7 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.5 8.5 0 0 1 21 11.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case "megaphone":
      return (
        <svg {...common}>
          <path d="M3 11v2a1 1 0 0 0 1 1h2l8 5V5l-8 5H4a1 1 0 0 0-1 1Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M16 10a4 4 0 0 1 0 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M19 8a7 7 0 0 1 0 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "help":
      return (
        <svg {...common}>
          <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M9.09 9a3 3 0 0 1 5.82 1c0 2-3 2-3 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="2" />
          <path
            d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.04.04a2.2 2.2 0 0 1-1.56 3.76h-.1a1.8 1.8 0 0 0-1.7 1.26 1.8 1.8 0 0 1-3.42 0 1.8 1.8 0 0 0-1.7-1.26H9.7a2.2 2.2 0 0 1-1.56-3.76l.04-.04A1.8 1.8 0 0 0 8.54 15a1.8 1.8 0 0 0-1.25-1.7 1.8 1.8 0 0 1 0-3.4 1.8 1.8 0 0 0 1.25-1.7 1.8 1.8 0 0 0-.36-1.98l-.04-.04A2.2 2.2 0 0 1 9.7 2.38h.1A1.8 1.8 0 0 0 11.5 1.1a1.8 1.8 0 0 1 3.42 0 1.8 1.8 0 0 0 1.7 1.26h.1a2.2 2.2 0 0 1 1.56 3.76l-.04.04A1.8 1.8 0 0 0 19.4 8c0 .78.5 1.47 1.25 1.7a1.8 1.8 0 0 1 0 3.4 1.8 1.8 0 0 0-1.25 1.7Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "collapse":
      return (
        <svg {...common}>
          <path d="M9 18 3 12l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M21 18V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "expand":
      return (
        <svg {...common}>
          <path d="M15 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 18V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
  }
}

function iconForHref(href: string) {
  const h = href.toLowerCase();
  if (h.includes("dashboard")) return "dashboard";
  if (h.includes("estimate") || h.includes("express")) return "bolt";
  if (h.includes("project") || h.includes("job") || h.includes("work")) return "briefcase";
  if (h.includes("customer") || h.includes("client") || h.includes("pros") || h.includes("providers")) return "users";
  if (h.includes("propert")) return "home";
  if (h.includes("message")) return "chat";
  if (h.includes("marketing")) return "megaphone";
  if (h.includes("help") || h.includes("support")) return "help";
  if (h.includes("account") || h.includes("settings")) return "settings";
  return "dashboard";
}

export function PortalShell(props: {
  role: string;
  /** Page title (shown as H1 unless hideHeading). */
  title: string;
  /** Optional portal title (shown in role popover + mobile drawer header). Defaults to `title`. */
  portalTitle?: string;
  nav: PortalNavItem[];
  /** Optional eyebrow label (defaults to "Portal") */
  eyebrow?: string;
  /** Optional description under the page title */
  description?: React.ReactNode;
  /** Optional single primary action for the page */
  primaryAction?: React.ReactNode;
  /** Hide the page heading block (Portal/Title/Description). Useful for dashboard-first mobile. */
  hideHeading?: boolean;
  children: React.ReactNode;
}) {
  const portalTitle = props.portalTitle ?? props.title;

  const profile = useStoredProfile();
  const baseRole = (props.role || "").toLowerCase();
  const basePath = baseRole === "pro" || baseRole === "pm" || baseRole === "sp" || baseRole === "hg" || baseRole === "ho" || baseRole === "partner" ? `/${baseRole}` : "";
  const accountHref = basePath ? `${basePath}/account` : "/";
  const supportHref = basePath ? `${basePath}/support` : "/";

  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [rolePopoverOpen, setRolePopoverOpen] = React.useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);

  const sidebarKey = "hw_sidebar_collapsed_v1";
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(sidebarKey);
      if (raw === "1") setSidebarCollapsed(true);
    } catch {}
  }, []);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(sidebarKey, sidebarCollapsed ? "1" : "0");
    } catch {}
  }, [sidebarCollapsed]);

  React.useEffect(() => {
    if (!rolePopoverOpen) return;
    const t = window.setTimeout(() => setRolePopoverOpen(false), 2000);
    return () => window.clearTimeout(t);
  }, [rolePopoverOpen]);

  React.useEffect(() => {
    if (!profileMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el) return;
      if (el.closest("[data-profile-menu-root]") == null) setProfileMenuOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [profileMenuOpen]);

  return (
    <div className="min-h-screen bg-[#fbfbfc]">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-[var(--hw-line)] bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <Container className="relative flex h-14 items-center md:h-16">
          {/* Left */}
          <div className="flex flex-1 items-center gap-2">
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

            <Link href={withDemo("/")} className="hidden md:block text-lg font-extrabold tracking-tight text-[var(--hw-red)] md:text-xl">
              Homeworke
            </Link>
          </div>

          {/* Center (mobile): centered logo */}
          <Link
            href={withDemo("/")}
            className="absolute left-1/2 -translate-x-1/2 md:hidden text-xl font-extrabold tracking-tight text-[var(--hw-red)]"
          >
            Homeworke
          </Link>

          {/* Right */}
          <div className="flex flex-1 items-center justify-end gap-2">
            {isDemoMode() ? <Pill className="bg-white">Demo</Pill> : null}

            {/* Role pill */}
            <div className="relative hidden sm:block">
              <button type="button" onClick={() => setRolePopoverOpen((v) => !v)} aria-label="Portal info">
                <Pill className="border-[rgba(229,57,53,.18)] bg-[linear-gradient(135deg,rgba(229,57,53,.10),rgba(229,57,53,.02))] text-[var(--hw-ink)]">
                  {props.role}
                </Pill>
              </button>

              {rolePopoverOpen ? (
                <div className="absolute right-0 top-[46px] z-30 w-64 rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-3 shadow-[0_20px_60px_rgba(0,0,0,.18)]">
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Portal</div>
                  <div className="mt-1 text-sm font-semibold text-[var(--hw-ink)]">{portalTitle}</div>
                </div>
              ) : null}
            </div>

            {/* Profile block */}
            <div className="relative" data-profile-menu-root>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-[var(--hw-line)] bg-white px-2.5 py-1.5 shadow-sm hover:bg-[var(--hw-soft)]"
                aria-label="Open profile menu"
              >
                <UserAvatar fullName={profile.fullName || "Your account"} photoUrl={profile.photoDataUrl} size={30} />
                <div className="hidden md:block text-left leading-tight">
                  <div className="text-sm font-semibold text-[var(--hw-ink)]">{profile.fullName || "Your account"}</div>
                  <div className="text-[11px] font-semibold text-[var(--hw-muted)]">{profile.company || ""}</div>
                </div>
                <svg className="hidden md:block" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {profileMenuOpen ? (
                <div className="absolute right-0 top-[54px] z-40 w-72 overflow-hidden rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white shadow-[0_20px_60px_rgba(0,0,0,.18)]">
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar fullName={profile.fullName || "Your account"} photoUrl={profile.photoDataUrl} size={40} />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-[var(--hw-ink)]">{profile.fullName || "Your account"}</div>
                        {profile.company ? (
                          <div className="truncate text-xs font-semibold text-[var(--hw-muted)]">{profile.company}</div>
                        ) : null}
                        <div className="mt-1 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">
                          <span>Role</span>
                          <span className="rounded-full bg-[var(--hw-soft)] px-2 py-0.5 text-[10px] text-[var(--hw-ink)]">{props.role}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="h-px bg-[var(--hw-line)]" />
                  <nav className="p-2">
                    <Link
                      href={withDemo(accountHref)}
                      onClick={() => setProfileMenuOpen(false)}
                      className="block rounded-[var(--hw-radius-sm)] px-3 py-2 text-sm font-semibold text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]"
                    >
                      Profile & Settings
                    </Link>
                    <Link
                      href={withDemo(supportHref)}
                      onClick={() => setProfileMenuOpen(false)}
                      className="block rounded-[var(--hw-radius-sm)] px-3 py-2 text-sm font-semibold text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]"
                    >
                      Support
                    </Link>
                  </nav>
                </div>
              ) : null}
            </div>
          </div>
        </Container>
      </header>

      {/* Mobile nav drawer */}
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[86%] max-w-sm bg-white shadow-[0_20px_60px_rgba(0,0,0,.25)]">
            <div className="flex items-center justify-between border-b border-[var(--hw-line)] px-5 py-4">
              <div>
                <div className="text-base font-extrabold tracking-tight text-[var(--hw-red)]">Homeworke</div>
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Portal</div>
                <div className="mt-0.5 text-sm font-semibold text-[var(--hw-ink)]">{portalTitle}</div>
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
                        "flex items-center gap-3 rounded-[var(--hw-radius-sm)] px-3 py-3 text-sm font-semibold transition-colors " +
                        (active ? "bg-[rgba(229,57,53,.08)] text-[var(--hw-red)]" : "text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]")
                      }
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--hw-soft)]">
                        <NavIcon name={iconForHref(n.href)} className={active ? "text-[var(--hw-red)]" : "text-[var(--hw-muted)]"} />
                      </span>
                      <span>{n.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex">
        {/* Desktop sidebar */}
        <aside
          className={
            "hidden md:flex md:sticky md:top-16 md:h-[calc(100vh-64px)] shrink-0 flex-col border-r border-[var(--hw-line)] bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 transition-[width] duration-200 " +
            (sidebarCollapsed ? "w-[72px]" : "w-60")
          }
        >
          <div className="flex-1 p-3">
            <div className={"mb-3 flex items-center gap-2 " + (sidebarCollapsed ? "justify-center" : "justify-between")}
            >
              <div className={"flex items-center gap-2 " + (sidebarCollapsed ? "hidden" : "")}
              >
                <div className="text-xs font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Portal</div>
                <div className="text-xs font-semibold text-[var(--hw-ink)]">{portalTitle}</div>
              </div>
              <button
                type="button"
                onClick={() => setSidebarCollapsed((v) => !v)}
                className="grid h-9 w-9 place-items-center rounded-full border border-[var(--hw-line)] bg-white shadow-sm hover:bg-[var(--hw-soft)]"
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={sidebarCollapsed ? "Expand" : "Collapse"}
              >
                <NavIcon name={sidebarCollapsed ? "expand" : "collapse"} className="text-[var(--hw-muted)]" />
              </button>
            </div>

            {props.primaryAction ? (
              <div className="mb-3">
                <div className={sidebarCollapsed ? "grid place-items-center" : ""}>{props.primaryAction}</div>
              </div>
            ) : null}

            <nav className="mt-2 grid gap-1">
              {props.nav.map((n) => {
                const active = typeof window !== "undefined" && window.location.pathname === n.href;
                const iconName = iconForHref(n.href);
                return (
                  <Link
                    key={n.href}
                    href={withDemo(n.href)}
                    className={
                      "group flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-semibold transition-colors " +
                      (active ? "bg-[rgba(229,57,53,.10)] text-[var(--hw-red)]" : "text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]") +
                      (sidebarCollapsed ? " justify-center" : "")
                    }
                    title={sidebarCollapsed ? n.label : undefined}
                  >
                    <span
                      className={
                        "grid h-9 w-9 place-items-center rounded-[12px] border border-transparent transition-colors " +
                        (active ? "bg-white" : "bg-white/60 group-hover:bg-white")
                      }
                    >
                      <NavIcon name={iconName} className={active ? "text-[var(--hw-red)]" : "text-[var(--hw-muted)]"} />
                    </span>
                    {sidebarCollapsed ? null : <span className="truncate">{n.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-3">
            {isDemoMode() ? (
              <div className={"rounded-[14px] border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.06)] p-3 " + (sidebarCollapsed ? "hidden" : "")}
              >
                <div className="text-xs font-semibold text-[var(--hw-ink)]">Demo mode</div>
                <div className="mt-1 text-xs text-[var(--hw-muted)]">Sample data is enabled for this portal.</div>
              </div>
            ) : null}
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1">
          <Container className="py-8 md:py-10">
            {props.hideHeading ? null : (
              <div className="grid grid-cols-[1fr_auto] items-start gap-4">
                <div className="max-w-2xl">
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">{props.eyebrow || "Portal"}</div>
                  <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-[var(--hw-ink)] md:text-3xl">{props.title}</h1>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--hw-muted)]">
                    {props.description || ""}
                  </p>
                </div>
                {props.primaryAction ? <div className="shrink-0 md:hidden">{props.primaryAction}</div> : null}
              </div>
            )}

            <div className={(props.hideHeading ? "" : "mt-8") + " min-w-0"}>{props.children}</div>
          </Container>
        </main>
      </div>
    </div>
  );
}
