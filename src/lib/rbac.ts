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
