import Link from "next/link";

import { PortalShell } from "@/components/portal-shell";
import { PRO_NAV } from "@/components/pro/nav";
import { Button, Card, Chip, EmptyState, Input } from "@/components/ui";
import { withDemo } from "@/lib/demo";

const demoClients = [
  { name: "Fernando Rocha Jr", email: "fernando@thefrjgroup.com", status: "Active" },
  { name: "Alyssa Buyer", email: "alyssa@example.com", status: "Invited" },
  { name: "Mark Seller", email: "mark@example.com", status: "Active" },
];

export default function Page() {
  return (
    <PortalShell
      role="PRO"
      title="My Clients"
      nav={PRO_NAV as unknown as { href: string; label: string }[]}
      description="Invite clients, track shared projects, and keep everyone in the loop."
      primaryAction={
        <Link href={withDemo("/pro/clients?invite=1")}>
          <Button>Invite client</Button>
        </Link>
      }
    >
      <div className="grid gap-6">
        <Card className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-[var(--hw-ink)]">My Clients</div>
              <div className="mt-1 text-sm text-[var(--hw-muted)]">People you’ve invited into shared project threads.</div>
            </div>
            <div className="w-full sm:w-72">
              <Input placeholder="Search clients (stub)" />
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {demoClients.map((c) => (
              <div
                key={c.email}
                className="flex flex-col gap-2 rounded-[var(--hw-radius-lg)] border border-[var(--hw-line)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-[var(--hw-ink)]">{c.name}</div>
                  <div className="truncate text-sm text-[var(--hw-muted)]">{c.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Chip>{c.status}</Chip>
                  <Link href={withDemo("/pro/messages")}> 
                    <Button variant="secondary">View messages</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <EmptyState
          title="Invite a client"
          text="Send an invite link so your buyer/seller can share a project and message with your office."
          action={
            <Link href={withDemo("/pro/clients?invite=1")}>
              <Button>Generate invite link (stub)</Button>
            </Link>
          }
        />
      </div>
    </PortalShell>
  );
}
