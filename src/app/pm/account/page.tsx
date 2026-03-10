import { Card, EmptyState } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";

const nav = [
  { href: "/pm/dashboard", label: "Dashboard" },
  { href: "/pm/projects", label: "My Projects" },
  { href: "/pm/calendar", label: "Calendar" },
  { href: "/pm/messages", label: "Messages" },
  { href: "/pm/support", label: "Support" },
  { href: "/pm/account", label: "My Account" },
];

export default function Page() {
  return (
    <PortalShell role="PM" title="Project Manager" nav={nav}>
      <Card className="p-6">
        <EmptyState title="Coming soon" text="Phase 2 delivers dashboard shells + data hooks." />
      </Card>
    </PortalShell>
  );
}
