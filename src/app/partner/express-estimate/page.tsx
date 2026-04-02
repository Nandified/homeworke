import { ExpressEstimateClient } from "@/components/partner/ExpressEstimateClient";

export default function PartnerExpressEstimatePage() {
  return <ExpressEstimateClient basePath="/partner" role="PARTNER" title="Instant Estimate" />;
}
