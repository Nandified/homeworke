import { Button, Card, CardHeader } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";
import { HO_NAV } from "@/components/ho/nav";

export default function Page() {
  return (
    <PortalShell role="HO" title="Homeowner" nav={HO_NAV as any} hideHeading>
      <Card className="p-6">
        <CardHeader
          title="My Team"
          subtitle="Your referring Real Estate Pro (and any trusted advisors) — share updates only when you choose."
          action={<Button variant="secondary" disabled>Message</Button>}
        />
        <div className="mt-5 text-sm text-[var(--hw-muted)]">
          Coming next: team roster + a single thread for updates, plus per-work-order sharing controls.
        </div>
      </Card>
    </PortalShell>
  );
}
