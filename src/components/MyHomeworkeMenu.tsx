"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui";

export function MyHomeworkeMenu() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (wrapRef.current && wrapRef.current.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <Button
        variant="secondary"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="h-10 rounded-full px-3 text-sm sm:h-11 sm:px-4"
      >
        My Homeworke
      </Button>

      {!open ? null : (
        <>
          {/* Mobile backdrop */}
          <div className="fixed inset-0 z-[70] bg-black/25 sm:hidden" aria-hidden onClick={() => setOpen(false)} />

          <div
            role="menu"
            className="fixed inset-x-0 bottom-0 z-[80] max-h-[85dvh] overflow-auto rounded-t-3xl border border-[rgba(229,57,53,.14)] bg-white shadow-[0_-18px_60px_rgba(17,24,39,.18)] sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-[calc(100%+10px)] sm:max-h-[calc(100dvh-88px)] sm:w-[340px] sm:rounded-2xl sm:shadow-[0_18px_60px_rgba(17,24,39,.14)]"
          >
            {/* Mobile sheet header */}
            <div className="sticky top-0 z-10 bg-white/90 px-4 pb-2 pt-3 backdrop-blur sm:hidden">
              <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-[var(--hw-line)]" />
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-[var(--hw-ink)]">My Homeworke</div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-[var(--hw-line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--hw-ink)]"
                >
                  Close
                </button>
              </div>
            </div>

            <div aria-hidden className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-[rgba(229,57,53,.10)] blur-[28px]" />

            <div className="relative px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--hw-muted)]">
              Sign in
            </div>
            <div className="relative grid pb-2">
              <MenuItem href="/login/homeowner" title="Homeowner" subtitle="Jobs, scheduling, and estimates" />
              <MenuItem href="/login/partner" title="Real Estate Pro" subtitle="Agent tools and client projects" />
              <MenuItem href="/login/provider" title="Service Provider" subtitle="Opportunities, bids, and messages" />
              <MenuItem href="/login/ops" title="Team / Ops" subtitle="Home Guides, PMs, and Admin" />
            </div>

            <div className="relative border-t border-[rgba(229,57,53,.10)]" />
            <div className="relative px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--hw-muted)]">
              Get started
            </div>
            <div className="relative grid pb-5">
              <MenuItem href="/login/homeowner" title="Create homeowner account" subtitle="Get started in under a minute" />
              <MenuItem href="/request-access?role=partner&type=access" title="Real Estate Pro access" subtitle="Request access or schedule a demo" />
              <MenuItem href="/request-access?role=provider&type=apply" title="Become a provider" subtitle="Apply to join the network" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem(props: { href: string; title: string; subtitle: string }) {
  return (
    <Link
      role="menuitem"
      href={props.href}
      className="group grid gap-0.5 px-4 py-3 text-left transition hover:bg-[var(--hw-soft)]"
    >
      <div className="text-sm font-semibold text-[var(--hw-ink)]">{props.title}</div>
      <div className="text-xs text-[var(--hw-muted)] group-hover:text-[color-mix(in_srgb,var(--hw-muted)_80%,var(--hw-ink))]">
        {props.subtitle}
      </div>
    </Link>
  );
}
