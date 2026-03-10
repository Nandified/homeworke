import { cookies } from "next/headers";
import crypto from "node:crypto";

import { dbEnabled, db } from "@/lib/db";

export async function getSessionTokenFromCookie() {
  try {
    const c = await cookies();
    return c.get("hw_session")?.value || null;
  } catch {
    return null;
  }
}

export async function getSessionUserId(sessionToken: string) {
  if (!dbEnabled()) return null;
  const s = await db().session.findUnique({ where: { token: sessionToken } });
  if (!s) return null;
  if (s.expiresAt.getTime() < Date.now()) return null;
  return s.userId;
}

export function randomToken(prefix: string) {
  return `${prefix}_${crypto.randomBytes(16).toString("hex")}`;
}
