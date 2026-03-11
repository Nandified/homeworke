"use client";

import * as React from "react";

import { Card, Chip, Divider } from "@/components/ui";
import { isDemoMode } from "@/lib/demo";

import { usePartnerContext } from "./usePartnerContext";

type ApiProperty = {
  id: string;
  createdAt: string;
  address: string;
  nickname?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
};

export function ProPropertiesClient(props: { empty: React.ReactNode }) {
  // partnerId is used only to know whether we're in a partner-linked context.
  // The properties endpoint is token-based in mock mode.
  const { partnerId } = usePartnerContext();
  const [items, setItems] = React.useState<ApiProperty[] | null>(null);

  React.useEffect(() => {
    // Allow demo to load even if partner context isn't present yet.
    const url = new URL("/api/properties", window.location.origin);
    if (isDemoMode()) {
      url.searchParams.set("demo", "1");
    } else {
      url.searchParams.set("token", "demo");
    }

    fetch(url)
      .then((r) => r.json())
      .then((j) => setItems(j.properties || []))
      .catch(() => setItems([]));
  }, [partnerId]);

  if (items === null) {
    return (
      <div className="rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-5 text-sm text-[var(--hw-muted)]">
        Loading properties…
      </div>
    );
  }

  if (!items.length) return <>{props.empty}</>;

  return (
    <div className="grid gap-3">
      {items.map((p) => (
        <Card key={p.id} className="p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[var(--hw-ink)]">{p.nickname || p.address}</div>
              {p.nickname ? <div className="mt-1 truncate text-sm text-[var(--hw-muted)]">{p.address}</div> : null}
            </div>
            <Chip>Connected</Chip>
          </div>
          <Divider className="my-4" />
          <div className="flex flex-wrap gap-2">
            <button className="rounded-full border border-[var(--hw-line)] bg-white px-4 py-2 text-xs font-semibold text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]">
              View projects
            </button>
            <button className="rounded-full border border-[var(--hw-line)] bg-white px-4 py-2 text-xs font-semibold text-[var(--hw-ink)] hover:bg-[var(--hw-soft)]">
              Start estimate
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}
