import Link from "next/link";

import { Button, Card, EmptyState } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";

const nav = [
  { href: "/ho/dashboard", label: "Dashboard" },
  { href: "/ho/messages", label: "Messages" },
  { href: "/ho/properties", label: "My Properties" },
  { href: "/ho/pro-team", label: "Pro Team" },
  { href: "/ho/support", label: "Support" },
  { href: "/ho/account", label: "My Account" },
];

export default function Page() {
  return (
    <PortalShell role="HO" title="Homeowner" nav={nav}>
      <div className="grid gap-4">
        <Card className="p-6">
          <div className="text-sm font-semibold">Quick actions (2.0 parity)</div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button>Submit Work Order</Button>
            <Button variant="secondary">Request Express Estimate</Button>
            <Button variant="ghost">Chat with Pro Team</Button>
          </div>
        </Card>

        <EmptyState
          title="Active services"
          text="When wired, this will show current work orders and appointments."
          action={
            <Link href="/portal">
              <Button variant="secondary">Back to portal selector</Button>
            </Link>
          }
        />
      </div>
    </PortalShell>
  );
}
