import * as React from "react";

import { Card, Pill } from "@/components/ui";
import { cn } from "@/lib/utils";

export type DashboardSectionProps = {
  title: string;
  description?: string;
  /** Right-side element in the header row (count, status, etc.) */
  meta?: React.ReactNode;
  /** Single primary action for the section (keep pages to one primary action total). */
  action?: React.ReactNode;
  /** Wrap body in a Card surface (default true). */
  card?: boolean;
  /** Convenience count pill. If provided, renders a Pill in meta slot unless meta is set. */
  count?: number | string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function DashboardSection({
  title,
  description,
  meta,
  action,
  card = true,
  count,
  children,
  className,
  bodyClassName,
}: DashboardSectionProps) {
  const header = (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-[var(--hw-ink)]">{title}</div>
        {description ? (
          <div className="mt-1 text-sm leading-relaxed text-[var(--hw-muted)]">{description}</div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {action}
        {meta ?? (count !== undefined ? <Pill>{count}</Pill> : null)}
      </div>
    </div>
  );

  const body = <div className={cn("mt-4", bodyClassName)}>{children}</div>;

  if (!card) {
    return (
      <section className={cn("grid gap-3", className)}>
        {header}
        {body}
      </section>
    );
  }

  return (
    <Card className={cn("p-6 md:p-7", className)}>
      {header}
      {body}
    </Card>
  );
}
