import { SP_NAV } from "@/components/sp/nav";

import { Card, Container } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";

export default function ServiceProviderBillingPage() {
  return (
    <PortalShell role="SP" title="Service Provider" nav={SP_NAV} description="Billing & payouts (parity shell; wiring next)." >
      <Container>
        <Card className="p-6">
          <div className="text-sm font-semibold text-[var(--hw-ink)]">Billing</div>
          <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">
            Coming next: invoices, platform fee breakdown, payout method, and payment history.
          </div>
        </Card>
      </Container>
    </PortalShell>
  );
}
