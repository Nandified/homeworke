"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui";

type Prediction = { id: string; label: string; rawLabel: string };

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

  const sessionTokenRef = React.useRef<string>(typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()));

  const [bias, setBias] = React.useState<{ lat: number; lon: number; radius: number } | null>(null);

  // Load cached location bias (best effort). Falls back to Chicago if none.
  React.useEffect(() => {
    const CHI = { lat: 41.8781, lon: -87.6298, radius: 35000 };

    async function run() {
      try {
        const raw = window.localStorage.getItem("hw_location_v1") || "";
        if (raw) {
          const j = JSON.parse(raw) as { zip?: string; lat?: number | string; lon?: number | string };
          const lat = Number(j?.lat);
          const lon = Number(j?.lon);
          if (Number.isFinite(lat) && Number.isFinite(lon)) {
            setBias({ lat, lon, radius: 35000 });
            return;
          }

          const zip = String(j?.zip || "").slice(0, 5);
          if (/^\d{5}$/.test(zip)) {
            const r = await fetch(`/api/geo/zip?zip=${encodeURIComponent(zip)}`);
            const jj = (await r.json()) as { ok?: boolean; lat?: string | number; lon?: string | number };
            const lat2 = Number(jj?.lat);
            const lon2 = Number(jj?.lon);
            if (jj?.ok && Number.isFinite(lat2) && Number.isFinite(lon2)) {
              setBias({ lat: lat2, lon: lon2, radius: 35000 });
              try {
                window.localStorage.setItem("hw_location_v1", JSON.stringify({ ...j, lat: lat2, lon: lon2 }));
              } catch {}
              return;
            }
          }
        }
      } catch {}

      setBias(CHI);
    }

    run();
  }, []);

  React.useEffect(() => {
    const q = (props.value || "").trim();
    if (!q || q.length < 2) {
      setPreds([]);
      setOpen(false);
      return;
    }

    let cancelled = false;
    const t = window.setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("country", props.country || "us");
        params.set("input", q);
        params.set("sessiontoken", sessionTokenRef.current);
        if (bias) {
          params.set("lat", String(bias.lat));
          params.set("lon", String(bias.lon));
          params.set("radius", String(bias.radius));
        }

        const r = await fetch(`/api/google/places-autocomplete?${params.toString()}`);
        const j = (await r.json()) as { ok?: boolean; predictions?: Prediction[] };
        if (cancelled) return;
        const next = (j.ok && Array.isArray(j.predictions) ? j.predictions : []).slice(0, 6).map((p) => {
          const raw = p.label;
          const cleaned = raw.replace(/,\s*USA\s*$/i, "");
          return { ...p, rawLabel: raw, label: cleaned };
        });
        setPreds(next);
        setOpen(next.length > 0);
      } catch {
        if (cancelled) return;
        setPreds([]);
        setOpen(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 90);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [props.value, props.country, bias]);

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
              onClick={async () => {
                // Fetch details so we can include ZIP and drop country.
                try {
                  const params = new URLSearchParams();
                  params.set("placeId", p.id);
                  params.set("sessiontoken", sessionTokenRef.current);
                  const r = await fetch(`/api/google/place-details?${params.toString()}`);
                  const j = (await r.json()) as { ok?: boolean; formatted?: string };
                  props.onChange((j.ok && j.formatted) ? j.formatted : p.label);
                } catch {
                  props.onChange(p.label);
                }
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
