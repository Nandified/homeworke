import * as React from "react";
import { cn } from "@/lib/utils";

export function Container(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("mx-auto w-full max-w-6xl px-5", props.className)} />;
}

export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-[var(--hw-radius)] border border-[var(--hw-line)] bg-white shadow-[var(--hw-shadow)]",
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
        "inline-flex items-center gap-2 rounded-full border border-[var(--hw-line)] bg-white px-3 py-2 text-xs font-semibold text-[var(--hw-muted)]",
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
    "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(229,57,53,.35)] disabled:opacity-50 disabled:cursor-not-allowed";

  const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary: "bg-[var(--hw-red)] text-white shadow-[0_10px_20px_rgba(229,57,53,.22)] hover:brightness-95",
    secondary: "border border-[var(--hw-line)] bg-white text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]",
    ghost: "text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]",
    destructive: "bg-[#dc2626] text-white hover:brightness-95",
  };

  return <button className={cn(base, variants[variant], className)} {...props} />;
}

export function Label(props: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className={cn("text-sm font-semibold text-[var(--hw-ink)]", props.className)} />;
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;
export function Input({ className, ...props }: InputProps) {
  return (
    <input
      {...props}
      className={cn(
        "h-11 w-full rounded-[var(--hw-radius-sm)] border border-[var(--hw-line)] bg-white px-3 text-sm outline-none transition placeholder:text-[var(--hw-muted)] focus:border-[rgba(229,57,53,.35)] focus:ring-2 focus:ring-[rgba(229,57,53,.14)]",
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
        "min-h-28 w-full rounded-[var(--hw-radius-sm)] border border-[var(--hw-line)] bg-white px-3 py-3 text-sm outline-none transition placeholder:text-[var(--hw-muted)] focus:border-[rgba(229,57,53,.35)] focus:ring-2 focus:ring-[rgba(229,57,53,.14)]",
        className
      )}
    />
  );
}

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & { label?: string };
export function Checkbox({ className, label, ...props }: CheckboxProps) {
  const id = props.id || React.useId();
  return (
    <div className="flex items-start gap-2">
      <input
        {...props}
        id={id}
        type="checkbox"
        className={cn(
          "mt-0.5 h-4 w-4 rounded border border-[var(--hw-line)] text-[var(--hw-red)] focus:ring-2 focus:ring-[rgba(229,57,53,.14)]",
          className
        )}
      />
      {label ? (
        <label htmlFor={id} className="text-sm leading-6 text-[var(--hw-muted)]">
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
        "inline-flex items-center rounded-full border border-[var(--hw-line)] bg-white px-3 py-2 text-xs font-medium text-[#374151]",
        props.className
      )}
    />
  );
}

export function EmptyState(props: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-[var(--hw-radius)] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-6">
      <div className="text-sm font-semibold text-[var(--hw-ink)]">{props.title}</div>
      <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">{props.text}</div>
      {props.action ? <div className="mt-4">{props.action}</div> : null}
    </div>
  );
}

export function StatTile(props: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-[var(--hw-radius)] border border-[var(--hw-line)] bg-white p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--hw-muted)]">{props.label}</div>
      <div className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">{props.value}</div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5">
      <div className="w-full max-w-xl rounded-[var(--hw-radius)] border border-[var(--hw-line)] bg-white shadow-[var(--hw-shadow)]">
        <div className="flex items-center justify-between border-b border-[var(--hw-line)] p-5">
          <div className="text-sm font-semibold">{props.title}</div>
          <Button variant="ghost" onClick={props.onClose} aria-label="Close modal">
            Close
          </Button>
        </div>
        <div className="p-5">{props.children}</div>
      </div>
    </div>
  );
}

// Toast shell (Phase 1): render-only.
export function Toast(props: { title: string; text?: string }) {
  return (
    <div className="rounded-[var(--hw-radius)] border border-[var(--hw-line)] bg-white p-4 shadow-[var(--hw-shadow)]">
      <div className="text-sm font-semibold">{props.title}</div>
      {props.text ? <div className="mt-1 text-sm text-[var(--hw-muted)]">{props.text}</div> : null}
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
              "rounded-[var(--hw-radius)] border bg-white p-4 text-left transition",
              checked
                ? "border-[rgba(229,57,53,.35)] shadow-[0_10px_20px_rgba(229,57,53,.10)]"
                : "border-[var(--hw-line)] hover:bg-[var(--hw-soft)]"
            )}
            aria-pressed={checked}
          >
            <div className="text-sm font-semibold">{o.title}</div>
            {o.text ? <div className="mt-1 text-sm leading-6 text-[var(--hw-muted)]">{o.text}</div> : null}
          </button>
        );
      })}
    </div>
  );
}
