import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getKey() {
  return process.env.GOOGLE_PROPERTY_PHOTOS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || "";
}

export async function GET(req: Request) {
  const key = getKey();
  if (!key) return NextResponse.json({ ok: false, error: "missing_google_key" }, { status: 500 });

  const url = new URL(req.url);
  const ref = (url.searchParams.get("ref") || "").trim();
  const maxwidth = Math.max(200, Math.min(1600, Number(url.searchParams.get("maxwidth") || "800") || 800));

  if (!ref) return NextResponse.json({ ok: false, error: "missing_ref" }, { status: 400 });

  const photoUrl = new URL("https://maps.googleapis.com/maps/api/place/photo");
  photoUrl.searchParams.set("maxwidth", String(maxwidth));
  photoUrl.searchParams.set("photoreference", ref);
  photoUrl.searchParams.set("key", key);

  // Follow the redirect ourselves and stream back the final bytes.
  const r1 = await fetch(photoUrl.toString(), { redirect: "manual" });

  // Google returns 302 with Location.
  const loc = r1.headers.get("location");
  if (r1.status >= 300 && r1.status < 400 && loc) {
    const r2 = await fetch(loc);
    if (!r2.ok) return NextResponse.json({ ok: false, error: "photo_fetch_failed" }, { status: 502 });

    const ct = r2.headers.get("content-type") || "image/jpeg";
    // Google Maps Platform content caching: keep modest + within policy; 30 days is a common upper bound.
    const cache = "public, max-age=2592000, s-maxage=2592000";
    return new NextResponse(r2.body, { status: 200, headers: { "content-type": ct, "cache-control": cache } });
  }

  // Sometimes Google may return the image directly.
  if (r1.ok && r1.body) {
    const ct = r1.headers.get("content-type") || "image/jpeg";
    // Google Maps Platform content caching: keep modest + within policy; 30 days is a common upper bound.
    const cache = "public, max-age=2592000, s-maxage=2592000";
    return new NextResponse(r1.body, { status: 200, headers: { "content-type": ct, "cache-control": cache } });
  }

  return NextResponse.json({ ok: false, error: "photo_unavailable" }, { status: 502 });
}
