import { ExpressEstimateClient } from "@/components/partner/ExpressEstimateClient";

// Back-compat alias: /pro/* will be replaced by /partner/*
export default function ProExpressEstimateAliasPage() {
  return <ExpressEstimateClient basePath="/pro" role="PRO" title="Express Estimate" />;
}
