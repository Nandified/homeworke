import { NextResponse } from "next/server";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | {
          token?: string;
          reportId?: string;
          email?: string;
          role?: string;
          source?: string;
        }
      | null;

    const email = (body?.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) return json({ ok: false, error: "invalid_email" }, { status: 400 });

    // v1: lead capture is stubbed (log payload). Wire to DB/CRM + email provider later.
    console.log(
      JSON.stringify({
        type: "express_estimate_share_lead",
        email,
        role: body?.role || null,
        reportId: body?.reportId || null,
        token: body?.token ? String(body.token).slice(0, 12) + "…" : null,
        source: body?.source || "share_page",
        ts: new Date().toISOString(),
      })
    );

    return json({ ok: true });
  } catch {
    return json({ ok: false, error: "bad_json" }, { status: 400 });
  }
}
