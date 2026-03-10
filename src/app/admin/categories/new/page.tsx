import Link from "next/link";

import { Button, Card, Input, Label, Textarea } from "@/components/ui";
import { createCategory } from "../actions";

export const runtime = "nodejs";

export default function NewCategoryPage() {
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold tracking-tight text-[var(--hw-ink)]">New category</h1>
        <Link href="/admin/categories" className="text-sm font-semibold text-[var(--hw-muted)]">
          Back
        </Link>
      </div>

      <Card className="p-6">
        <form action={createCategory} className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required placeholder="e.g. Maintenance" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" required placeholder="e.g. maintenance" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sortOrder">Sort order</Label>
            <Input id="sortOrder" name="sortOrder" type="number" defaultValue={0} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" name="description" />
          </div>

          <div className="flex gap-3">
            <Button type="submit">Create</Button>
            <Link href="/admin/categories">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
