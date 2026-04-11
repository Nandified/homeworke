import * as React from "react";
import { cn } from "@/lib/utils";

export function Container(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("mx-auto min-w-0 w-full max-w-[var(--hw-max)] px-6 sm:px-8", props.className)} />;
}

export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white shadow-[var(--hw-shadow)] transition-shadow hover:shadow-[0_8px_24px_rgba(0,0,0,.08)]",
        props.className
      )}
    />
  );
}

export function Pill(props: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-[var(--hw-line)] bg-[var(--hw-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--hw-muted)] select-none",
        props.className
      )}
    />
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "xs" | "sm" | "md";
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(229,57,53,.4)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[.97]";

  const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
    xs: "px-3 py-1.5 text-[11px]",
    sm: "px-4 py-2 text-xs",
    md: "px-5 py-2.5 text-sm",
  };

  const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary:
      "bg-[var(--hw-red)] text-white shadow-[0_4px_14px_rgba(229,57,53,.3)] hover:shadow-[0_6px_20px_rgba(229,57,53,.35)] hover:brightness-[1.05]",
    secondary:
      "border border-[var(--hw-line)] bg-white text-[var(--hw-ink)] shadow-sm hover:bg-[var(--hw-soft)] hover:border-[color-mix(in_srgb,var(--hw-line)_80%,transparent)]",
    ghost: "text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]",
    destructive:
      "bg-[#dc2626] text-white shadow-[0_4px_14px_rgba(220,38,38,.25)] hover:shadow-[0_6px_20px_rgba(220,38,38,.3)] hover:brightness-[1.05]",
  };

  return <button className={cn(base, sizes[size], variants[variant], className)} {...props} />;
}

export function Label(props: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className={cn("text-sm font-semibold text-[var(--hw-ink)] select-none", props.className)} />;
}

type PickerOption = { id: string; label: string; sublabel?: string };

