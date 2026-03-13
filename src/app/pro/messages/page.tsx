import { Card, EmptyState, Pill } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";
import { PRO_NAV } from "@/components/pro/nav";
import { ProMessagesClient } from "@/components/pro/ProMessagesClient";

export default function Page() {
  return (
    <PortalShell
      role="PRO"
      title="Messages"
      portalTitle="Real Estate Pro"
      nav={PRO_NAV as unknown as { href: string; label: string }[]}
      description="Quickly scan recent threads, nudge homeowners, and keep deals moving."
    >
      <Card className="p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--hw-ink)]">Messages</div>
            <div className="mt-1 text-sm text-[var(--hw-muted)]">Latest threads shared with your office.</div>
          </div>
          <div className="flex items-center gap-2">
            <Pill>Inbox</Pill>
          </div>
        </div>

        <div className="mt-5">
          <ProMessagesClient
            empty={
              <EmptyState
                title="No messages yet"
                text="Messages will appear once a homeowner starts a thread from a shared project."
              />
            }
          />
        </div>
      </Card>
    </PortalShell>
  );
}
