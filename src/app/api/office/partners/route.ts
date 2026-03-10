import { NextResponse } from "next/server";

import { dbEnabled, db } from "@/lib/db";
import { getSessionTokenFromCookie, getSessionUserId } from "@/lib/session";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

export async function GET(req: Request) {
  if (!dbEnabled()) {
    return json({
      ok: true,
      office: { id: "mock_office", name: "Demo Office", slug: "demo" },
      members: [],
      invites: [],
    });
  }

  const token = await getSessionTokenFromCookie();
  if (!token) return json({ ok: false, error: "unauthorized" }, { status: 401 });
  const userId = await getSessionUserId(token);
  if (!userId) return json({ ok: false, error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const officeIdParam = url.searchParams.get("officeId");

  const membership = await db().officeMembership.findFirst({
    where: {
      userId,
      ...(officeIdParam ? { officeId: officeIdParam } : {}),
    },
    include: { office: true },
  });

  if (!membership) return json({ ok: false, error: "forbidden" }, { status: 403 });

  const officeId = membership.officeId;

  const [memberships, invites] = await Promise.all([
    db().officeMembership.findMany({
      where: { officeId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    db().officeInvite.findMany({
      where: { officeId, acceptedAt: null },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return json({
    ok: true,
    office: membership.office,
    members: memberships.map((m) => ({
      userId: m.userId,
      email: m.user.email,
      role: m.role,
      createdAt: m.createdAt,
    })),
    invites: invites.map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      token: i.token,
      createdAt: i.createdAt,
      expiresAt: i.expiresAt,
    })),
  });
}
