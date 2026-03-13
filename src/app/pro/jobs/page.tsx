import Link from "next/link";

import { PortalShell } from "@/components/portal-shell";
import { PRO_NAV } from "@/components/pro/nav";
import { Button, Card, EmptyState } from "@/components/ui";
import { ProJobsClient } from "@/components/pro/ProJobsClient";

export default function Page() {
  return (
    <PortalShell
      role="PRO"
      title="Jobs"
      nav={PRO_NAV as unknown as { href: string; label: string }[]}
      description="Track every active and closed job across client-shared projects and your own properties."
      primaryAction={
        <Link href="/pro/express-estimate">
          <Button>Start Express Estimate</Button>
        </Link>
      }
    >
      <Card className="p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Jobs</div>
            <div className="mt-1 text-sm text-[var(--hw-muted)]">Separated views so you can switch between client-shared work and your own properties.</div>
          </div>
        </div>

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
