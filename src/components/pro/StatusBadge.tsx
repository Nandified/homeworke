import { cn } from "@/lib/utils";

export function StatusBadge(props: { status: string }) {
  const s = props.status;
  const styles: Record<string, string> = {
    pending: "border-amber-200 bg-amber-50 text-amber-800",
    scheduled: "border-blue-200 bg-blue-50 text-blue-800",
    in_progress: "border-purple-200 bg-purple-50 text-purple-800",
    completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  };

  const label = s
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
        styles[s] || "border-[var(--hw-line)] bg-white text-[var(--hw-muted)]"
      )}
    >
      {label}
    </span>
  );
}
