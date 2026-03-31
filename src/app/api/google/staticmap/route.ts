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
  const size = (url.searchParams.get("size") || "800x360").trim();
  const zoom = Math.max(1, Math.min(20, Number(url.searchParams.get("zoom") || "16") || 16));
  const scale = Math.max(1, Math.min(2, Number(url.searchParams.get("scale") || "2") || 2));

  if (!address) return NextResponse.json({ ok: false, error: "missing_address" }, { status: 400 });

  const mapUrl = new URL("https://maps.googleapis.com/maps/api/staticmap");
  mapUrl.searchParams.set("center", address);
  mapUrl.searchParams.set("zoom", String(zoom));
  mapUrl.searchParams.set("size", size);
  mapUrl.searchParams.set("scale", String(scale));
  mapUrl.searchParams.set("maptype", "roadmap");
  mapUrl.searchParams.set("markers", `color:red|${address}`);
  mapUrl.searchParams.set("key", key);

  const r = await fetch(mapUrl.toString());
  if (!r.ok) return NextResponse.json({ ok: false, error: "staticmap_failed" }, { status: 502 });

  const ct = r.headers.get("content-type") || "image/png";
  // Google Maps Platform content caching: keep modest + within policy; 30 days is a common upper bound.
  const cache = "public, max-age=2592000, s-maxage=2592000";
  return new NextResponse(r.body, { status: 200, headers: { "content-type": ct, "cache-control": cache } });
}
