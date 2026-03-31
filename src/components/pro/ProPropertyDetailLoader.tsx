"use client";

import * as React from "react";

import Link from "next/link";

import { ProPropertyDetailClient, type ProPropertyDetail } from "@/components/pro/ProPropertyDetailClient";
import { Button, Card, EmptyState } from "@/components/ui";
import { isDemoMode, withDemo } from "@/lib/demo";

type ApiProperty = ProPropertyDetail & {
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  clientProperty?: boolean | null;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
};

type StoredProperty = {
  id: string;
  address: string;
  nickname?: string;
  createdAt: string;
};

type StoredClientProperty = {
  id: string;
  createdAt: string;
  address: string;
  nickname?: string;
  propertyType?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
};

const STORAGE_KEYS = {
  customProps: "hw_props_custom_v1",
  clientProps: "hw_props_client_v1",
} as const;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function ProPropertyDetailLoader(props: { id: string; openEdit?: boolean }) {
  const [property, setProperty] = React.useState<ApiProperty | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        const url = new URL("/api/properties", window.location.origin);
        if (isDemoMode()) url.searchParams.set("demo", "1");
        else url.searchParams.set("token", "demo");

        const r = await fetch(url);
        const j = (await r.json()) as { ok?: boolean; properties?: ApiProperty[] };
        const base = (j.properties || []) as ApiProperty[];

        const custom = (readJson<StoredProperty[]>(STORAGE_KEYS.customProps, []) || []).map<ApiProperty>((p) => ({
          id: p.id,
          createdAt: p.createdAt,
          address: p.address,
          nickname: p.nickname || null,
          sharedWithMe: false,
          ownerName: "Fernando Rocha Jr",
          projectsCount: 0,
        }));

        const clientProps = (readJson<StoredClientProperty[]>(STORAGE_KEYS.clientProps, []) || []).map<ApiProperty>((p) => ({
          id: p.id,
          createdAt: p.createdAt,
          address: p.address,
          nickname: p.nickname || null,
          sharedWithMe: false,
          ownerName: p.clientName || null,
          ownerEmail: p.clientEmail || null,
          ownerPhone: p.clientPhone || null,
          projectsCount: 0,
        }));

        const seen = new Set<string>();
        const merged: ApiProperty[] = [];
        [...clientProps, ...custom, ...base].forEach((p) => {
          if (!p || !p.id) return;
          if (seen.has(p.id)) return;
          seen.add(p.id);
          merged.push(p);
        });

        const found = merged.find((p) => p.id === props.id) || null;
        if (!cancelled) setProperty(found);
      } catch {
        if (!cancelled) setProperty(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [props.id]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-sm text-[var(--hw-muted)]">Loading property…</div>
      </Card>
    );
  }

  if (!property) {
    return (
      <Card className="p-6">
        <EmptyState title="Property not found" text="This property may have moved or you may not have access." />
        <div className="mt-4">
          <Link href={withDemo("/pro/properties")} className="inline-flex">
            <Button variant="secondary">Back to properties</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return <ProPropertyDetailClient property={property} openEdit={props.openEdit} />;
}
