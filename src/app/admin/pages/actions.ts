"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { requireAdmin, requirePageEditorOrAdmin } from "@/lib/rbac";

export async function createPage(formData: FormData) {
  await requireAdmin();

  const title = String(formData.get("title") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  if (!title || !slug) throw new Error("title and slug required");

  const published = Boolean(formData.get("published"));
  const publishedAt = published ? new Date() : null;

  await db().page.create({
    data: {
      title,
      slug,
      body: String(formData.get("body") || "").trim() || null,
      published,
      publishedAt,
    },
  });

  revalidatePath("/admin/pages");
  redirect("/admin/pages");
}

export async function updatePage(id: string, formData: FormData) {
  const actor = await requirePageEditorOrAdmin(id);

  const title = String(formData.get("title") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  if (!title || !slug) throw new Error("title and slug required");

  const published = Boolean(formData.get("published"));
  const existing = await db().page.findUnique({ where: { id } });
  const publishedAt = published ? existing?.publishedAt || new Date() : null;

  await db().page.update({
    where: { id },
    data: {
      title,
      slug,
      body: String(formData.get("body") || "").trim() || null,
      published,
      publishedAt,
    },
  });

  // Admin-only: assign editors (comma-separated emails)
  if (actor.role === "ADMIN") {
    const raw = String(formData.get("editorEmails") || "").trim();
    const emails = raw
      ? raw
          .split(/[,\n]/g)
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean)
      : [];

    const users = emails.length
      ? await db().user.findMany({ where: { email: { in: emails } }, select: { id: true, email: true } })
      : [];
    const userIds = new Set(users.map((u) => u.id));

    await db().pageEditor.deleteMany({ where: { pageId: id, userId: { notIn: Array.from(userIds) } } });
    for (const u of users) {
      await db().pageEditor.upsert({
        where: { pageId_userId: { pageId: id, userId: u.id } },
        update: {},
        create: { pageId: id, userId: u.id },
      });
    }
  }

  revalidatePath("/admin/pages");
  redirect("/admin/pages");
}

export async function deletePage(id: string) {
  await requirePageEditorOrAdmin(id);
  await db().page.delete({ where: { id } });
  revalidatePath("/admin/pages");
  redirect("/admin/pages");
}
