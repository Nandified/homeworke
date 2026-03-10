import { Card, EmptyState } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";

const nav = [
  { href: "/office/dashboard", label: "Dashboard" },
  { href: "/office/partners", label: "Partners" },
  { href: "/office/work-orders", label: "Work Orders" },
  { href: "/office/messages", label: "Messages" },
  { href: "/office/support", label: "Support" },
  { href: "/office/account", label: "Office Settings" },
];

export default function Page() {
  return (
    <PortalShell role="OFFICE" title="Office" nav={nav}>
      <Card className="p-6">
        <EmptyState title="Coming soon" text="Phase 2 delivers dashboard shells + data hooks." />
      </Card>
    </PortalShell>
  );
}
