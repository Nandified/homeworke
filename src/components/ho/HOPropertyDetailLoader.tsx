"use client";

import * as React from "react";
import Link from "next/link";

import { HOPropertyDetailClient, type HOPropertyDetail } from "@/components/ho/HOPropertyDetailClient";
import { Button, Card, EmptyState } from "@/components/ui";

type Session = { token: string };

type ApiProperty = HOPropertyDetail & {
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
};

type StoredProperty = {
  id: string;
  address: string;
  nickname?: string;
  createdAt: string;
  propertyType?: string;
};

const STORAGE_KEYS = {
  customProps: "hw_props_custom_v1__HO",
} as const;

function loadSession(): Session | null {
  try {
    const raw = window.localStorage.getItem("hw_session_v1");
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function HOPropertyDetailLoader(props: { id: string; openEdit?: boolean }) {
  const [property, setProperty] = React.useState<ApiProperty | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        let base: ApiProperty[] = [];
        const session = loadSession();

        if (session?.token) {
          const url = new URL("/api/properties", window.location.origin);
          url.searchParams.set("token", session.token);
          const r = await fetch(url);
          const j = (await r.json()) as { ok?: boolean; properties?: ApiProperty[] };
          base = (j.properties || []) as ApiProperty[];
        }

        const custom = (readJson<StoredProperty[]>(STORAGE_KEYS.customProps, []) || []).map<ApiProperty>((p) => ({
          id: p.id,
          createdAt: p.createdAt,
          address: p.address,
          nickname: p.nickname || null,
          propertyType: p.propertyType || null,
          projectsCount: 0,
        }));

        const seen = new Set<string>();
        const merged: ApiProperty[] = [];
        [...custom, ...base].forEach((p) => {
          if (!p || !p.id || seen.has(p.id)) return;
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
        <div className="text-sm text-[var(--hw-muted)]">Loading property...</div>
      </Card>
    );
  }

  if (!property) {
    return (
      <Card className="p-6">
        <EmptyState title="Property not found" text="This property may have moved or may no longer be saved to this account." />
        <div className="mt-4">
          <Link href="/ho/properties" className="inline-flex">
            <Button variant="secondary">Back to properties</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return <HOPropertyDetailClient property={property} openEdit={props.openEdit} />;
}
