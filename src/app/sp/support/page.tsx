import { Card } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";

const nav = [
  { href: "/sp/find-work", label: "Find Work" },
  { href: "/sp/messages", label: "Messages" },
  { href: "/sp/my-qtrs", label: "My Qtrs" },
  { href: "/sp/my-bids", label: "My Bid(s)" },
  { href: "/sp/support", label: "Support" },
  { href: "/sp/account", label: "My Account" }
];

export default function Page() {
  return (
    <PortalShell role="SP" title="Service Provider" nav={nav}>
      <Card className="p-6">
        <div className="text-sm font-semibold">Support</div>
        <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">Placeholder page for 2.0 parity. Wiring next.</div>
      </Card>
    </PortalShell>
  );
}
