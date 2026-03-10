import Link from "next/link";

import { Button, Pill } from "@/components/ui";

export function PageHeader(props: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  pill?: string;
  primaryAction?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {props.eyebrow ? (
          <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">{props.eyebrow}</div>
        ) : null}
        <h1 className="mt-1 text-balance text-2xl font-extrabold tracking-tight text-[var(--hw-ink)] sm:text-3xl">
          {props.title}
        </h1>
        {props.subtitle ? <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--hw-muted)]">{props.subtitle}</p> : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {props.pill ? <Pill>{props.pill}</Pill> : null}
        {props.secondaryAction ? (
          <Link href={props.secondaryAction.href}>
            <Button variant="secondary">{props.secondaryAction.label}</Button>
          </Link>
        ) : null}
        {props.primaryAction ? (
          <Link href={props.primaryAction.href}>
            <Button>{props.primaryAction.label}</Button>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
