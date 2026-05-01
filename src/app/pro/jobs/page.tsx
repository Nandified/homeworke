import Link from "next/link";

import { PortalShell } from "@/components/portal-shell";
import { PRO_NAV } from "@/components/pro/nav";
import { Button, Card, CardHeader, EmptyState } from "@/components/ui";
import { ProJobsClient } from "@/components/pro/ProJobsClient";

export default function Page() {
  return (
    <PortalShell
      role="PRO"
      title="Jobs"
      portalTitle="Real Estate Pro"
      nav={PRO_NAV as unknown as { href: string; label: string }[]}
      hideHeading
    >
      <Card className="p-6">
        <CardHeader
          title="Jobs"
          subtitle="Track every active and closed job across client-shared projects and your own properties."
          action={
            <Link href="/pro/express-estimate">
              <Button>Start Instant Estimate</Button>
            </Link>
          }
        />
        <div className="mt-5">
          <ProJobsClient
            emptyClientJobs={
              <EmptyState
                title="No client jobs yet"
                text="Jobs appear once a client shares a project or you submit a request from the dashboard intake."
              />
            }
            emptyMyJobs={
              <EmptyState
                title="No jobs for your properties yet"
                text="Add a property and submit a job request to start tracking work here."
              />
            }
          />
        </div>
      </Card>
    </PortalShell>
  );
}
