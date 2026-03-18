import { Card } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";
import { PRO_NAV } from "@/components/pro/nav";

export default function Page() {
  return (
    <PortalShell role="PRO" title="My Account" portalTitle="Real Estate Pro" nav={PRO_NAV}>
      <Card className="p-6">
        <div className="text-sm font-semibold">My Account</div>
        <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">Placeholder page for 2.0 parity. Wiring next.</div>
      </Card>
    </PortalShell>
  );
}
