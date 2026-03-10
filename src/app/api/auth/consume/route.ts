import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { dbEnabled, db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/", req.url));

  let sessionToken = `mock_${crypto.randomBytes(16).toString("hex")}`;

  if (dbEnabled()) {
    const row = await db().magicLinkToken.findUnique({ where: { token } });
    if (!row || row.consumedAt || row.expiresAt.getTime() < Date.now()) {
      return NextResponse.redirect(new URL("/?auth=invalid", req.url));
    }

    const email = row.email;
    const user = await db().user.upsert({
      where: { email },
      update: {},
      create: { email },
    });

    sessionToken = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);
    await db().session.create({ data: { userId: user.id, token: sessionToken, expiresAt } });
    await db().magicLinkToken.update({ where: { token }, data: { consumedAt: new Date() } });
  }

  const next = url.searchParams.get("next");
  const redirectTo = next && next.startsWith("/") ? next : "/ho/dashboard";

  const res = NextResponse.redirect(new URL(redirectTo, req.url));
  res.cookies.set("hw_session", sessionToken, { httpOnly: true, sameSite: "lax", secure: true, path: "/" });
  return res;
}
