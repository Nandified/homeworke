import Link from "next/link";

import { PortalShell } from "@/components/portal-shell";
import { ProPropertyDetailLoader } from "@/components/pro/ProPropertyDetailLoader";
import { PRO_NAV } from "@/components/pro/nav";
import { Button } from "@/components/ui";
import { withDemo } from "@/lib/demo";

export const runtime = "nodejs";

export default async function Page(props: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const openEdit = sp?.edit === "1";

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
      <ProPropertyDetailLoader id={id} openEdit={openEdit} />
    </PortalShell>
  );
}
