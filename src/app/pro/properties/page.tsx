import { PortalShell } from "@/components/portal-shell";
import { PRO_NAV } from "@/components/pro/nav";
import { Button, Card, EmptyState } from "@/components/ui";
import { ProPropertiesClient } from "@/components/pro/ProPropertiesClient";

export default function Page() {
  return (
    <PortalShell
      role="PRO"
      title="Properties"
      portalTitle="Real Estate Pro"
      nav={PRO_NAV as unknown as { href: string; label: string }[]}
      description="Properties connected to your active clients and shared projects."
      primaryAction={<Button variant="secondary">Add property (stub)</Button>}
    >
      <Card className="p-6">
        <div className="text-sm font-semibold text-[var(--hw-ink)]">Properties</div>
        <div className="mt-1 text-sm text-[var(--hw-muted)]">Track addresses involved in inspections, repairs, and negotiation packets.</div>

        <div className="mt-5">
          <ProPropertiesClient
            empty={
              <EmptyState
                title="No properties yet"
                text="Properties will appear once a client shares a work order or you add one manually."
              />
            }
          />
        </div>
      </Card>
    </PortalShell>
  );
}
