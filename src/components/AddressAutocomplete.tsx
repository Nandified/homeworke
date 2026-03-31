"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui";

type Prediction = { id: string; label: string };

export function AddressAutocomplete(props: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Defaults to US. */
  country?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [preds, setPreds] = React.useState<Prediction[]>([]);

  const wrapRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const el = wrapRef.current;
      if (!el) return;
      if (el.contains(e.target as Node)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  React.useEffect(() => {
    const q = (props.value || "").trim();
    if (!q || q.length < 3) {
      setPreds([]);
      setOpen(false);
      return;
    }

    let cancelled = false;
    const t = window.setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/google/places-autocomplete?country=${encodeURIComponent(props.country || "us")}&input=${encodeURIComponent(q)}`);
        const j = (await r.json()) as { ok?: boolean; predictions?: Prediction[] };
        if (cancelled) return;
        const next = (j.ok && Array.isArray(j.predictions) ? j.predictions : []).slice(0, 6);
        setPreds(next);
        setOpen(next.length > 0);
      } catch {
        if (cancelled) return;
        setPreds([]);
        setOpen(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [props.value, props.country]);

  return (
    <div ref={wrapRef} className="relative">
      <Input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        className={props.className}
        disabled={props.disabled}
        autoComplete="street-address"
        onFocus={() => {
          if (preds.length) setOpen(true);
        }}
      />

      {open ? (
        <div className="absolute z-[60] mt-2 w-full overflow-hidden rounded-[var(--hw-radius-lg)] border border-[rgba(229,57,53,.18)] bg-white shadow-[0_14px_40px_rgba(17,24,39,.12)]">
          {loading ? <div className="px-3 py-2 text-xs text-[var(--hw-muted)]">Searching…</div> : null}
          {preds.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                props.onChange(p.label);
                setOpen(false);
              }}
              className={cn("w-full px-3 py-2 text-left text-sm text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]")}
            >
              {p.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
