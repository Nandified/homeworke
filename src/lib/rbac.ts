import { redirect } from "next/navigation";

import { dbEnabled, db } from "@/lib/db";
import { getSessionTokenFromCookie, getSessionUserId } from "@/lib/session";

export async function getCurrentUser() {
  if (!dbEnabled()) return null;
  const token = await getSessionTokenFromCookie();
  if (!token) return null;
  const userId = await getSessionUserId(token);
  if (!userId) return null;
  return db().user.findUnique({ where: { id: userId } });
}

export async function requireAdmin() {
  if (!dbEnabled()) redirect("/?admin=db-required");
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/?admin=forbidden");
  return user;
}

export async function requireCmsUser() {
  if (!dbEnabled()) redirect("/?admin=db-required");
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "EDITOR")) redirect("/?admin=forbidden");
  return user;
}

export async function requireOfficeMember(input?: { officeSlug?: string; officeId?: string }) {
  if (!dbEnabled()) redirect("/?admin=db-required");
  const user = await getCurrentUser();
  if (!user) redirect("/?admin=forbidden");
  if (user.role === "ADMIN") return user;

  const office = input?.officeId
    ? await db().office.findUnique({ where: { id: input.officeId } })
    : input?.officeSlug
      ? await db().office.findUnique({ where: { slug: input.officeSlug } })
      : null;

  if (!office) redirect("/?office=missing");

  const membership = await db().officeMembership.findUnique({ where: { officeId_userId: { officeId: office.id, userId: user.id } } });
  if (!membership) redirect("/?office=forbidden");

  return user;
}

export async function requireOfficeAdmin(input?: { officeSlug?: string; officeId?: string }) {
  if (!dbEnabled()) redirect("/?admin=db-required");
  const user = await getCurrentUser();
  if (!user) redirect("/?admin=forbidden");
  if (user.role === "ADMIN") return user;

  const office = input?.officeId
    ? await db().office.findUnique({ where: { id: input.officeId } })
    : input?.officeSlug
      ? await db().office.findUnique({ where: { slug: input.officeSlug } })
      : null;

  if (!office) redirect("/?office=missing");

  const membership = await db().officeMembership.findUnique({ where: { officeId_userId: { officeId: office.id, userId: user.id } } });
  if (!membership || membership.role !== "ADMIN") redirect("/?office=forbidden");

  return user;
}

export async function requireServiceEditorOrAdmin(serviceId: string) {
  if (!dbEnabled()) redirect("/?admin=db-required");
  const user = await getCurrentUser();
  if (!user) redirect("/?admin=forbidden");
  if (user.role === "ADMIN") return user;
  const row = await db().serviceEditor.findUnique({ where: { serviceId_userId: { serviceId, userId: user.id } } });
  if (!row) redirect("/?admin=forbidden");
  return user;
}

export async function requirePageEditorOrAdmin(pageId: string) {
  if (!dbEnabled()) redirect("/?admin=db-required");
  const user = await getCurrentUser();
  if (!user) redirect("/?admin=forbidden");
  if (user.role === "ADMIN") return user;
  const row = await db().pageEditor.findUnique({ where: { pageId_userId: { pageId, userId: user.id } } });
  if (!row) redirect("/?admin=forbidden");
  return user;
}
