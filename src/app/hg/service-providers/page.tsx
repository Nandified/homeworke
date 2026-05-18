import { Card } from "@/components/ui";
import { HG_NAV } from "@/components/hg/nav";

import { PortalShell } from "@/components/portal-shell";


export default function Page() {
  return (
    <PortalShell role="HG" title="Home Guide" nav={HG_NAV}>
      <Card className="p-6">
        <div className="text-sm font-semibold">Service Providers</div>
        <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">Placeholder page for 2.0 parity. Wiring next.</div>
      </Card>
    </PortalShell>
  );
}
