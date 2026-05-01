import { Card, CardHeader } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";
import { HO_NAV } from "@/components/ho/nav";

export default function Page() {
  return (
    <PortalShell role="HO" title="Homeowner" nav={HO_NAV as any} hideHeading>
      <Card className="p-6">
        <CardHeader title="Support" subtitle="Get help fast — report an issue or ask a question." />
        <div className="mt-5 text-sm text-[var(--hw-muted)]">Coming next.</div>
      </Card>
    </PortalShell>
  );
}