export function Picker(props: {
  label?: string;
  value: string;
  options: PickerOption[];
  placeholder?: string;
  onChange: (id: string) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);
  const [menuPos, setMenuPos] = React.useState<{ top: number; left: number; width: number } | null>(null);

  const active = props.options.find((o) => o.id === props.value) || null;

  const filtered = React.useMemo(() => {
    if (!props.searchable) return props.options;
    const q = (query || "").trim().toLowerCase();
    if (!q) return props.options;
    return props.options.filter((o) => {
      const hay = `${o.label} ${o.sublabel || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [props.options, props.searchable, query]);

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
    if (!open) {
      setMenuPos(null);
      return;
    }

    function compute() {
      const btn = buttonRef.current;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      setMenuPos({ top: r.bottom + 8, left: r.left, width: r.width });
    }

    compute();
    window.addEventListener("resize", compute);
    // capture scroll from any scroll container (including modal body)
    window.addEventListener("scroll", compute, true);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="grid gap-2">
      {props.label ? <Label className="text-xs">{props.label}</Label> : null}
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => {
            setOpen((v) => {
              const next = !v;
              if (!next) setQuery("");
              return next;
            });
          }}
          className="group flex h-11 w-full items-center justify-between gap-3 rounded-[999px] border border-[var(--hw-line)] bg-gradient-to-b from-white to-[var(--hw-soft)] px-4 text-left shadow-[0_10px_22px_rgba(17,24,39,.06)] outline-none transition hover:shadow-[0_12px_26px_rgba(17,24,39,.08)] focus:border-[rgba(229,57,53,.35)] focus:ring-4 focus:ring-[rgba(229,57,53,.12)]"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="min-w-0 truncate text-sm font-medium text-[var(--hw-ink)]">
            {active?.label || props.placeholder || "Select…"}
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--hw-line)] bg-white/80 text-[var(--hw-muted)] shadow-sm transition group-hover:bg-white">
            <span className={cn("transition", open ? "rotate-180" : "")}>⌄</span>
          </span>
        </button>

        {open && menuPos ? (
          <div
            role="listbox"
            className="fixed z-[80] overflow-hidden rounded-[var(--hw-radius-lg)] border border-[rgba(229,57,53,.18)] bg-white shadow-[0_14px_40px_rgba(17,24,39,.12)]"
            style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
          >
            <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[var(--hw-red)]/10 blur-[40px]" />

            {props.searchable ? (
              <div className="relative border-b border-[rgba(229,57,53,.14)] bg-white p-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={props.searchPlaceholder || "Search…"}
                  className="h-10 w-full rounded-[999px] border border-[var(--hw-line)] bg-[var(--hw-soft)] px-4 text-sm outline-none transition focus:border-[rgba(229,57,53,.35)] focus:ring-4 focus:ring-[rgba(229,57,53,.10)]"
                />
              </div>
            ) : null}

            <div className="relative max-h-64 overflow-auto p-1">
              {filtered.length === 0 ? (
                <div className="p-3 text-sm text-[var(--hw-muted)]">No matches.</div>
              ) : null}
              {filtered.map((o) => {
                const selected = o.id === props.value;
                return (
                  <button
                    key={o.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      props.onChange(o.id);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={cn(
                      "w-full rounded-[12px] px-3 py-2 text-left transition",
                      selected ? "bg-[rgba(229,57,53,.08)] text-[var(--hw-ink)]" : "hover:bg-[var(--hw-soft)] text-[var(--hw-ink)]"
                    )}
                  >
                    <div className="truncate text-sm font-medium">{o.label}</div>
                    {o.sublabel ? <div className="mt-0.5 truncate text-xs text-[var(--hw-muted)]">{o.sublabel}</div> : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;
export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      {...props}
      className={cn(
        "h-11 w-full rounded-[var(--hw-radius-sm)] border border-[var(--hw-line)] bg-white px-3.5 text-sm outline-none transition-all duration-150 placeholder:text-[var(--hw-muted)] hover:border-[color-mix(in_srgb,var(--hw-line)_60%,var(--hw-ink))] focus:border-[rgba(229,57,53,.5)] focus:ring-2 focus:ring-[rgba(229,57,53,.12)] focus:shadow-[0_0_0_4px_rgba(229,57,53,.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(229,57,53,.12)]",
        className
      )}
    />
  );
});

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;
export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-28 w-full rounded-[var(--hw-radius-sm)] border border-[var(--hw-line)] bg-white px-3.5 py-3 text-sm leading-relaxed outline-none transition-all duration-150 placeholder:text-[var(--hw-muted)] hover:border-[color-mix(in_srgb,var(--hw-line)_60%,var(--hw-ink))] focus:border-[rgba(229,57,53,.5)] focus:ring-2 focus:ring-[rgba(229,57,53,.12)] focus:shadow-[0_0_0_4px_rgba(229,57,53,.06)]",
        className
      )}
    />
  );
}

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & { label?: string };
export function Checkbox({ className, label, ...props }: CheckboxProps) {
  const autoId = React.useId();
  const id = props.id || autoId;
  return (
    <div className="flex items-start gap-2.5">
      <input
        {...props}
        id={id}
        type="checkbox"
        className={cn(
          "mt-0.5 h-4 w-4 rounded border border-[var(--hw-line)] text-[var(--hw-red)] transition focus:ring-2 focus:ring-[rgba(229,57,53,.14)] focus:ring-offset-1",
          className
        )}
      />
      {label ? (
        <label htmlFor={id} className="cursor-pointer text-sm leading-6 text-[var(--hw-muted)] select-none">
          {label}
        </label>
      ) : null}
    </div>
  );
}

export function Divider(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("h-px w-full bg-[var(--hw-line)]", props.className)} />;
}

export function Chip(props: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center rounded-full border border-[var(--hw-line)] bg-white px-3 py-1.5 text-xs font-medium text-[#374151] shadow-sm select-none",
        props.className
      )}
    />
  );
}

export function EmptyState(props: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-[var(--hw-radius-lg)] border border-dashed border-[var(--hw-line)] bg-[var(--hw-soft)] p-8 text-center">
      <div className="text-sm font-semibold text-[var(--hw-ink)]">{props.title}</div>
      <div className="mx-auto mt-2 max-w-md text-sm leading-7 text-[var(--hw-muted)]">{props.text}</div>
      {props.action ? <div className="mt-5">{props.action}</div> : null}
    </div>
  );
}

export function StatTile(props: { label: string; value: string; note?: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex min-h-[128px] flex-col justify-between rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-4 text-left transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,.06)]",
        props.className
      )}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--hw-muted)]">{props.label}</div>
      <div>
        <div className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">{props.value}</div>
        {props.note ? <div className="mt-1 line-clamp-2 text-sm text-[var(--hw-muted)]">{props.note}</div> : null}
      </div>
    </div>
  );
}

// Modal shell (Phase 1): UI only, no focus trap.
export function Modal(props: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  /**
   * Mobile placement: some modals should feel like a bottom-sheet, others should float centered.
   * Defaults to bottom-sheet on mobile to match the existing UX.
   */
  mobilePlacement?: "bottom" | "center";
  /**
   * When this value changes (or when opening), the modal body will scroll to top.
   * Useful for tabbed/step flows inside a modal.
   */
  scrollKey?: unknown;
}) {
  const bodyRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!props.open) return;
    // Ensure the user always lands at the top when opening or switching tabs/steps.
    bodyRef.current?.scrollTo({ top: 0 });
  }, [props.open, props.scrollKey]);

  if (!props.open) return null;

  const placement = props.mobilePlacement ?? "bottom";

  const panelClass = cn(
    "w-full max-w-xl animate-[fadeScaleIn_150ms_ease-out] overflow-hidden border border-[var(--hw-line)] bg-white shadow-[0_20px_60px_rgba(0,0,0,.15)] max-h-[calc(100vh-1.5rem)]",
    placement === "bottom"
      ? "rounded-t-[var(--hw-radius-lg)] sm:rounded-[var(--hw-radius-lg)]"
      : "rounded-[var(--hw-radius-lg)]"
  );

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center sm:p-5",
        placement === "bottom" ? "items-end" : "items-center"
      )}
    >
      <div className={panelClass}>
        <div className="flex items-center justify-between border-b border-[var(--hw-line)] px-4 py-3 sm:px-6 sm:py-4">
          <div className="text-sm font-semibold text-[var(--hw-ink)]">{props.title}</div>
          <Button variant="ghost" onClick={props.onClose} aria-label="Close modal">
            ✕
          </Button>
        </div>
        <div
          ref={bodyRef}
          className="max-h-[calc(100vh-8rem)] overflow-y-auto p-4 sm:p-6 overscroll-contain"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {props.children}
        </div>
      </div>
    </div>
  );
}

// Toast shell (Phase 1): render-only.
export function Toast(props: { title: string; text?: string }) {
  return (
    <div className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,.1)]">
      <div className="text-sm font-semibold text-[var(--hw-ink)]">{props.title}</div>
      {props.text ? <div className="mt-1 text-sm leading-relaxed text-[var(--hw-muted)]">{props.text}</div> : null}
    </div>
  );
}

type RadioCardOption = { value: string; title: string; text?: string };

export function RadioCardGroup(props: {
  name: string;
  value: string;
  onChange: (next: string) => void;
  options: RadioCardOption[];
}) {
  return (
    <div className="grid gap-3">
      {props.options.map((o) => {
        const checked = o.value === props.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => props.onChange(o.value)}
            className={cn(
              "rounded-[var(--hw-radius-lg)] border bg-white p-4 text-left transition-all duration-150",
              checked
                ? "border-[var(--hw-red)] ring-2 ring-[rgba(229,57,53,.15)] shadow-[0_4px_16px_rgba(229,57,53,.1)]"
                : "border-[var(--hw-line)] hover:bg-[var(--hw-soft)] hover:border-[color-mix(in_srgb,var(--hw-line)_60%,var(--hw-ink))]"
            )}
            aria-pressed={checked}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  checked ? "border-[var(--hw-red)] bg-[var(--hw-red)]" : "border-[var(--hw-line)]"
                )}
              >
                {checked ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
              </span>
              <div className="text-sm font-semibold text-[var(--hw-ink)]">{o.title}</div>
            </div>
            {o.text ? <div className="mt-1.5 pl-7 text-sm leading-6 text-[var(--hw-muted)]">{o.text}</div> : null}
          </button>
        );
      })}
    </div>
  );
}
