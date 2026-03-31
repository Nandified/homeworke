import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getKey() {
  return process.env.GOOGLE_PROPERTY_PHOTOS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || "";
}

export async function GET(req: Request) {
  const key = getKey();
  if (!key) return NextResponse.json({ ok: false, error: "missing_google_key" }, { status: 500 });

  const url = new URL(req.url);
  const address = (url.searchParams.get("address") || "").trim();
  const size = (url.searchParams.get("size") || "800x450").trim();
  const fov = Math.max(10, Math.min(120, Number(url.searchParams.get("fov") || "80") || 80));
  const pitch = Math.max(-90, Math.min(90, Number(url.searchParams.get("pitch") || "0") || 0));

  if (!address) return NextResponse.json({ ok: false, error: "missing_address" }, { status: 400 });

  const svUrl = new URL("https://maps.googleapis.com/maps/api/streetview");
  svUrl.searchParams.set("size", size);
  svUrl.searchParams.set("location", address);
  svUrl.searchParams.set("fov", String(fov));
  svUrl.searchParams.set("pitch", String(pitch));
  svUrl.searchParams.set("key", key);

  const r = await fetch(svUrl.toString());
  if (!r.ok) return NextResponse.json({ ok: false, error: "streetview_failed" }, { status: 502 });

  const ct = r.headers.get("content-type") || "image/jpeg";
  // Google Maps Platform content caching: keep modest + within policy; 30 days is a common upper bound.
  const cache = "public, max-age=2592000, s-maxage=2592000";
  return new NextResponse(r.body, { status: 200, headers: { "content-type": ct, "cache-control": cache } });
}
