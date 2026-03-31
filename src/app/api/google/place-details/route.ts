import { NextResponse } from "next/server";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number; headers?: Record<string, string> }) {
  return NextResponse.json(data, { status: init?.status ?? 200, headers: init?.headers });
}

function getKey() {
  return process.env.GOOGLE_PROPERTY_PHOTOS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || "";
}

type AddressComponent = { long_name: string; short_name: string; types: string[] };

export async function GET(req: Request) {
  const key = getKey();
  if (!key) return json({ ok: false, error: "missing_google_key" }, { status: 500 });

  const url = new URL(req.url);
  const placeId = (url.searchParams.get("placeId") || "").trim();
  const sessiontoken = (url.searchParams.get("sessiontoken") || "").trim();

  if (!placeId) return json({ ok: false, error: "missing_placeId" }, { status: 400 });

  const apiUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  apiUrl.searchParams.set("place_id", placeId);
  apiUrl.searchParams.set("fields", "address_component,formatted_address");
  if (sessiontoken) apiUrl.searchParams.set("sessiontoken", sessiontoken);
  apiUrl.searchParams.set("key", key);

  const r = await fetch(apiUrl.toString());
  const j = (await r.json()) as {
    status?: string;
    result?: { formatted_address?: string; address_components?: AddressComponent[] };
    error_message?: string;
  };

  if (!r.ok || (j.status && j.status !== "OK")) {
    return json({ ok: false, error: "place_details_failed", detail: j.error_message || j.status || "unknown" }, { status: 502 });
  }

  const comps = j.result?.address_components || [];
  const get = (type: string, which: "long" | "short" = "long") => {
    const c = comps.find((x) => Array.isArray(x.types) && x.types.includes(type));
    if (!c) return "";
    return which === "short" ? c.short_name : c.long_name;
  };

  const streetNumber = get("street_number");
  const route = get("route");
  const city = get("locality") || get("sublocality") || get("postal_town");
  const state = get("administrative_area_level_1", "short");
  const zip = get("postal_code");

  const line1 = [streetNumber, route].filter(Boolean).join(" ");
  const cityState = [city, state].filter(Boolean).join(", ");
  const line2 = [cityState, zip ? `${zip}` : ""].filter(Boolean).join(zip ? " " : "");

  const formattedNoCountry = [line1, line2].filter(Boolean).join(", ").trim();
  const formatted = formattedNoCountry || (j.result?.formatted_address || "").replace(/,\s*USA\s*$/i, "");

  return json(
    { ok: true, formatted, zip: zip || null },
    {
      headers: {
        // no-store because it is user-input-driven.
        "cache-control": "no-store",
      },
    }
  );
}
