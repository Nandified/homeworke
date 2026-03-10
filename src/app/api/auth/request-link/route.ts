import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { dbEnabled, db } from "@/lib/db";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase();
    if (!email || !email.includes("@")) return json({ ok: false, error: "invalid_email" }, { status: 400 });

    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 20);

    if (dbEnabled()) {
      await db().magicLinkToken.create({
        data: { email, token, expiresAt },
      });
    }

    // v1: deliver link via logs
    const url = new URL(req.url);
    const link = `${url.origin}/api/auth/consume?token=${token}`;
    console.log(JSON.stringify({ type: "magic_link", email, link, expiresAt: expiresAt.toISOString() }));

    return json({ ok: true });
  } catch {
    return json({ ok: false, error: "bad_json" }, { status: 400 });
  }
}
