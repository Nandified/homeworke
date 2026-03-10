import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card, Container, Button } from "@/components/ui";
import { iconFor } from "@/components/icons";
import { SiteHeader, SiteFooter } from "@/components/site-shell";

import { listPublishedServices } from "@/lib/cms";

export const runtime = "nodejs";

export default async function ServicesPage() {
  const services = await listPublishedServices();
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <SiteHeader />

      <main>
        <Container className="py-12">
          <div className="max-w-2xl">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--hw-muted)]">Services</div>
            <h1 className="mt-3 text-balance text-4xl font-extrabold tracking-tight text-[var(--hw-ink)]">Pick a service</h1>
            <p className="mt-4 text-pretty text-base leading-7 text-[var(--hw-muted)]">
              Chicago-first home services. Start with a free instant estimate — then we’ll help you schedule with a vetted local pro.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => {
              const Icon = iconFor(s.icon);
              return (
                <Link key={s.slug} href={`/services/${s.slug}`} className="group">
                  <Card className="h-full p-6 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(17,24,39,.08)]">
                    <div className="flex items-start gap-3">
                      <div className="rounded-[var(--hw-radius)] border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.08)] p-2">
                        <Icon className="h-5 w-5 text-[var(--hw-red)]" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-[var(--hw-ink)]">{s.name}</div>
                        <div className="mt-1 text-sm leading-6 text-[var(--hw-muted)]">{s.summary}</div>
                        <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--hw-red)]">
                          Get an instant estimate
                          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>

          <div className="mt-10">
            <Link href="/estimate">
              <Button>
                Get an Instant Estimate
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}
