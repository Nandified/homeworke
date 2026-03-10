import { redirect } from "next/navigation";

import { dbEnabled, db } from "@/lib/db";
import { getCurrentUser } from "@/lib/rbac";

export const runtime = "nodejs";

export default async function OfficeLayout(props: { children: React.ReactNode }) {
  // Phase 2 fast-track:
  // - When DB is enabled: require an authenticated user who belongs to at least one office (or is global ADMIN).
  // - When DB is not enabled: allow access so portal shells stay demo-able.
  if (!dbEnabled()) return props.children;

  const user = await getCurrentUser();
  if (!user) redirect("/?auth=required");
  if (user.role === "ADMIN") return props.children;

  const hasMembership = await db().officeMembership.findFirst({ where: { userId: user.id } });
  if (!hasMembership) redirect("/?office=forbidden");

  return props.children;
}
