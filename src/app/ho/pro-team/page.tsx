import { Card } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";

const nav = [
  { href: "/ho/dashboard", label: "Dashboard" },
  { href: "/ho/messages", label: "Messages" },
  { href: "/ho/properties", label: "My Properties" },
  { href: "/ho/pro-team", label: "Pro Team" },
  { href: "/ho/support", label: "Support" },
  { href: "/ho/account", label: "My Account" }
];

export default function Page() {
  return (
    <PortalShell role="HO" title="Homeowner" nav={nav}>
      <Card className="p-6">
        <div className="text-sm font-semibold">Pro Team</div>
        <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">Placeholder page for 2.0 parity. Wiring next.</div>
      </Card>
    </PortalShell>
  );
}
