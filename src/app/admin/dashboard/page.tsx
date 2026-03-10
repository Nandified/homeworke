import Link from "next/link";

import { Button, Card, Pill, StatTile } from "@/components/ui";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { dbEnabled, db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  if (!dbEnabled()) {
    return (
      <div className="grid gap-6">
        <DashboardSection
          title="Admin dashboard"
          description="DB disabled (no DATABASE_URL). You can still navigate CMS sections."
          meta={<Pill>dbEnabled=false</Pill>}
        >
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
        </DashboardSection>
      </div>
    );
  }

  const [users, partners, workOrders] = await Promise.all([
    db().user.count(),
    db().partnerProfile.count(),
    db().workOrder.count(),
  ]);

  return (
    <div className="grid gap-6">
      <DashboardSection
        title="Admin dashboard"
        description="Phase 2: basic operational counters."
        meta={<Pill>dbEnabled=true</Pill>}
      >
        <KpiGrid className="md:grid-cols-3 lg:grid-cols-3">
          <StatTile label="Users" value={String(users)} />
          <StatTile label="Partners" value={String(partners)} />
          <StatTile label="Work orders" value={String(workOrders)} />
        </KpiGrid>
      </DashboardSection>

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
    </div>
  );
}
