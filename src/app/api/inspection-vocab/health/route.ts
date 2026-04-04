import { NextResponse } from "next/server";

import { SHEET_META, SHEET_RULES } from "@/lib/inspection-normalization-map.generated";

export const runtime = "nodejs";

export async function GET() {
  const meta = (SHEET_META && typeof SHEET_META === "object" ? SHEET_META : {}) as Record<string, unknown>;
  const ruleCount = Array.isArray(SHEET_RULES) ? SHEET_RULES.length : 0;

  return NextResponse.json({
    ok: true,
    sheet: {
      meta,
      ruleCount,
    },
    notes: [
      "This endpoint reports the vocab rules baked into the current deployment (generated at build time).",
      "If sheet fetch fails during build, the build keeps the previous generated rules file as a fail-safe.",
    ],
  });
}
