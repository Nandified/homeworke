import { NextResponse } from "next/server";

import { dbEnabled, db } from "@/lib/db";
import { createWorkOrder as createMock } from "@/lib/mock-store";

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
      intake?: any;
    };

    if (!body.email || !body.email.includes("@")) {
      return json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    const jobId = `job_${Math.random().toString(36).slice(2, 10)}`;

    // DB mode: create user + session + work order
    if (dbEnabled()) {
      const email = body.email.trim().toLowerCase();
      const user = await db().user.upsert({ where: { email }, update: {}, create: { email } });
      const sessionToken = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);
      await db().session.create({ data: { userId: user.id, token: sessionToken, expiresAt } });

      const intake = body.intake || {};
      const wo = await db().workOrder.create({
        data: {
          userId: user.id,
          originPartnerId: body.partnerId ?? null,
          shareWithPartnerId: body.shareWithPartner ? (body.partnerId ?? null) : null,
          serviceCategory: intake.service_category || body.service || "General",
          serviceSubcategory: intake.service_subcategory ?? null,
          issueDescription: intake.issue_description ?? null,
          urgencyLevel: intake.urgency_level ?? null,
          propertyAddress: intake.property_address ?? null,
          propertyType: intake.property_type ?? null,
          preferredWindow: intake.preferred_time_window ?? null,
          status: "SUBMITTED",
        },
      });

      console.log(
        JSON.stringify({
          type: "marketplace_confirm",
          createdAt: new Date().toISOString(),
          jobId,
          email,
          sessionToken,
          workOrderId: wo.id,
          originPartnerId: body.partnerId ?? null,
          shareWithPartner: body.shareWithPartner ?? null,
        })
      );

      return json({ ok: true, jobId, token: sessionToken, workOrderId: wo.id });
    }

    // Mock mode: create mock token + work order
    const token = `mock_${Math.random().toString(36).slice(2, 18)}`;
    const intake = body.intake || {};
    const workOrder = createMock({
      token,
      originPartnerId: body.partnerId ?? null,
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

    console.log(
      JSON.stringify({
        type: "marketplace_confirm",
        createdAt: new Date().toISOString(),
        jobId,
        email: body.email,
        token,
        workOrderId: workOrder.id,
        originPartnerId: body.partnerId ?? null,
        shareWithPartner: body.shareWithPartner ?? null,
      })
    );

    return json({ ok: true, jobId, token, workOrderId: workOrder.id });
  } catch {
    return json({ ok: false, error: "bad_json" }, { status: 400 });
  }
}
