import { Card, StatTile } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";

const nav = [
  { href: "/hg/dashboard", label: "Dashboard" },
  { href: "/hg/projects", label: "My Projects" },
  { href: "/hg/estimates", label: "Estimates" },
  { href: "/hg/messages", label: "Messages" },
  { href: "/hg/service-providers", label: "Service Providers" },
  { href: "/hg/customers", label: "Customers" },
  { href: "/hg/real-estate-pros", label: "Real Estate Pros" },
  { href: "/hg/help-desk", label: "Help Desk" },
  { href: "/hg/support", label: "Support" },
  { href: "/hg/account", label: "My Account" },
];

export default function Page() {
  return (
    <PortalShell role="HG" title="Home Guide" nav={nav}>
      <div className="grid gap-4">
        <Card className="p-6">
          <div className="text-sm font-semibold">KPIs (2.0 parity placeholder)</div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <StatTile label="Work Orders pending" value="0" />
            <StatTile label="Help Desk pending" value="0" />
            <StatTile label="Active projects" value="0" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm font-semibold">Active projects</div>
          <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">
            Next: list with steppers + triage actions.
          </div>
        </Card>
      </div>
    </PortalShell>
  );
}
