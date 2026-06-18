import Link from "next/link";

import { HOPropertyDetailLoader } from "@/components/ho/HOPropertyDetailLoader";
import { HO_NAV } from "@/components/ho/nav";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui";

export const runtime = "nodejs";

export default async function Page(props: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const openEdit = sp?.edit === "1";

  return (
    <PortalShell
      role="HO"
      title="Properties"
      portalTitle="Homeowner"
      nav={HO_NAV as unknown as { href: string; label: string }[]}
      description="Review saved property details, service activity, and next steps."
      primaryAction={
        <Link href="/ho/properties" className="inline-flex">
          <Button variant="secondary">Back to properties</Button>
        </Link>
      }
    >
      <HOPropertyDetailLoader id={id} openEdit={openEdit} />
    </PortalShell>
  );
}
