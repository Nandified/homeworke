import { Card, CardHeader, EmptyState, Pill } from "@/components/ui";
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
      hideHeading
    >
      <Card className="p-6">
        <CardHeader
          title="Messages"
          subtitle="Quickly scan recent threads, nudge homeowners, and keep deals moving."
          action={<Pill>Inbox</Pill>}
        />

        <div className="mt-5">
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
