import Link from "next/link";
import { notFound } from "next/navigation";

import { Button, Card, Checkbox, Input, Label, Textarea, Divider } from "@/components/ui";
import { dbEnabled, db } from "@/lib/db";
import { getCurrentUser } from "@/lib/rbac";
import { deleteService, updateService } from "../actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function examplesToTextarea(examples: unknown) {
  if (!examples) return "";
  if (Array.isArray(examples)) return examples.map((x) => String(x)).join("\n");
  return JSON.stringify(examples, null, 2);
}

export default async function EditServicePage({ params }: { params: { id: string } }) {
  if (!dbEnabled()) {
    return <div className="text-sm text-[var(--hw-muted)]">DATABASE_URL not set.</div>;
  }

  const service = await db().service.findUnique({
    where: { id: params.id },
    include: { editors: { include: { user: true } } },
  });
  if (!service) return notFound();

  const actor = await getCurrentUser();
  const editorEmails = service.editors.map((e) => e.user.email).join(", ");

  const categories = await db().serviceCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-[var(--hw-ink)]">Edit service</h1>
          <div className="mt-1 text-sm text-[var(--hw-muted)]">/{service.slug}</div>
        </div>
        <Link href="/admin/services" className="text-sm font-semibold text-[var(--hw-muted)]">
          Back
        </Link>
      </div>

      <Card className="p-6">
        <form action={updateService.bind(null, service.id)} className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required defaultValue={service.title} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" required defaultValue={service.slug} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="categoryId">Category</Label>
            <select
              id="categoryId"
              name="categoryId"
              className="h-11 w-full rounded-[var(--hw-radius-sm)] border border-[var(--hw-line)] bg-white px-3.5 text-sm"
              defaultValue={service.categoryId || ""}
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
            <Input id="icon" name="icon" defaultValue={service.icon || ""} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="summary">Summary (optional)</Label>
            <Textarea id="summary" name="summary" defaultValue={service.summary || ""} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="examples">Examples (optional)</Label>
            <Textarea id="examples" name="examples" defaultValue={examplesToTextarea(service.examples)} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" name="notes" defaultValue={service.notes || ""} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="body">Body (optional)</Label>
            <Textarea id="body" name="body" defaultValue={service.body || ""} />
          </div>

          <Checkbox name="published" label="Published" defaultChecked={service.published} />

          {actor?.role === "ADMIN" ? (
            <div className="grid gap-2">
              <Label htmlFor="editorEmails">Assigned editor emails (Admin-only)</Label>
              <Input
                id="editorEmails"
                name="editorEmails"
                placeholder="editor1@..., editor2@..."
                defaultValue={editorEmails}
              />
              <div className="text-xs text-[var(--hw-muted)]">Editors must already exist as users. Separate by comma or newline.</div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button type="submit">Save</Button>
            <Link href={`/services/${service.slug}`}>
              <Button type="button" variant="secondary">
                View
              </Button>
            </Link>
            <Link href="/admin/services">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
          </div>
        </form>

        <Divider className="my-6" />

        <form action={deleteService.bind(null, service.id)}>
          <Button variant="destructive" type="submit">
            Delete
          </Button>
        </form>
      </Card>
    </div>
  );
}
