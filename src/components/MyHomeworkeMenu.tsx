"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

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
      <Button variant="secondary" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open}>
        My Homeworke
      </Button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+10px)] w-[320px] overflow-hidden rounded-2xl border border-[rgba(229,57,53,.14)] bg-white shadow-[0_18px_60px_rgba(17,24,39,.14)]"
        >
          <div aria-hidden className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-[rgba(229,57,53,.10)] blur-[28px]" />

          <div className="relative px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--hw-muted)]">Sign in</div>
          <div className="relative grid pb-2">
            <MenuItem href="/login/homeowner" title="Homeowner" subtitle="Jobs, scheduling, and estimates" />
            <MenuItem href="/login/partner" title="Real Estate Pro" subtitle="Agent tools and client projects" />
            <MenuItem href="/login/provider" title="Service Provider" subtitle="Opportunities, bids, and messages" />
            <MenuItem href="/login/ops" title="Team / Ops" subtitle="Home Guides, PMs, and Admin" />
          </div>

          <div className="relative border-t border-[rgba(229,57,53,.10)]" />
          <div className="relative px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--hw-muted)]">Get started</div>
          <div className="relative grid pb-3">
            <MenuItem href="/login/homeowner" title="Create homeowner account" subtitle="Sign up with a magic link" />
            <MenuItem href="/request-access?role=partner&type=access" title="Real Estate Pro access" subtitle="Request access or schedule a demo" />
            <MenuItem href="/request-access?role=provider&type=apply" title="Become a provider" subtitle="Apply to join the network" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuItem(props: { href: string; title: string; subtitle: string }) {
  return (
    <Link
      role="menuitem"
      href={props.href}
      className="group grid gap-0.5 px-4 py-2.5 text-left transition hover:bg-[var(--hw-soft)]"
    >
      <div className="text-sm font-semibold text-[var(--hw-ink)]">{props.title}</div>
      <div className="text-xs text-[var(--hw-muted)] group-hover:text-[color-mix(in_srgb,var(--hw-muted)_80%,var(--hw-ink))]">
        {props.subtitle}
      </div>
    </Link>
  );
}
