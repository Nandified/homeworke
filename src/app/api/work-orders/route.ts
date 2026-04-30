import { NextResponse } from "next/server";

import { dbEnabled, db } from "@/lib/db";
import { createWorkOrder as createMock, listWorkOrders as listMock, type WorkOrder } from "@/lib/mock-store";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return json({ ok: false, error: "missing_token" }, { status: 400 });

  if (!dbEnabled()) {
    const workOrders = listMock(token);
    return json({ ok: true, workOrders });
  }

  // DB mode: token is treated as session token for now
  const session = await db().session.findUnique({ where: { token } });
  if (!session || session.expiresAt.getTime() < Date.now()) {
    return json({ ok: true, workOrders: [] });
  }

  const workOrders = await db().workOrder.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return json({ ok: true, workOrders });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      token?: string;
      originPartnerId?: string | null;
      shareWithPartner?: boolean | null;
      intake?: Partial<{
        service_category: string;
        service_subcategory: string;
        issue_description: string;
        urgency_level: string;
        property_address: string;
        property_type: string;
        preferred_date: string;
        preferred_time_window: string;
      }>;
    };

    if (!body.token) return json({ ok: false, error: "missing_token" }, { status: 400 });
    if (!body.intake?.service_category) return json({ ok: false, error: "missing_service" }, { status: 400 });

    if (!dbEnabled()) {
      const wo: WorkOrder = createMock({
        token: body.token,
        originPartnerId: body.originPartnerId ?? null,
        shareWithPartner: body.shareWithPartner ?? null,
        serviceCategory: body.intake.service_category,
        serviceSubcategory: body.intake.service_subcategory,
        issueDescription: body.intake.issue_description,
        urgencyLevel: body.intake.urgency_level,
        propertyAddress: body.intake.property_address,
        propertyType: body.intake.property_type,
        preferredDate: body.intake.preferred_date,
        preferredWindow: body.intake.preferred_time_window,
        // For manual booking, go straight to scheduling and mark as awaiting HG confirmation.
        status: body.intake.preferred_date ? ("confirming" as any) : undefined,
      });
      return json({ ok: true, workOrder: wo });
    }

    const session = await db().session.findUnique({ where: { token: body.token } });
    if (!session || session.expiresAt.getTime() < Date.now()) {
      return json({ ok: false, error: "invalid_session" }, { status: 401 });
    }

    const wo = await db().workOrder.create({
      data: {
        userId: session.userId,
        originPartnerId: body.originPartnerId ?? null,
        shareWithPartnerId: body.shareWithPartner ? (body.originPartnerId ?? null) : null,
        serviceCategory: body.intake.service_category,
        serviceSubcategory: body.intake.service_subcategory ?? null,
        issueDescription: body.intake.issue_description ?? null,
        urgencyLevel: body.intake.urgency_level ?? null,
        propertyAddress: body.intake.property_address ?? null,
        propertyType: body.intake.property_type ?? null,
        preferredWindow: body.intake.preferred_time_window ?? null,
        status: "SUBMITTED",
      },
    });

    return json({ ok: true, workOrder: wo });
  } catch {
    return json({ ok: false, error: "bad_json" }, { status: 400 });
  }
}
