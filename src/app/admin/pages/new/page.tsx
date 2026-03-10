import Link from "next/link";

import { Button, Card, Checkbox, Input, Label, Textarea } from "@/components/ui";
import { createPage } from "../actions";

export const runtime = "nodejs";

export default function NewCmsPage() {
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold tracking-tight text-[var(--hw-ink)]">New page</h1>
        <Link href="/admin/pages" className="text-sm font-semibold text-[var(--hw-muted)]">
          Back
        </Link>
      </div>

      <Card className="p-6">
        <form action={createPage} className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder="e.g. About" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" required placeholder="e.g. about" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="body">Body (optional)</Label>
            <Textarea id="body" name="body" placeholder="MVP: plain text" />
          </div>

          <Checkbox name="published" label="Published" />

          <div className="flex gap-3">
            <Button type="submit">Create</Button>
            <Link href="/admin/pages">
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
