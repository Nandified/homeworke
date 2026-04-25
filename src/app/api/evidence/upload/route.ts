import { NextResponse } from "next/server";

export const runtime = "nodejs";

import crypto from "node:crypto";

import { put } from "@vercel/blob";

// Evidence thumbnails are derived from uploaded inspection reports.
// We intentionally allow anonymous uploads here so the client-side extractor works reliably
// across browsers (Safari/WebKit can omit cookies unexpectedly on background fetches).
// Thumbs are stored as content-addressed blob URLs.
export async function POST(req: Request) {

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

  // Store thumbs as PRIVATE blobs (matches Vercel Blob store config). We then serve them
  // through our own `/api/evidence` proxy which attaches the Blob token.
  try {
    const blob = await put(pathname, buf, { access: "private", contentType: mime });
    return NextResponse.json({
      ok: true,
      sha256,
      mime,
      bytes: buf.length,
      blobUrl: blob.url,
      src: `/api/evidence?url=${encodeURIComponent(blob.url)}`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: "blob_put_failed", detail: msg.slice(0, 500) }, { status: 500 });
  }
}
