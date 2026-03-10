import { Suspense } from "react";

import { Container } from "@/components/ui";
import { SiteHeader, SiteFooter } from "@/components/site-shell";
import { EstimateClient } from "@/app/estimate/EstimateClient";

export default function EstimatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
          <SiteHeader />
          <main>
            <Container className="py-12">
              <div className="h-10 w-64 rounded-2xl hw-shimmer" />
              <div className="mt-4 h-5 w-96 max-w-full rounded-2xl hw-shimmer" />
              <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="h-96 rounded-2xl hw-shimmer lg:col-span-7" />
                <div className="h-96 rounded-2xl hw-shimmer lg:col-span-5" />
              </div>
            </Container>
          </main>
          <SiteFooter />
        </div>
      }
    >
      <EstimateClient />
    </Suspense>
  );
}
