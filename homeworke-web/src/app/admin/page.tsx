import Link from "next/link";

import { Button, Card, Container } from "@/components/ui";
import { SiteHeader, SiteFooter } from "@/components/site-shell";

export default function AdminHome() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <SiteHeader />
      <main>
        <Container className="py-12">
          <div className="max-w-3xl">
            <h1 className="text-balance text-4xl font-extrabold tracking-tight text-[var(--hw-ink)]">Admin (preview)</h1>
            <p className="mt-4 text-pretty text-base leading-7 text-[var(--hw-muted)]">
              This is a deployed preview of the CMS admin routes so links don’t 404. Full CMS editing + roles + publishing will be enabled
              once the app is connected to the database.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="p-6">
              <div className="text-sm font-semibold text-[var(--hw-ink)]">Services</div>
              <div className="mt-2 text-sm text-[var(--hw-muted)]">Preview the service list used for /services/*.</div>
              <div className="mt-4">
                <Link href="/admin/services">
                  <Button>View services</Button>
                </Link>
              </div>
            </Card>
            <Card className="p-6">
              <div className="text-sm font-semibold text-[var(--hw-ink)]">Categories</div>
              <div className="mt-2 text-sm text-[var(--hw-muted)]">Coming next (DB-backed taxonomy).</div>
              <div className="mt-4">
                <Link href="/admin/categories">
                  <Button variant="ghost">View categories</Button>
                </Link>
              </div>
            </Card>
            <Card className="p-6">
              <div className="text-sm font-semibold text-[var(--hw-ink)]">Pages</div>
              <div className="mt-2 text-sm text-[var(--hw-muted)]">Coming next (DB-backed homepage & marketing pages).</div>
              <div className="mt-4">
                <Link href="/admin/pages">
                  <Button variant="ghost">View pages</Button>
                </Link>
              </div>
            </Card>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
