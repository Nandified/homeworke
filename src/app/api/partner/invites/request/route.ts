import { NextResponse } from "next/server";
import crypto from "node:crypto";

import { db, dbEnabled } from "@/lib/db";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | {
          partnerCode?: string;
          email?: string;
          firstName?: string;
          lastName?: string;
          address?: string;
        }
      | null;

    const partnerCode = body?.partnerCode?.trim();
    const email = body?.email?.trim().toLowerCase();
    const firstName = body?.firstName?.trim() || "";
    const lastName = body?.lastName?.trim() || "";
    const address = body?.address?.trim() || "";

    if (!partnerCode) return json({ ok: false, error: "missing_partnerCode" }, { status: 400 });
    if (!email || !email.includes("@")) return json({ ok: false, error: "invalid_email" }, { status: 400 });

    const url = new URL(req.url);

    // Generate magic-link token (works even without DB; DB path stores it)
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 20);

    // Next page: land on partner link after auth so attribution + context are attached.
    const next = `/p/${encodeURIComponent(partnerCode)}?invited=1`;

    if (dbEnabled()) {
      const partner = await db().partnerProfile.findUnique({ where: { proCode: partnerCode } });
      if (!partner) return json({ ok: false, error: "unknown_partner" }, { status: 404 });

      const user = await db().user.upsert({
        where: { email },
        update: {},
        create: { email, role: "HOMEOWNER" },
      });

      // Connect client to partner (idempotent)
      await db().partnerClient.upsert({
        where: { partnerId_homeownerUserId: { partnerId: partner.id, homeownerUserId: user.id } },
        update: {},
        create: { partnerId: partner.id, homeownerUserId: user.id },
      });

      // Optional: pre-create a Property record if provided
      if (address) {
        await db().property.create({
          data: {
            userId: user.id,
            address1: address,
            nickname: `${firstName} ${lastName}`.trim() || undefined,
          },
        });
      }

      await db().magicLinkToken.create({
        data: { email, token, expiresAt },
      });
    }

    const qs = new URLSearchParams({ token, next });
    const magicLink = `${url.origin}/api/auth/consume?${qs.toString()}`;

    // v1 email delivery: log payload (wire to provider later).
    console.log(
      JSON.stringify({
        type: "partner_client_invite",
        partnerCode,
        to: email,
        firstName,
        lastName,
        address: address || null,
        subject: "You’ve been invited to Homeworke",
        ctaUrl: magicLink,
        expiresAt: expiresAt.toISOString(),
      })
    );

    return json({ ok: true });
  } catch {
    return json({ ok: false, error: "bad_json" }, { status: 400 });
  }
}
