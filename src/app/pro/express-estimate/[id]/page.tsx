import { ExpressEstimateReportClient } from "@/components/partner/ExpressEstimateReportClient";

export default async function ProExpressEstimateReportPage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const staged = typeof sp.staged === "string" ? sp.staged : undefined;

  return <ExpressEstimateReportClient basePath="/pro" role="PRO" reportId={id} stagedId={staged} />;
}
