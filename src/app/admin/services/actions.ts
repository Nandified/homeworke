"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { requireAdmin, requireServiceEditorOrAdmin } from "@/lib/rbac";

function parseExamples(raw: string | null) {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];
  try {
    const asJson = JSON.parse(trimmed);
    if (Array.isArray(asJson)) return asJson;
  } catch {
    // fall through
  }
  return trimmed
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export async function createService(formData: FormData) {
  await requireAdmin();

  const title = String(formData.get("title") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  if (!title || !slug) throw new Error("title and slug required");

  const published = Boolean(formData.get("published"));
  const publishedAt = published ? new Date() : null;

  const categoryId = String(formData.get("categoryId") || "").trim() || null;

  await db().service.create({
    data: {
      title,
      slug,
      icon: String(formData.get("icon") || "").trim() || null,
      summary: String(formData.get("summary") || "").trim() || null,
      notes: String(formData.get("notes") || "").trim() || null,
      body: String(formData.get("body") || "").trim() || null,
      examples: parseExamples(formData.get("examples") as string | null),
      published,
      publishedAt,
      categoryId,
    },
  });

  revalidatePath("/services");
  revalidatePath("/admin/services");
  redirect("/admin/services");
}

export async function updateService(id: string, formData: FormData) {
  const actor = await requireServiceEditorOrAdmin(id);

  const title = String(formData.get("title") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  if (!title || !slug) throw new Error("title and slug required");

  const published = Boolean(formData.get("published"));
  const existing = await db().service.findUnique({ where: { id } });
  const publishedAt = published ? existing?.publishedAt || new Date() : null;

  const categoryId = String(formData.get("categoryId") || "").trim() || null;

  await db().service.update({
    where: { id },
    data: {
      title,
      slug,
      icon: String(formData.get("icon") || "").trim() || null,
      summary: String(formData.get("summary") || "").trim() || null,
      notes: String(formData.get("notes") || "").trim() || null,
      body: String(formData.get("body") || "").trim() || null,
      examples: parseExamples(formData.get("examples") as string | null),
      published,
      publishedAt,
      categoryId,
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

    await db().serviceEditor.deleteMany({ where: { serviceId: id, userId: { notIn: Array.from(userIds) } } });
    for (const u of users) {
      await db().serviceEditor.upsert({
        where: { serviceId_userId: { serviceId: id, userId: u.id } },
        update: {},
        create: { serviceId: id, userId: u.id },
      });
    }
  }

  revalidatePath("/services");
  revalidatePath(`/services/${slug}`);
  revalidatePath("/admin/services");
  redirect("/admin/services");
}

export async function deleteService(id: string) {
  await requireServiceEditorOrAdmin(id);
  await db().service.delete({ where: { id } });
  revalidatePath("/services");
  revalidatePath("/admin/services");
  redirect("/admin/services");
}
