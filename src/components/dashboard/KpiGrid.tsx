import * as React from "react";

import { cn } from "@/lib/utils";

export function KpiGrid(props: {
  children: React.ReactNode;
  /** Tailwind grid cols classes; default is 1 col on mobile and 3 on lg. */
  className?: string;
}) {
  return <div className={cn("grid grid-cols-1 gap-4 lg:grid-cols-3", props.className)}>{props.children}</div>;
}
