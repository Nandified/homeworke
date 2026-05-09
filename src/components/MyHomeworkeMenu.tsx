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
          className="absolute right-0 top-[calc(100%+10px)] w-[280px] overflow-hidden rounded-2xl border border-[var(--hw-line)] bg-white shadow-[0_16px_50px_rgba(17,24,39,.14)]"
        >
          <div className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--hw-muted)]">Sign in</div>
          <div className="grid">
            <MenuLink href="/login/homeowner">Homeowner</MenuLink>
            <MenuLink href="/login/partner">Real Estate Pro</MenuLink>
            <MenuLink href="/login/provider">Service Provider</MenuLink>
            <MenuLink href="/login/ops">Team / Ops</MenuLink>
          </div>

          <div className="mt-1 border-t border-[var(--hw-line)]" />
          <div className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--hw-muted)]">Create account</div>
          <div className="grid">
            <MenuLink href="/login/homeowner">Homeowner (free)</MenuLink>
            <MenuLink href="/request-access?role=partner&type=access">Real Estate Pro (request access)</MenuLink>
            <MenuLink href="/request-access?role=provider&type=apply">Service Provider (apply)</MenuLink>
          </div>

          <div className="p-4 pt-3 text-xs leading-relaxed text-[var(--hw-muted)]">
            Partner and Provider access is reviewed before approval.
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuLink(props: { href: string; children: React.ReactNode }) {
  return (
    <Link
      role="menuitem"
      href={props.href}
      className="px-4 py-2.5 text-sm font-medium text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]"
    >
      {props.children}
    </Link>
  );
}
