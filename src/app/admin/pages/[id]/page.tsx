import Link from "next/link";
import { notFound } from "next/navigation";

import { Button, Card, Checkbox, Divider, Input, Label, Textarea } from "@/components/ui";
import { dbEnabled, db } from "@/lib/db";
import { getCurrentUser } from "@/lib/rbac";
import { deletePage, updatePage } from "../actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EditCmsPage({ params }: { params: { id: string } }) {
  if (!dbEnabled()) {
    return <div className="text-sm text-[var(--hw-muted)]">DATABASE_URL not set.</div>;
  }

  const page = await db().page.findUnique({ where: { id: params.id }, include: { editors: { include: { user: true } } } });
  if (!page) return notFound();

  const actor = await getCurrentUser();
  const editorEmails = page.editors.map((e) => e.user.email).join(", ");

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-[var(--hw-ink)]">Edit page</h1>
          <div className="mt-1 text-sm text-[var(--hw-muted)]">/{page.slug}</div>
        </div>
        <Link href="/admin/pages" className="text-sm font-semibold text-[var(--hw-muted)]">
          Back
        </Link>
      </div>

      <Card className="p-6">
        <form action={updatePage.bind(null, page.id)} className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required defaultValue={page.title} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" required defaultValue={page.slug} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="body">Body (optional)</Label>
            <Textarea id="body" name="body" defaultValue={page.body || ""} />
          </div>

          <Checkbox name="published" label="Published" defaultChecked={page.published} />

          {actor?.role === "ADMIN" ? (
            <div className="grid gap-2">
              <Label htmlFor="editorEmails">Assigned editor emails (Admin-only)</Label>
              <Input id="editorEmails" name="editorEmails" placeholder="editor1@..., editor2@..." defaultValue={editorEmails} />
              <div className="text-xs text-[var(--hw-muted)]">Editors must already exist as users. Separate by comma or newline.</div>
            </div>
          ) : null}

          <div className="flex gap-3">
            <Button type="submit">Save</Button>
            <Link href="/admin/pages">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
          </div>
        </form>

        <Divider className="my-6" />

        <form action={deletePage.bind(null, page.id)}>
          <Button variant="destructive" type="submit">
            Delete
          </Button>
        </form>
      </Card>
    </div>
  );
}
