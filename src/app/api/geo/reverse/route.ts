import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = url.searchParams.get("lat");
  const lon = url.searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ ok: false, error: "Missing lat/lon" }, { status: 400 });
  }

  const upstream = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
    lat
  )}&lon=${encodeURIComponent(lon)}&addressdetails=1`;

  const res = await fetch(upstream, {
    headers: {
      // Nominatim usage policy requests an identifying UA; in serverless we set a referer.
      Referer: "https://homeworke.com",
    },
    // Avoid caching location lookups
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ ok: false, error: "Upstream error" }, { status: 502 });
  }

  const data = await res.json();
  const a = data?.address ?? {};

  const city = a.city || a.town || a.village || a.suburb || a.hamlet || null;
  const state = a.state || a.region || null;
  const zip = a.postcode || null;

  return NextResponse.json({ ok: true, city, state, zip, raw: { display_name: data?.display_name } });
}
