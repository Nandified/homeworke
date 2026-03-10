import { NextResponse } from "next/server";
import { createWorkOrder } from "@/lib/mock-store";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
      service?: string;
      provider?: string;
      date?: string;
      window?: string;
      partnerId?: string | null;
      shareWithPartner?: boolean | null;
      intake?: unknown;
    };

    if (!body.email || !body.email.includes("@")) {
      return json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    const jobId = `job_${Math.random().toString(36).slice(2, 10)}`;
    const token = `mock_${Math.random().toString(36).slice(2, 18)}`;


    const intake = (body.intake || {}) as any;
    const workOrder = createWorkOrder({
      token,
      originPartnerId: body.partnerId || null,
      shareWithPartner: body.shareWithPartner ?? null,
      serviceCategory: intake.service_category || body.service || "General",
      serviceSubcategory: intake.service_subcategory,
      issueDescription: intake.issue_description || undefined,
      urgencyLevel: intake.urgency_level || undefined,
      propertyAddress: intake.property_address || undefined,
      propertyType: intake.property_type || undefined,
      preferredDate: intake.preferred_date || body.date || undefined,
      preferredWindow: intake.preferred_time_window || body.window || undefined,
    });

    // Phase 2: log only (later: DB)
    console.log(
      JSON.stringify({
        type: "marketplace_confirm",
        createdAt: new Date().toISOString(),
        jobId,
        email: body.email,
        service: body.service,
        provider: body.provider,
        date: body.date,
        window: body.window,
        partnerId: body.partnerId || null,
        shareWithPartner: body.shareWithPartner ?? null,
      })
    );

    return json({ ok: true, jobId, token, workOrderId: workOrder.id });
  } catch {
    return json({ ok: false, error: "bad_json" }, { status: 400 });
  }
}
