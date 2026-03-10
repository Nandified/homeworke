import { Card, EmptyState, Pill } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";

const nav = [
  { href: "/sp/find-work", label: "Find Work" },
  { href: "/sp/messages", label: "Messages" },
  { href: "/sp/my-qtrs", label: "My Qtrs" },
  { href: "/sp/my-bids", label: "My Bid(s)" },
  { href: "/sp/support", label: "Support" },
  { href: "/sp/account", label: "My Account" },
];

export default function Page() {
  return (
    <PortalShell role="SP" title="Service Provider" nav={nav}>
      <div className="grid gap-4">
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold">Availability</div>
            <Pill>Off (placeholder)</Pill>
          </div>
          <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">
            2.0 parity placeholder. Next: availability toggle + opportunities list by zip.
          </div>
        </Card>
        <EmptyState title="No opportunities" text="When wired, this will show job opportunities and estimated ranges." />
      </div>
    </PortalShell>
  );
}
