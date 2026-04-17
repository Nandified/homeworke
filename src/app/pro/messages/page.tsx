import { Card, EmptyState, Pill } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";
import { PRO_NAV } from "@/components/pro/nav";
import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";
import { ProMessagesClient } from "@/components/pro/ProMessagesClient";

export default function Page() {
  // Messages badge is hydrated client-side by PortalShell reading localStorage.
  const nav = PRO_NAV;

  return (
    <PortalShell
      role="PRO"
      title="Messages"
      portalTitle="Real Estate Pro"
      nav={nav as unknown as { href: string; label: string; badge?: string | number }[]}
      description="Quickly scan recent threads, nudge homeowners, and keep deals moving."
    >
      <Card className="p-6">
        <div className="flex items-center justify-end">
          <Pill>Inbox</Pill>
        </div>

        <div className="mt-4">
          {/* Guard against any client-only runtime issues so the whole app doesn't white-screen. */}
          {/**/}
          <ClientErrorBoundary title="Messages crashed" hint="We hit a client-side error while rendering Messages. Refresh and try again.">
            <ProMessagesClient
              empty={
                <EmptyState
                  title="No messages yet"
                  text="Messages will appear once a homeowner starts a thread from a shared project."
                />
              }
            />
          </ClientErrorBoundary>
        </div>
      </Card>
    </PortalShell>
  );
}
