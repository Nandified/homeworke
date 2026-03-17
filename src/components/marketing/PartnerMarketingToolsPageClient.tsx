"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { Button } from "@/components/ui";
import { PortalShell } from "@/components/portal-shell";
import { loadPartner, PARTNER_STORAGE_KEY, type PartnerContext } from "@/lib/partner-context";
import { ensureDemoPartnerContext } from "@/lib/demo";
import { PartnerMarketingToolsSection } from "@/components/marketing/PartnerMarketingToolsSection";

export function PartnerMarketingToolsPageClient({ basePath }: { basePath: "/partner" | "/pro" }) {
  const nav = useMemo(
    () => [
      { href: `${basePath}/dashboard`, label: "Dashboard" },
      { href: `${basePath}/express-estimate`, label: "Express Estimate" },
      { href: `${basePath}/jobs`, label: "Jobs" },
      { href: `${basePath}/clients`, label: "My Clients" },
      { href: `${basePath}/properties`, label: "Properties" },
      { href: `${basePath}/messages`, label: "Messages" },
      { href: `${basePath}/marketing-tools`, label: "Marketing Tools" },
      { href: `${basePath}/support`, label: "Support" },
      { href: `${basePath}/account`, label: "My Account" },
    ],
    [basePath]
  );

  const [partner, setPartner] = useState<PartnerContext | null | undefined>(undefined);

  useEffect(() => {
    ensureDemoPartnerContext();

    // Avoid synchronous setState in effect (lint rule)
    window.setTimeout(() => {
      const fromHelper = loadPartner();
      if (fromHelper?.partnerId) {
        setPartner(fromHelper);
        return;
      }

      try {
        const raw = localStorage.getItem(PARTNER_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as PartnerContext;
          if (parsed?.partnerId) {
            setPartner(parsed);
            return;
          }
        }
      } catch {
        // ignore
      }

      setPartner(null);
    }, 0);
  }, []);

  const inviteLink =
    partner?.partnerId && typeof window !== "undefined" ? `${window.location.origin}/p/${partner.partnerId}` : "";

  return (
    <PortalShell
      role="PRO"
      title="Marketing Tools"
      nav={nav}
      description="Templates and branded assets to help you share Homeworke with clients."
      primaryAction={
        <Link href={`${basePath}/dashboard`}>
          <Button variant="secondary">Back to dashboard</Button>
        </Link>
      }
    >
      <div className="grid gap-6">
        <PartnerMarketingToolsSection basePath={basePath} partner={partner} inviteLink={inviteLink} />
      </div>
    </PortalShell>
  );
}
