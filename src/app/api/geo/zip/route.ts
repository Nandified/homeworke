import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const zip = (url.searchParams.get("zip") || "").trim();

  if (!zip || !/^\d{5}(-\d{4})?$/.test(zip)) {
    return NextResponse.json({ ok: false, error: "Invalid zip" }, { status: 400 });
  }

  const upstream = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=us&limit=1&addressdetails=1&q=${encodeURIComponent(
    zip
  )}`;

  const res = await fetch(upstream, {
    headers: { Referer: "https://homeworke.com" },
    cache: "no-store",
  });

  if (!res.ok) return NextResponse.json({ ok: false, error: "Upstream error" }, { status: 502 });

  const arr = (await res.json()) as any[];
  const first = arr?.[0];
  const a = first?.address ?? {};

  const city = a.city || a.town || a.village || a.suburb || null;
  const state = a.state || a.region || null;

  return NextResponse.json({ ok: true, city, state, zip, lat: first?.lat, lon: first?.lon });
}
