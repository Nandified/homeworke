import { NextResponse } from "next/server";

import { dbEnabled, db } from "@/lib/db";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
      name?: string;
      phone?: string;
      leadRole?: string;
      redirectAfterConfirm?: string;
      intake?: any;
    };

    const email = (body.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) return json({ ok: false, error: "invalid_email" }, { status: 400 });

    const name = (body.name || "").trim();
    const phone = (body.phone || "").trim();
    if (!name) return json({ ok: false, error: "missing_name" }, { status: 400 });
    if (!phone) return json({ ok: false, error: "missing_phone" }, { status: 400 });

    const leadRole = String(body.leadRole || "homeowner");
    const redirectAfterConfirm =
      typeof body.redirectAfterConfirm === "string" && body.redirectAfterConfirm.startsWith("/")
        ? body.redirectAfterConfirm
        : "/";

    const payload = {
      intake: body.intake || {},
      leadRole,
      redirectAfterConfirm,
      name,
      phone,
    };

    if (dbEnabled()) {
      await db().pendingConfirmation.create({
        data: {
          email,
          name,
          phone,
          leadRole,
          redirectAfterConfirm,
          payload,
        },
      });
    } else {
      // Non-DB deployments: nothing to persist; auth callback won't be able to finalize.
      // Still return ok so the UI can proceed in demo mode.
      console.log(JSON.stringify({ type: "pending_confirmation_mock", email, payload }));
    }

    return json({ ok: true });
  } catch {
    return json({ ok: false, error: "bad_json" }, { status: 400 });
  }
}
