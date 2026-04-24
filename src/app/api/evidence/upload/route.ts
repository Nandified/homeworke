import { NextResponse } from "next/server";

export const runtime = "nodejs";

import crypto from "node:crypto";

import { put } from "@vercel/blob";

import { getCurrentUser } from "@/lib/rbac";

export async function POST(req: Request) {
  const allowAnon = process.env.EVIDENCE_ALLOW_ANON === "1";

  let user: any = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  if (!allowAnon && !user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return NextResponse.json({ ok: false, error: "missing_blob_token" }, { status: 500 });

  const form = await req.formData();
  const f = form.get("file");
  if (!(f instanceof File)) return NextResponse.json({ ok: false, error: "missing_file" }, { status: 400 });

  const mime = String((f as any).type || "application/octet-stream");
  const buf = Buffer.from(await f.arrayBuffer());
  const sha256 = crypto.createHash("sha256").update(buf).digest("hex");

  const ext = (() => {
    if (mime === "image/png") return "png";
    if (mime === "image/webp") return "webp";
    if (mime === "image/gif") return "gif";
    return "jpg";
  })();

  const pathname = `evidence/uploads/${sha256}.${ext}`;
  const blob = await put(pathname, buf, { access: "private", contentType: mime });

  return NextResponse.json({ ok: true, sha256, mime, bytes: buf.length, blobUrl: blob.url, src: `/api/evidence?url=${encodeURIComponent(blob.url)}` });
}
