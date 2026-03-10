import { Card, EmptyState } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";

const nav = [
  { href: "/pro/dashboard", label: "Dashboard" },
  { href: "/pro/estimates", label: "Estimates" },
  { href: "/pro/clients", label: "My Clients" },
  { href: "/pro/properties", label: "Properties" },
  { href: "/pro/messages", label: "Messages" },
  { href: "/pro/support", label: "Support" },
  { href: "/pro/account", label: "My Account" },
];

export default function Page() {
  return (
    <PortalShell role="PRO" title="Real Estate Pro" nav={nav}>
      <div className="grid gap-4">
        <Card className="p-6">
          <div className="text-sm font-semibold">Active projects shared with you</div>
          <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">
            2.0 parity placeholder. Next: list of shared properties with a status stepper.
          </div>
        </Card>
        <EmptyState title="No shared projects" text="When wired, this will show shared client projects and statuses." />
      </div>
    </PortalShell>
  );
}
