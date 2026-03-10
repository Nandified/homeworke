import { NextResponse } from "next/server";
import crypto from "node:crypto";

import { dbEnabled, db } from "@/lib/db";
import { getSessionTokenFromCookie, getSessionUserId } from "@/lib/session";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

export async function POST(req: Request) {
  if (!dbEnabled()) return json({ ok: true, skipped: true });

  const token = await getSessionTokenFromCookie();
  if (!token) return json({ ok: false, error: "unauthorized" }, { status: 401 });
  const userId = await getSessionUserId(token);
  if (!userId) return json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { officeId?: string; email?: string; role?: "ADMIN" | "MEMBER" } | null;
  const officeId = body?.officeId?.trim();
  const email = body?.email?.trim().toLowerCase();
  const role = body?.role === "ADMIN" ? "ADMIN" : "MEMBER";

  if (!officeId) return json({ ok: false, error: "missing_officeId" }, { status: 400 });
  if (!email || !email.includes("@")) return json({ ok: false, error: "invalid_email" }, { status: 400 });

  const actor = await db().user.findUnique({ where: { id: userId } });
  if (!actor) return json({ ok: false, error: "unauthorized" }, { status: 401 });

  // Must be global ADMIN or office ADMIN.
  if (actor.role !== "ADMIN") {
    const membership = await db().officeMembership.findUnique({ where: { officeId_userId: { officeId, userId } } });
    if (!membership || membership.role !== "ADMIN") return json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const inviteToken = `oinv_${crypto.randomBytes(24).toString("hex")}`;
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  const invite = await db().officeInvite.create({
    data: {
      officeId,
      email,
      role,
      token: inviteToken,
      expiresAt,
    },
  });

  // v1: deliver invite link via logs (magic-link compatible).
  const url = new URL(req.url);
  const acceptUrl = `${url.origin}/office/invite/accept?invite=${encodeURIComponent(inviteToken)}`;
  console.log(JSON.stringify({ type: "office_invite", officeId, email, role, acceptUrl, expiresAt: expiresAt.toISOString() }));

  return json({ ok: true, invite: { id: invite.id, token: invite.token, email: invite.email, role: invite.role, expiresAt: invite.expiresAt } });
}
