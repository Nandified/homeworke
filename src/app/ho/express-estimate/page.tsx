"use client";

import Link from "next/link";

import { PortalShell } from "@/components/portal-shell";
import { HO_NAV } from "@/components/ho/nav";
import { Button, Card, CardHeader } from "@/components/ui";

export default function Page() {
  return (
    <PortalShell role="HO" title="Homeowner" nav={HO_NAV as any} hideHeading>
      <Card className="p-6">
        <CardHeader
          title="Instant Estimate"
          subtitle="Upload an inspection/appraisal PDF, then open a report to analyze and download an estimate."
          action={
            <Link href="/express-estimate" className="inline-flex">
              <Button>Open Instant Estimate</Button>
            </Link>
          }
        />

        <div className="mt-5 text-sm text-[var(--hw-muted)]">
          This uses the same Express Estimate experience. We’ll bring this fully into the Homeowner portal next.
        </div>
      </Card>
    </PortalShell>
  );
}
