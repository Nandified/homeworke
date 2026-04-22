import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

export async function POST() {
  // Simple smoke test for private blob uploads.
  const pathname = `tests/${Date.now()}-hello.txt`;
  const blob = await put(pathname, "Hello from Homeworke Blob!", {
    access: "private",
    contentType: "text/plain",
  });

  // NOTE: For private blobs, blob.url is NOT publicly fetchable from the browser.
  // Reads should be proxied through a server route using the token.
  return NextResponse.json({ ok: true, pathname, url: blob.url });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = String(searchParams.get("url") || "");
  if (!url) return NextResponse.json({ ok: false, error: "missing_url" }, { status: 400 });

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return NextResponse.json({ ok: false, error: "missing_blob_token" }, { status: 500 });

  // Private blob read: authenticated fetch via token, then forward to client.
  const upstream = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    return NextResponse.json(
      { ok: false, error: "upstream_fetch_failed", status: upstream.status, detail: detail.slice(0, 500) },
      { status: 502 }
    );
  }

  const buf = Buffer.from(await upstream.arrayBuffer());
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "application/octet-stream",
      "Cache-Control": "no-store",
    },
  });
}
