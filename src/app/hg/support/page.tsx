import { Card } from "@/components/ui";
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
  { href: "/hg/account", label: "My Account" }
];

export default function Page() {
  return (
    <PortalShell role="HG" title="Home Guide" nav={nav}>
      <Card className="p-6">
        <div className="text-sm font-semibold">Support</div>
        <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">Placeholder page for 2.0 parity. Wiring next.</div>
      </Card>
    </PortalShell>
  );
}
