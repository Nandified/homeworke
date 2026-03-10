import { PartnerDashboardClient } from "@/components/dashboards/PartnerDashboardClient";

// Back-compat alias: /pro/* will be replaced by /partner/*
export default function ProDashboardAliasPage() {
  return <PartnerDashboardClient basePath="/pro" title="Real Estate Pro" />;
}
