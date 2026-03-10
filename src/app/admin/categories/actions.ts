"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";

export async function createCategory(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  if (!name || !slug) throw new Error("name and slug required");

  const sortOrderRaw = String(formData.get("sortOrder") || "0");
  const sortOrder = Number.isFinite(Number(sortOrderRaw)) ? Number(sortOrderRaw) : 0;

  await db().serviceCategory.create({
    data: {
      name,
      slug,
      description: String(formData.get("description") || "").trim() || null,
      sortOrder,
    },
  });

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function updateCategory(id: string, formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  if (!name || !slug) throw new Error("name and slug required");

  const sortOrderRaw = String(formData.get("sortOrder") || "0");
  const sortOrder = Number.isFinite(Number(sortOrderRaw)) ? Number(sortOrderRaw) : 0;

  await db().serviceCategory.update({
    where: { id },
    data: {
      name,
      slug,
      description: String(formData.get("description") || "").trim() || null,
      sortOrder,
    },
  });

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  await db().serviceCategory.delete({ where: { id } });
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}
