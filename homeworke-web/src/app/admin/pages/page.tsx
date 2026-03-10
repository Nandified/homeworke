import Link from "next/link";

import { Container } from "@/components/ui";
import { SiteFooter, SiteHeader } from "@/components/site-shell";

export default function AdminPagesPreview() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <SiteHeader />
      <main>
        <Container className="py-12">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">Pages</h1>
            <Link href="/admin" className="text-sm font-semibold text-[var(--hw-muted)]">
              Back
            </Link>
          </div>
          <p className="mt-4 text-sm text-[var(--hw-muted)]">
            Page editing (home/how-it-works/chicago/services) will be DB-backed in the full CMS. This page exists so the
            /admin/pages link doesn’t 404 in the deployed preview.
          </p>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
