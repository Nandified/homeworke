"use client";

import { memo, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import { Input } from "@/components/ui";

export type TradeSearchResult = { kind: "trade" | "service"; trade: string; label: string; sub?: string };

export const TradeSearch = memo(function TradeSearch(props: {
  placeholder?: string;
  trades: string[];
  services: Array<{ trade: string; label: string; category?: string }>;
  onSelect: (r: TradeSearchResult) => void;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const results = useMemo(() => {
    const q = deferred.trim().toLowerCase();
    if (q.length < 2) return [] as TradeSearchResult[];

    const out: Array<TradeSearchResult & { score: number }> = [];

    for (const t of props.trades) {
      const hay = String(t || "").toLowerCase();
      if (!hay) continue;
      if (hay.includes(q)) out.push({ kind: "trade", trade: t, label: t, score: hay.startsWith(q) ? 120 : 90 });
    }

    for (const s of props.services) {
      const trade = String(s.trade || "");
      const label = String(s.label || "");
      if (!trade || !label) continue;
      const hay = label.toLowerCase();
      if (!hay.includes(q)) continue;
      const score = hay.startsWith(q) ? 110 : 80;
      out.push({ kind: "service", trade, label, sub: s.category || undefined, score });
    }

    return out
      .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
      .slice(0, 8)
      .map(({ score: _score, ...r }) => r);
  }, [deferred, props.trades, props.services]);

  // Safari: keep focus stable even when results mount/unmount.
  useEffect(() => {
    if (!query.trim()) return;
    const id = window.setTimeout(() => {
      try {
        if (document.activeElement !== inputRef.current) inputRef.current?.focus();
      } catch {}
    }, 0);
    return () => window.clearTimeout(id);
  }, [results.length]);

  return (
    <div className={props.className || ""}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(String(e.currentTarget.value || ""))}
          placeholder={props.placeholder || "Search a service"}
        />

        {results.length ? (
          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white shadow-[0_18px_40px_rgba(17,24,39,.10)]">
            {results.map((r, idx) => (
              <button
                key={`${r.kind}:${r.trade}:${r.label}:${idx}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  props.onSelect(r);
                  // Keep the query as feedback.
                  setQuery(r.kind === "trade" ? r.trade : r.label);
                  window.setTimeout(() => inputRef.current?.focus(), 0);
                }}
                className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-[var(--hw-soft)]"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-[var(--hw-ink)] truncate">{r.label}</div>
                  <div className="mt-0.5 text-xs text-[var(--hw-muted)] truncate">
                    {r.kind === "service" ? (r.sub ? `${r.trade} • ${r.sub}` : r.trade) : "Trade"}
                  </div>
                </div>
                <div className="shrink-0 text-xs font-semibold text-[var(--hw-red)]">Select</div>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
});
