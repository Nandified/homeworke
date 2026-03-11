import { Card } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";

const nav = [
  { href: "/pro/dashboard", label: "Dashboard" },
  { href: "/pro/express-estimate", label: "Express Estimate" },
  { href: "/pro/estimates", label: "Estimates" },
  { href: "/pro/clients", label: "My Clients" },
  { href: "/pro/properties", label: "Properties" },
  { href: "/pro/messages", label: "Messages" },
  { href: "/pro/support", label: "Support" },
  { href: "/pro/account", label: "My Account" }
];

export default function Page() {
  return (
    <PortalShell role="PRO" title="Real Estate Pro" nav={nav}>
      <Card className="p-6">
        <div className="text-sm font-semibold">Estimates</div>
        <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">Placeholder page for 2.0 parity. Wiring next.</div>
      </Card>
    </PortalShell>
  );
}
