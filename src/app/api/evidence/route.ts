import { NextResponse } from "next/server";

export const runtime = "nodejs";

import { getCurrentUser } from "@/lib/rbac";

export async function GET(req: Request) {
  // Auth gate: must be logged in.
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const url = String(searchParams.get("url") || "");
  if (!url) return NextResponse.json({ ok: false, error: "missing_url" }, { status: 400 });

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return NextResponse.json({ ok: false, error: "missing_blob_token" }, { status: 500 });

  const upstream = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
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
      "Cache-Control": "private, no-store",
    },
  });
}
