import { NextResponse } from "next/server";

import { createShareToken, type ReportSharePayloadV1, type ShareMode } from "@/lib/share-token";

export async function POST(req: Request) {
  const secret = process.env.SHARE_TOKEN_SECRET || "dev-share-secret";

  const body = (await req.json().catch(() => null)) as any;
  const reportId = typeof body?.reportId === "string" ? body.reportId : "";
  const address = typeof body?.address === "string" ? body.address : undefined;
  const reportType = typeof body?.reportType === "string" ? body.reportType : undefined;
  const mode = (body?.mode === "selected" ? "selected" : "full") as ShareMode;
  const selectedIds = Array.isArray(body?.selectedIds) ? body.selectedIds.filter((x: any) => typeof x === "string") : undefined;

  const lanes = Array.isArray(body?.lanes)
    ? body.lanes
        .filter((l: any) => l && typeof l.title === "string" && Array.isArray(l.items))
        .map((l: any) => ({
          title: String(l.title),
          items: (l.items || [])
            .filter((it: any) => it && typeof it.id === "string" && typeof it.label === "string")
            .map((it: any) => ({
              id: String(it.id),
              label: String(it.label),
              note: typeof it.note === "string" ? it.note : undefined,
              range: typeof it.range === "string" ? it.range : undefined,
              price: typeof it.price === "number" && Number.isFinite(it.price) ? it.price : undefined,
            })),
        }))
    : undefined;

  const recipient = {
    name: typeof body?.recipient?.name === "string" ? body.recipient.name : undefined,
    email: typeof body?.recipient?.email === "string" ? body.recipient.email : undefined,
    phone: typeof body?.recipient?.phone === "string" ? body.recipient.phone : undefined,
    role: typeof body?.recipient?.role === "string" ? body.recipient.role : undefined,
  };

  const client = body?.client
    ? {
        name: typeof body.client?.name === "string" ? body.client.name : undefined,
        email: typeof body.client?.email === "string" ? body.client.email : undefined,
        phone: typeof body.client?.phone === "string" ? body.client.phone : undefined,
      }
    : undefined;

  if (!reportId) return NextResponse.json({ ok: false, error: "missing_report_id" }, { status: 400 });

  const now = Date.now();
  const payload: ReportSharePayloadV1 = {
    v: 1,
    kind: "express_estimate_report",
    reportId,
    address,
    reportType,
    client,
    mode,
    selectedIds: mode === "selected" ? selectedIds || [] : undefined,
    lanes,
    createdAt: now,
    exp: now + 1000 * 60 * 60 * 24 * 30,
    recipient,
  };

  const token = createShareToken(payload, secret);
  const url = new URL(`/share/report/${encodeURIComponent(token)}`, req.url);

  // Email send is intentionally stubbed for now.
  return NextResponse.json({ ok: true, url: url.toString(), expiresAt: payload.exp });
}
