import * as React from "react";
import { cn } from "@/lib/utils";

export function Container(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("mx-auto w-full max-w-[var(--hw-max)] px-6 sm:px-8", props.className)} />;
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
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(229,57,53,.4)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[.97]";

  const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary:
      "bg-[var(--hw-red)] text-white shadow-[0_4px_14px_rgba(229,57,53,.3)] hover:shadow-[0_6px_20px_rgba(229,57,53,.35)] hover:brightness-[1.05]",
    secondary:
      "border border-[var(--hw-line)] bg-white text-[var(--hw-ink)] shadow-sm hover:bg-[var(--hw-soft)] hover:border-[color-mix(in_srgb,var(--hw-line)_80%,transparent)]",
    ghost: "text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]",
    destructive:
      "bg-[#dc2626] text-white shadow-[0_4px_14px_rgba(220,38,38,.25)] hover:shadow-[0_6px_20px_rgba(220,38,38,.3)] hover:brightness-[1.05]",
  };

  return <button className={cn(base, variants[variant], className)} {...props} />;
}

export function Label(props: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className={cn("text-sm font-semibold text-[var(--hw-ink)] select-none", props.className)} />;
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;
export function Input({ className, ...props }: InputProps) {
  return (
    <input
      {...props}
      className={cn(
        "h-11 w-full rounded-[var(--hw-radius-sm)] border border-[var(--hw-line)] bg-white px-3.5 text-sm outline-none transition-all duration-150 placeholder:text-[var(--hw-muted)] hover:border-[color-mix(in_srgb,var(--hw-line)_60%,var(--hw-ink))] focus:border-[rgba(229,57,53,.5)] focus:ring-2 focus:ring-[rgba(229,57,53,.12)] focus:shadow-[0_0_0_4px_rgba(229,57,53,.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(229,57,53,.12)]",
        className
      )}
    />
  );
}

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
  const id = props.id || React.useId();
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

export function StatTile(props: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-5 transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,.06)]">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--hw-muted)]">{props.label}</div>
      <div className="mt-2.5 text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">{props.value}</div>
      {props.note ? <div className="mt-2 text-sm text-[var(--hw-muted)]">{props.note}</div> : null}
    </div>
  );
}

// Modal shell (Phase 1): UI only, no focus trap.
export function Modal(props: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!props.open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5 backdrop-blur-sm">
      <div className="w-full max-w-xl animate-[fadeScaleIn_150ms_ease-out] rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white shadow-[0_20px_60px_rgba(0,0,0,.15)]">
        <div className="flex items-center justify-between border-b border-[var(--hw-line)] px-6 py-4">
          <div className="text-sm font-semibold text-[var(--hw-ink)]">{props.title}</div>
          <Button variant="ghost" onClick={props.onClose} aria-label="Close modal">
            ✕
          </Button>
        </div>
        <div className="p-6">{props.children}</div>
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
