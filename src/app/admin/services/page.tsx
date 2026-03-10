import Link from "next/link";

import { Button, Card, EmptyState } from "@/components/ui";
import { dbEnabled, db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  if (!dbEnabled()) {
    return <div className="text-sm text-[var(--hw-muted)]">DATABASE_URL not set.</div>;
  }

  const services = await db().service.findMany({
    orderBy: [{ updatedAt: "desc" }],
  });

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold tracking-tight text-[var(--hw-ink)]">Services</h1>
        <Link href="/admin/services/new">
          <Button>New service</Button>
        </Link>
      </div>

      {services.length === 0 ? (
        <EmptyState
          title="No services yet"
          text="Create your first service page."
          action={
            <Link href="/admin/services/new">
              <Button>New service</Button>
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
            {services.map((s) => (
              <div key={s.id} className="grid grid-cols-[1fr_160px_140px] items-center gap-3 px-5 py-4">
                <div>
                  <div className="text-sm font-semibold text-[var(--hw-ink)]">{s.title}</div>
                  <div className="mt-0.5 text-sm text-[var(--hw-muted)]">/{s.slug}</div>
                </div>
                <div className="text-sm font-semibold">
                  {s.published ? (
                    <span className="text-emerald-700">Published</span>
                  ) : (
                    <span className="text-[var(--hw-muted)]">Draft</span>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Link href={`/services/${s.slug}`} className="text-sm font-semibold text-[var(--hw-red)]">
                    View
                  </Link>
                  <Link href={`/admin/services/${s.id}`} className="text-sm font-semibold text-[var(--hw-ink)]">
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
