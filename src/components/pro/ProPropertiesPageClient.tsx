"use client";

import * as React from "react";
import Link from "next/link";

import { PortalShell } from "@/components/portal-shell";
import { PRO_NAV } from "@/components/pro/nav";
import { Button, Card } from "@/components/ui";
import { withDemo } from "@/lib/demo";

import { ProPropertiesClient } from "./ProPropertiesClient";

export function ProPropertiesPageClient() {
  const [addOpen, setAddOpen] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("add") === "1") setAddOpen(true);
    } catch {}
  }, []);

  return (
    <PortalShell
      role="PRO"
      title="Properties"
      portalTitle="Real Estate Pro"
      nav={PRO_NAV as unknown as { href: string; label: string }[]}
      description="Properties connected to your active clients and shared projects."
      primaryAction={
        <Link href={withDemo("/pro/dashboard")} className="inline-flex">
          <Button variant="secondary">Back to dashboard</Button>
        </Link>
      }
    >
      <Card className="p-6">
        <div className="flex items-center justify-end">
          <Button
            variant="secondary"
            onClick={() => {
              setAddOpen(true);
              if (typeof window !== "undefined") {
                const u = new URL(window.location.href);
                u.searchParams.delete("add");
                window.history.replaceState({}, "", u.toString());
              }
            }}
          >
            Add property
          </Button>
        </div>

        <div className="mt-4">
          <ProPropertiesClient empty={null} addOpen={addOpen} onAddOpenChange={setAddOpen} />
        </div>
      </Card>
    </PortalShell>
  );
}
