import { redirect } from "next/navigation";

// Back-compat: legacy /sp/dashboard routes to the new IA.
export default function ServiceProviderDashboardRedirect() {
  redirect("/sp/find-work");
}
