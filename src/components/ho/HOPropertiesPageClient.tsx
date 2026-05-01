"use client";

import * as React from "react";
import Link from "next/link";

import { PortalShell } from "@/components/portal-shell";
import { HO_NAV } from "@/components/ho/nav";
import { Button, Card, CardHeader } from "@/components/ui";

import { HOPropertiesClient } from "./HOPropertiesClient";

export function HOPropertiesPageClient() {
  const [addOpen, setAddOpen] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("add") === "1") setAddOpen(true);
    } catch {}
  }, []);

  return (
    <PortalShell role="HO" title="Homeowner" portalTitle="Homeowner" nav={HO_NAV as any} hideHeading>
      <Card className="p-6">
        <CardHeader
          title="Properties"
          subtitle="Your saved addresses for service and scheduling."
          action={
            <div className="flex items-center gap-2">
              <Link href="/ho/dashboard" className="inline-flex">
                <Button variant="secondary">Back to dashboard</Button>
              </Link>
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
          }
        />

        <div className="mt-5">
          <HOPropertiesClient empty={null} addOpen={addOpen} onAddOpenChange={setAddOpen} />
        </div>
      </Card>
    </PortalShell>
  );
}
