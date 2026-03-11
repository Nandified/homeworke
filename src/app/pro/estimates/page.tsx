import Link from "next/link";

import { PortalShell } from "@/components/portal-shell";
import { PRO_NAV } from "@/components/pro/nav";
import { Button, Card, EmptyState } from "@/components/ui";
import { withDemo } from "@/lib/demo";

import { ProEstimatesClient } from "@/components/pro/ProEstimatesClient";

export default function Page() {
  return (
    <PortalShell
      role="PRO"
      title="Real Estate Pro"
      nav={PRO_NAV as unknown as { href: string; label: string }[]}
      description="Quick pricing for inspection items, seller credits, and repair requests."
      primaryAction={
        <Link href={withDemo("/pro/express-estimate")}>
          <Button>Start Express Estimate</Button>
        </Link>
      }
    >
      <Card className="p-6">
        <div className="text-sm font-semibold text-[var(--hw-ink)]">Estimates</div>
        <div className="mt-1 text-sm text-[var(--hw-muted)]">Recent estimates and requests shared with you.</div>

        <div className="mt-5">
          <ProEstimatesClient
            empty={
              <EmptyState
                title="No estimates yet"
                text="Start an Express Estimate or wait for a homeowner to share an inspection item list."
                action={
                  <Link href={withDemo("/pro/express-estimate")}>
                    <Button>Start Express Estimate</Button>
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
