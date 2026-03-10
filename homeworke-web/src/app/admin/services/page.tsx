import Link from "next/link";

import { Card, Container } from "@/components/ui";
import { SiteFooter, SiteHeader } from "@/components/site-shell";

import servicesData from "@/content/services.json";

export default function AdminServicesPreview() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <SiteHeader />
      <main>
        <Container className="py-12">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--hw-ink)]">Services (preview)</h1>
            <Link href="/admin" className="text-sm font-semibold text-[var(--hw-muted)]">
              Back
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {servicesData.services.map((s) => (
              <Card key={s.slug} className="p-6">
                <div className="text-sm font-semibold text-[var(--hw-ink)]">{s.name}</div>
                <div className="mt-2 text-sm text-[var(--hw-muted)]">/{s.slug}</div>
                <div className="mt-4 text-sm">
                  <Link className="font-semibold text-[var(--hw-red)]" href={`/services/${s.slug}`}>
                    View live page
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
