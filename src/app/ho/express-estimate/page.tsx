import { ExpressEstimateClient } from "@/components/partner/ExpressEstimateClient";
import { HO_NAV } from "@/components/ho/nav";

export default function HomeownerExpressEstimatePage() {
  return <ExpressEstimateClient basePath="/ho" role="HO" title="Instant Estimate" nav={HO_NAV as any} />;
}
