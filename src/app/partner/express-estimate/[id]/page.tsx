import { ExpressEstimateReportClient } from "@/components/partner/ExpressEstimateReportClient";

export default async function PartnerExpressEstimateReportPage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const staged = typeof sp.staged === "string" ? sp.staged : undefined;
  const ownerName = typeof sp.owner === "string" ? sp.owner : undefined;
  const address = typeof sp.address === "string" ? sp.address : undefined;

  return (
    <ExpressEstimateReportClient
      basePath="/partner"
      role="PARTNER"
      reportId={id}
      stagedId={staged}
      ownerName={ownerName}
      address={address}
    />
  );
}
