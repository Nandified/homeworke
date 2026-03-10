import Link from "next/link";

import { Button, Card, Checkbox, Input, Label, Textarea } from "@/components/ui";
import { dbEnabled, db } from "@/lib/db";
import { createService } from "../actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function NewServicePage() {
  if (!dbEnabled()) {
    return <div className="text-sm text-[var(--hw-muted)]">DATABASE_URL not set.</div>;
  }

  const categories = await db().serviceCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold tracking-tight text-[var(--hw-ink)]">New service</h1>
        <Link href="/admin/services" className="text-sm font-semibold text-[var(--hw-muted)]">
          Back
        </Link>
      </div>

      <Card className="p-6">
        <form action={createService} className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder="e.g. Plumbing" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" required placeholder="e.g. plumbing" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="categoryId">Category</Label>
            <select
              id="categoryId"
              name="categoryId"
              className="h-11 w-full rounded-[var(--hw-radius-sm)] border border-[var(--hw-line)] bg-white px-3.5 text-sm"
              defaultValue=""
            >
              <option value="">(none)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="icon">Icon (optional)</Label>
            <Input id="icon" name="icon" placeholder="matches iconFor() keys" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="summary">Summary (optional)</Label>
            <Textarea id="summary" name="summary" placeholder="Short description used on the services list" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="examples">Examples (optional)</Label>
            <Textarea id="examples" name="examples" placeholder="One per line (or paste JSON array)" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" name="notes" placeholder="Small disclaimer / helper text" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="body">Body (optional)</Label>
            <Textarea id="body" name="body" placeholder="MVP: plain text" />
          </div>

          <Checkbox name="published" label="Published" />

          <div className="flex gap-3">
            <Button type="submit">Create</Button>
            <Link href="/admin/services">
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
