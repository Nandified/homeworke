import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button, Card, Container, Pill } from "@/components/ui";
import { CmsBody } from "@/components/cms-body";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { getPublishedPageBySlug } from "@/lib/cms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const neighborhoods = [
  "West Loop",
  "River North",
  "Wicker Park",
  "Logan Square",
  "Lakeview",
  "Lincoln Park",
  "South Loop",
  "Hyde Park",
];

export default async function ChicagoPage() {
  const cms = await getPublishedPageBySlug("chicago");
  if (cms?.body) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
        <SiteHeader />
        <main>
          <Container className="py-12">
            <div className="max-w-3xl">
              <h1 className="text-balance text-4xl font-extrabold tracking-tight text-[var(--hw-ink)]">{cms.title}</h1>
              <div className="mt-6">
                <CmsBody body={cms.body} />
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/estimate">
                  <Button>
                    Get an Instant Estimate
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/work-order">
                  <Button variant="secondary">Browse services</Button>
                </Link>
              </div>
            </div>
          </Container>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <SiteHeader />

      <main>
        <Container className="py-12">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2">
              <Pill>Chicago-first</Pill>
              <Pill>Free estimates</Pill>
              <Pill>Local pros</Pill>
            </div>

            <h1 className="mt-6 text-balance text-4xl font-extrabold tracking-tight text-[var(--hw-ink)]">Chicago service area</h1>
            <p className="mt-4 text-pretty text-base leading-7 text-[var(--hw-muted)]">
              We’re focused on Chicago to deliver a better experience: faster scheduling, better routing, and a higher-quality local provider network.
            </p>

            <Card className="mt-8 p-6">
              <div className="text-sm font-semibold text-[var(--hw-ink)]">Popular neighborhoods</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {neighborhoods.map((n) => (
                  <span
                    key={n}
                    className="rounded-full border border-[var(--hw-line)] bg-white px-3 py-2 text-xs font-medium text-[var(--hw-muted)]"
                  >
                    {n}
                  </span>
                ))}
              </div>
              <div className="mt-4 text-sm text-[var(--hw-muted)]">Not listed? Submit your request — we’ll confirm coverage nearby.</div>
            </Card>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/estimate">
                <Button>
                  Get an Instant Estimate
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/services">
                <Button variant="secondary">Browse services</Button>
              </Link>
            </div>
          </div>
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}
