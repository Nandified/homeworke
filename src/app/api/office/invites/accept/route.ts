import { NextResponse } from "next/server";

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

  const body = (await req.json().catch(() => null)) as { inviteToken?: string } | null;
  const inviteToken = body?.inviteToken?.trim();
  if (!inviteToken) return json({ ok: false, error: "missing_inviteToken" }, { status: 400 });

  const user = await db().user.findUnique({ where: { id: userId } });
  if (!user) return json({ ok: false, error: "unauthorized" }, { status: 401 });

  const invite = await db().officeInvite.findUnique({ where: { token: inviteToken } });
  if (!invite) return json({ ok: false, error: "invalid_invite" }, { status: 404 });
  if (invite.acceptedAt) return json({ ok: false, error: "invite_already_accepted" }, { status: 409 });
  if (invite.expiresAt.getTime() < Date.now()) return json({ ok: false, error: "invite_expired" }, { status: 410 });
  if (invite.email.toLowerCase().trim() !== user.email.toLowerCase().trim()) {
    return json({ ok: false, error: "invite_email_mismatch" }, { status: 403 });
  }

  await db().$transaction(async (tx) => {
    await tx.officeMembership.upsert({
      where: { officeId_userId: { officeId: invite.officeId, userId } },
      update: { role: invite.role },
      create: { officeId: invite.officeId, userId, role: invite.role },
    });

    await tx.officeInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date(), acceptedByUserId: userId },
    });
  });

  return json({ ok: true });
}
