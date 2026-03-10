import Link from "next/link";
import type { ReactNode } from "react";

import { Container, Divider } from "@/components/ui";
import { requireCmsUser } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminLayout(props: { children: ReactNode }) {
  await requireCmsUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <header className="border-b border-[var(--hw-line)] bg-white">
        <Container className="py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-extrabold tracking-tight text-[var(--hw-ink)]">Admin</div>
            <nav className="flex flex-wrap gap-4 text-sm font-semibold">
              <Link href="/admin/dashboard" className="text-[var(--hw-ink)] hover:text-[var(--hw-red)]">
                Dashboard
              </Link>
              <Link href="/admin/services" className="text-[var(--hw-ink)] hover:text-[var(--hw-red)]">
                Services
              </Link>
              <Link href="/admin/categories" className="text-[var(--hw-ink)] hover:text-[var(--hw-red)]">
                Categories
              </Link>
              <Link href="/admin/pages" className="text-[var(--hw-ink)] hover:text-[var(--hw-red)]">
                Pages
              </Link>
            </nav>
          </div>
        </Container>
        <Divider />
      </header>

      <main>
        <Container className="py-10">{props.children}</Container>
      </main>
    </div>
  );
}
