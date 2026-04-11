import { NextResponse } from "next/server";

import { put } from "@vercel/blob";

import { dbEnabled, db } from "@/lib/db";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

// Upload a message attachment.
// Storage: Vercel Blob (requires BLOB_READ_WRITE_TOKEN in the deployed environment).
// - DB mode: stores metadata in MessageAttachment
// - No-DB mode: returns the blob URL (caller can still display it in-session)
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const messageId = String(form.get("messageId") || "").trim();
    const file = form.get("file");

    if (!messageId) return json({ ok: false, error: "missing_message" }, { status: 400 });
    if (!(file instanceof File)) return json({ ok: false, error: "missing_file" }, { status: 400 });

    const fileName = String((file as any).name || "attachment").trim() || "attachment";
    const mimeType = String((file as any).type || "application/octet-stream");
    const bytes = Number((file as any).size || 0);

    // 10MB cap for now (keeps UX fast and costs sane)
    if (bytes > 10 * 1024 * 1024) {
      return json({ ok: false, error: "file_too_large", detail: "Max attachment size is 10MB." }, { status: 413 });
    }

    const buf = Buffer.from(await file.arrayBuffer());

    const blob = await put(`messages/${messageId}/${Date.now()}-${fileName}`, buf, {
      access: "public",
      contentType: mimeType,
    });

    if (dbEnabled()) {
      const row = await db().messageAttachment.create({
        data: {
          messageId,
          url: blob.url,
          mimeType,
          fileName,
          bytes: Number.isFinite(bytes) ? bytes : null,
        },
      });
      return json({
        ok: true,
        attachment: { id: row.id, url: row.url, mimeType: row.mimeType, fileName: row.fileName, bytes: row.bytes },
      });
    }

    return json({ ok: true, attachment: { url: blob.url, mimeType, fileName, bytes } });
  } catch (e: unknown) {
    const msg = e && typeof e === "object" && "message" in e ? String((e as any).message) : "";
    return json({ ok: false, error: "upload_failed", detail: msg || "Unknown error" }, { status: 500 });
  }
}
