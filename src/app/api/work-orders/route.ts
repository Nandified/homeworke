import { NextResponse } from "next/server";
import { createWorkOrder, listWorkOrders, type WorkOrder } from "@/lib/mock-store";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return json({ ok: false, error: "missing_token" }, { status: 400 });

  const workOrders = listWorkOrders(token);
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

    const wo: WorkOrder = createWorkOrder({
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
    });

    console.log(
      JSON.stringify({
        type: "work_order_created",
        createdAt: wo.createdAt,
        id: wo.id,
        token: wo.token,
        originPartnerId: wo.originPartnerId,
        shareWithPartner: wo.shareWithPartner,
      })
    );

    return json({ ok: true, workOrder: wo });
  } catch {
    return json({ ok: false, error: "bad_json" }, { status: 400 });
  }
}
