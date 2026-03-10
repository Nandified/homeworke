import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { Button, Card, Container, Pill } from "@/components/ui";
import { iconFor } from "@/components/icons";
import { SiteFooter, SiteHeader } from "@/components/site-shell";

import { getPublishedServiceBySlug } from "@/lib/cms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ServiceDetailPage({ params }: { params: { slug: string } }) {
  const service = await getPublishedServiceBySlug(params.slug);
  if (!service) return notFound();

  const Icon = iconFor(service.icon);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <SiteHeader ctaHref={`/estimate?service=${encodeURIComponent(service.slug)}`} />

      <main>
        <Container className="py-12">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2">
              <Pill>Chicago-first</Pill>
              <Pill>Free instant estimate</Pill>
              <Pill>Vetted pros</Pill>
            </div>

            <div className="mt-6 flex items-start gap-4">
              <div className="rounded-[var(--hw-radius)] border border-[rgba(229,57,53,.18)] bg-[rgba(229,57,53,.08)] p-3">
                <Icon className="h-6 w-6 text-[var(--hw-red)]" />
              </div>
              <div>
                <h1 className="text-balance text-4xl font-extrabold tracking-tight text-[var(--hw-ink)]">{service.name}</h1>
                <p className="mt-3 text-pretty text-base leading-7 text-[var(--hw-muted)]">{service.summary}</p>
              </div>
            </div>

            <Card className="mt-8 p-6">
              <div className="text-sm font-semibold text-[var(--hw-ink)]">Common requests</div>
              <ul className="mt-3 grid list-disc gap-2 pl-5 text-sm text-[var(--hw-muted)] sm:grid-cols-2">
                {service.examples.map((e: string) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
              <div className="mt-5 rounded-[var(--hw-radius)] border border-[var(--hw-line)] bg-[var(--hw-soft)] p-4 text-sm text-[var(--hw-muted)]">
                {service.notes}
              </div>
            </Card>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/estimate?service=${encodeURIComponent(service.slug)}`}>
                <Button>
                  Get an Instant Estimate
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/services">
                <Button variant="secondary">Back to services</Button>
              </Link>
            </div>
          </div>
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}
