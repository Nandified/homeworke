import * as React from "react";
import { cn } from "@/lib/utils";

export function Container(props: React.ComponentProps<"div">) {
  const { className, ...rest } = props;
  return <div className={cn("mx-auto w-full max-w-6xl px-6", className)} {...rest} />;
}

export function Card(props: React.ComponentProps<"div">) {
  const { className, ...rest } = props;
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--hw-line)] bg-white shadow-[0_10px_30px_rgba(17,24,39,.06)]",
        className
      )}
      {...rest}
    />
  );
}

export function Pill(props: React.ComponentProps<"div">) {
  const { className, ...rest } = props;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[var(--hw-line)] bg-white px-3 py-2 text-xs text-[var(--hw-muted)]",
        className
      )}
      {...rest}
    />
  );
}

export function Button(
  props: React.ComponentProps<"button"> & {
    variant?: "primary" | "ghost";
  }
) {
  const { className, variant = "primary", ...rest } = props;
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition";
  const styles =
    variant === "primary"
      ? "bg-[var(--hw-red)] text-white shadow-[0_10px_20px_rgba(229,57,53,.18)] hover:brightness-95"
      : "border border-[var(--hw-line)] bg-white text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]";

  return <button className={cn(base, styles, className)} {...rest} />;
}
