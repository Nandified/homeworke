import Link from "next/link";
import { notFound } from "next/navigation";

import { Button, Card, Divider, Input, Label, Textarea } from "@/components/ui";
import { dbEnabled, db } from "@/lib/db";
import { deleteCategory, updateCategory } from "../actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EditCategoryPage({ params }: { params: { id: string } }) {
  if (!dbEnabled()) {
    return <div className="text-sm text-[var(--hw-muted)]">DATABASE_URL not set.</div>;
  }

  const category = await db().serviceCategory.findUnique({ where: { id: params.id } });
  if (!category) return notFound();

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-[var(--hw-ink)]">Edit category</h1>
          <div className="mt-1 text-sm text-[var(--hw-muted)]">/{category.slug}</div>
        </div>
        <Link href="/admin/categories" className="text-sm font-semibold text-[var(--hw-muted)]">
          Back
        </Link>
      </div>

      <Card className="p-6">
        <form action={updateCategory.bind(null, category.id)} className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required defaultValue={category.name} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" required defaultValue={category.slug} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sortOrder">Sort order</Label>
            <Input id="sortOrder" name="sortOrder" type="number" defaultValue={category.sortOrder} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" name="description" defaultValue={category.description || ""} />
          </div>

          <div className="flex gap-3">
            <Button type="submit">Save</Button>
            <Link href="/admin/categories">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
          </div>
        </form>

        <Divider className="my-6" />

        <form action={deleteCategory.bind(null, category.id)}>
          <Button variant="destructive" type="submit">
            Delete
          </Button>
        </form>
      </Card>
    </div>
  );
}
