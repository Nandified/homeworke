import Link from "next/link";

import { Button, Card, EmptyState } from "@/components/ui";
import { dbEnabled, db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminPagesPage() {
  if (!dbEnabled()) {
    return <div className="text-sm text-[var(--hw-muted)]">DATABASE_URL not set.</div>;
  }

  const pages = await db().page.findMany({ orderBy: [{ updatedAt: "desc" }] });

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold tracking-tight text-[var(--hw-ink)]">Pages</h1>
        <Link href="/admin/pages/new">
          <Button>New page</Button>
        </Link>
      </div>

      {pages.length === 0 ? (
        <EmptyState
          title="No pages yet"
          text="Create a basic CMS page (MVP)."
          action={
            <Link href="/admin/pages/new">
              <Button>New page</Button>
            </Link>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="grid grid-cols-[1fr_160px_140px] gap-3 border-b border-[var(--hw-line)] bg-[var(--hw-soft)] px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--hw-muted)]">
            <div>Title</div>
            <div>Status</div>
            <div className="text-right">Actions</div>
          </div>
          <div className="divide-y divide-[var(--hw-line)]">
            {pages.map((p) => (
              <div key={p.id} className="grid grid-cols-[1fr_160px_140px] items-center gap-3 px-5 py-4">
                <div>
                  <div className="text-sm font-semibold text-[var(--hw-ink)]">{p.title}</div>
                  <div className="mt-0.5 text-sm text-[var(--hw-muted)]">/{p.slug}</div>
                </div>
                <div className="text-sm font-semibold">
                  {p.published ? (
                    <span className="text-emerald-700">Published</span>
                  ) : (
                    <span className="text-[var(--hw-muted)]">Draft</span>
                  )}
                </div>
                <div className="text-right">
                  <Link href={`/admin/pages/${p.id}`} className="text-sm font-semibold text-[var(--hw-ink)]">
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
