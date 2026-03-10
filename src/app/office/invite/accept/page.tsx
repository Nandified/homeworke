import { Suspense } from "react";

import { OfficeInviteAcceptClient } from "./OfficeInviteAcceptClient";

export const runtime = "nodejs";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white p-10 text-sm text-[var(--hw-muted)]">Loading…</div>}>
      <OfficeInviteAcceptClient />
    </Suspense>
  );
}
