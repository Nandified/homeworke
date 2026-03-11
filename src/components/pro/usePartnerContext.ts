"use client";

import * as React from "react";

import { ensureDemoPartnerContext, isDemoMode } from "@/lib/demo";
import { loadPartner } from "@/lib/partner-context";

export function usePartnerContext() {
  const [partnerId, setPartnerId] = React.useState<string | null>(null);
  const [partnerName, setPartnerName] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isDemoMode()) ensureDemoPartnerContext();
    const p = loadPartner();
    setPartnerId(p?.partnerId || null);
    setPartnerName(p?.partnerName || null);
  }, []);

  return { partnerId, partnerName, ready: partnerId !== null } as const;
}
