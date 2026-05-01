import Link from "next/link";

import { PortalShell } from "@/components/portal-shell";
import { HO_NAV } from "@/components/ho/nav";
import { Button, Card, CardHeader, EmptyState } from "@/components/ui";
import { HOJobsClient } from "@/components/ho/HOJobsClient";

export default function Page() {
  return (
    <PortalShell role="HO" title="Homeowner" nav={HO_NAV as any} hideHeading>
      <Card className="p-6">
        <CardHeader
          title="Jobs"
          subtitle="Track every active and closed job across your properties."
          action={
            <Link href="/marketplace/intake">
              <Button>Request service</Button>
            </Link>
          }
        />

        <div className="mt-5">
          <HOJobsClient
            emptyJobs={
              <EmptyState
                title="No jobs yet"
                text="Start by requesting a service. Your work orders will show up here."
                action={
                  <Link href="/marketplace/intake">
                    <Button>Request service</Button>
                  </Link>
                }
              />
            }
          />
        </div>
      </Card>
    </PortalShell>
  );
}
