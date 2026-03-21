import Link from "next/link";

import { PortalShell } from "@/components/portal-shell";
import { ProPropertyDetailClient } from "@/components/pro/ProPropertyDetailClient";
import { PRO_NAV } from "@/components/pro/nav";
import { Button, Card, EmptyState } from "@/components/ui";
import { withDemo } from "@/lib/demo";
import { listProperties, seedDemoStoreIfEmpty } from "@/lib/mock-store";

export const runtime = "nodejs";

export default async function Page(props: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const openEdit = sp?.edit === "1";

  // Demo-only (until auth + DB are wired): always seed and read from demo token.
  seedDemoStoreIfEmpty();
  const items = listProperties("demo");
  const property = items.find((p) => p.id === id) || null;

  return (
    <PortalShell
      role="PRO"
      title="Properties"
      portalTitle="Real Estate Pro"
      nav={PRO_NAV as unknown as { href: string; label: string }[]}
      description="A single place to track properties, project history, and shared work."
      primaryAction={
        <Link href={withDemo("/pro/properties")} className="inline-flex">
          <Button variant="secondary">Back to properties</Button>
        </Link>
      }
    >
      {!property ? (
        <Card className="p-6">
          <EmptyState title="Property not found" text="This property may have moved or you may not have access." />
        </Card>
      ) : (
        <ProPropertyDetailClient property={property} openEdit={openEdit} />
      )}
    </PortalShell>
  );
}
