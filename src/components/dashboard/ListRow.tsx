import Link from "next/link";
import * as React from "react";

import { Chip } from "@/components/ui";
import { cn } from "@/lib/utils";

export type ListRowProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Right-aligned metadata (date, status pill, etc.) */
  meta?: React.ReactNode;
  /** Optional chip/badge shown next to the title */
  badge?: React.ReactNode;
  /** Optional small supporting text below title/subtitle */
  footnote?: React.ReactNode;
  href?: string;
  className?: string;
};

export function ListRow({ title, subtitle, meta, badge, footnote, href, className }: ListRowProps) {
  const content = (
    <div
      className={cn(
        "rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-4 transition-colors",
        href ? "hover:bg-[var(--hw-soft)]" : "",
        className
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="grid grid-cols-[1fr_auto] items-start gap-2">
            <div className="min-w-0 text-sm font-semibold text-[var(--hw-ink)] line-clamp-2 sm:line-clamp-1">
              {title}
            </div>
            {badge ? <div className="shrink-0 justify-self-end">{badge}</div> : null}
          </div>
          {subtitle ? <div className="mt-0.5 text-sm text-[var(--hw-muted)]">{subtitle}</div> : null}
          {footnote ? <div className="mt-1 text-xs text-[var(--hw-muted)]">{footnote}</div> : null}
        </div>
        {meta ? (
          <div className="mt-1 w-full shrink-0 text-xs text-[var(--hw-muted)] sm:mt-0 sm:w-auto">
            {meta}
          </div>
        ) : null}
      </div>
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} className="no-underline hover:no-underline focus:no-underline visited:no-underline">
      {content}
    </Link>
  );
}

export function StatusChip(props: { children: React.ReactNode; className?: string }) {
  return (
    <Chip
      className={cn(
        "border-[var(--hw-line)] bg-white text-[var(--hw-ink)]",
        props.className
      )}
    >
      {props.children}
    </Chip>
  );
}
