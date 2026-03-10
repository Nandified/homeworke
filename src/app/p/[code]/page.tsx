"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import { Card, Container, Pill } from "@/components/ui";

const STORAGE_KEY = "hw3_partner_context_v1";

type PartnerContext = {
  partnerId: string;
  partnerName: string;
  partnerType: string;
  officeName: string;
  createdAt: string;
};

function resolvePartner(code: string): PartnerContext | null {
  const c = code.toLowerCase();
  if (c === "frj" || c === "frjgroup" || c === "thefrjgroup") {
    return {
      partnerId: "pro_frj",
      partnerName: "Fernando Rocha Jr.",
      partnerType: "agent",
      officeName: "The FRJ Group",
      createdAt: new Date().toISOString(),
    };
  }
  if (c === "demo") {
    return {
      partnerId: "pro_demo",
      partnerName: "Partner Demo",
      partnerType: "agent",
      officeName: "Demo Office",
      createdAt: new Date().toISOString(),
    };
  }
  return null;
}

export default function Page() {
  const params = useParams<{ code: string }>();
  const router = useRouter();

  useEffect(() => {
    const code = params.code;
    const partner = resolvePartner(code);
    if (partner) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(partner));
    }
    router.replace("/marketplace/intake");
  }, [params.code, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#fafafa]">
      <Container className="py-10">
        <Pill>Partner link</Pill>
        <Card className="mt-4 p-6">
          <div className="text-sm font-semibold">Loading…</div>
          <div className="mt-2 text-sm leading-7 text-[var(--hw-muted)]">Preparing your request experience.</div>
        </Card>
      </Container>
    </div>
  );
}
