import { NextResponse } from "next/server";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

function getKey() {
  return process.env.GOOGLE_PROPERTY_PHOTOS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || "";
}

export async function GET(req: Request) {
  const key = getKey();
  if (!key) return json({ ok: false, error: "missing_google_key" }, { status: 500 });

  const url = new URL(req.url);
  const address = (url.searchParams.get("address") || "").trim();
  const limit = Math.max(1, Math.min(10, Number(url.searchParams.get("limit") || "6") || 6));

  if (!address) return json({ ok: false, error: "missing_address" }, { status: 400 });

  // 1) Find place_id from address text
  const findUrl = new URL("https://maps.googleapis.com/maps/api/place/findplacefromtext/json");
  findUrl.searchParams.set("input", address);
  findUrl.searchParams.set("inputtype", "textquery");
  findUrl.searchParams.set("fields", "place_id");
  findUrl.searchParams.set("key", key);

  const findRes = await fetch(findUrl.toString());
  if (!findRes.ok) return json({ ok: false, error: "findplace_failed" }, { status: 502 });
  const findJson = (await findRes.json()) as { candidates?: Array<{ place_id?: string }> };

  const placeId = findJson?.candidates?.[0]?.place_id;
  if (!placeId) return json({ ok: true, placeId: null, photos: [] });

  // 2) Get photos from place details
  const detailsUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  detailsUrl.searchParams.set("place_id", placeId);
  detailsUrl.searchParams.set("fields", "photo");
  detailsUrl.searchParams.set("key", key);

  const detRes = await fetch(detailsUrl.toString());
  if (!detRes.ok) return json({ ok: false, error: "details_failed" }, { status: 502 });
  const detJson = (await detRes.json()) as {
    result?: {
      photos?: Array<{ photo_reference?: string; width?: number; height?: number; html_attributions?: string[] }>;
    };
  };
  const photos = detJson?.result?.photos || [];

  const out = photos
    .slice(0, limit)
    .map((p) => ({
      ref: String(p.photo_reference || ""),
      width: Number(p.width || 0) || 0,
      height: Number(p.height || 0) || 0,
      attributions: Array.isArray(p.html_attributions) ? p.html_attributions : [],
    }))
    .filter((p) => !!p.ref);

  // This only returns photo references; safe to cache a bit to reduce API calls.
  return NextResponse.json({ ok: true, placeId, photos: out }, { headers: { "cache-control": "public, max-age=2592000, s-maxage=2592000" } });
}
