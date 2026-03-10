import Link from "next/link";

import { Button, Card, EmptyState } from "@/components/ui";
import { dbEnabled, db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  if (!dbEnabled()) {
    return <div className="text-sm text-[var(--hw-muted)]">DATABASE_URL not set.</div>;
  }

  const categories = await db().serviceCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold tracking-tight text-[var(--hw-ink)]">Categories</h1>
        <Link href="/admin/categories/new">
          <Button>New category</Button>
        </Link>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          text="Create categories to organize services."
          action={
            <Link href="/admin/categories/new">
              <Button>New category</Button>
            </Link>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="grid grid-cols-[1fr_140px_140px] gap-3 border-b border-[var(--hw-line)] bg-[var(--hw-soft)] px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--hw-muted)]">
            <div>Name</div>
            <div>Sort</div>
            <div className="text-right">Actions</div>
          </div>
          <div className="divide-y divide-[var(--hw-line)]">
            {categories.map((c) => (
              <div key={c.id} className="grid grid-cols-[1fr_140px_140px] items-center gap-3 px-5 py-4">
                <div>
                  <div className="text-sm font-semibold text-[var(--hw-ink)]">{c.name}</div>
                  <div className="mt-0.5 text-sm text-[var(--hw-muted)]">/{c.slug}</div>
                </div>
                <div className="text-sm font-semibold text-[var(--hw-muted)]">{c.sortOrder}</div>
                <div className="text-right">
                  <Link href={`/admin/categories/${c.id}`} className="text-sm font-semibold text-[var(--hw-ink)]">
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
