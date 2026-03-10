import Link from "next/link";

import { Card, Button } from "@/components/ui";

export default function AdminHomePage() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card className="p-6">
        <div className="text-sm font-semibold text-[var(--hw-ink)]">Services</div>
        <div className="mt-2 text-sm text-[var(--hw-muted)]">Create and publish service detail pages.</div>
        <div className="mt-4">
          <Link href="/admin/services">
            <Button>Manage services</Button>
          </Link>
        </div>
      </Card>
      <Card className="p-6">
        <div className="text-sm font-semibold text-[var(--hw-ink)]">Categories</div>
        <div className="mt-2 text-sm text-[var(--hw-muted)]">Organize services by category.</div>
        <div className="mt-4">
          <Link href="/admin/categories">
            <Button>Manage categories</Button>
          </Link>
        </div>
      </Card>
      <Card className="p-6">
        <div className="text-sm font-semibold text-[var(--hw-ink)]">Pages</div>
        <div className="mt-2 text-sm text-[var(--hw-muted)]">Manage basic CMS pages (MVP).</div>
        <div className="mt-4">
          <Link href="/admin/pages">
            <Button>Manage pages</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
