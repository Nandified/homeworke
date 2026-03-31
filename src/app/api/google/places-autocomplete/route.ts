import { NextResponse } from "next/server";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number; headers?: Record<string, string> }) {
  return NextResponse.json(data, { status: init?.status ?? 200, headers: init?.headers });
}

function getKey() {
  // Server-side key (not exposed to browser)
  return process.env.GOOGLE_PROPERTY_PHOTOS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || "";
}

export async function GET(req: Request) {
  const key = getKey();
  if (!key) return json({ ok: false, error: "missing_google_key" }, { status: 500 });

  const url = new URL(req.url);
  const input = (url.searchParams.get("input") || "").trim();
  const country = (url.searchParams.get("country") || "us").trim().toLowerCase();
  const sessiontoken = (url.searchParams.get("sessiontoken") || "").trim();
  const lat = (url.searchParams.get("lat") || "").trim();
  const lon = (url.searchParams.get("lon") || "").trim();
  const radius = (url.searchParams.get("radius") || "").trim();

  if (!input) return json({ ok: true, predictions: [] }, { headers: { "cache-control": "no-store" } });

  const apiUrl = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
  apiUrl.searchParams.set("input", input);
  apiUrl.searchParams.set("types", "address");
  if (country) apiUrl.searchParams.set("components", `country:${country}`);
  if (sessiontoken) apiUrl.searchParams.set("sessiontoken", sessiontoken);
  // Location bias: prefer results near the user (or our default market).
  if (lat && lon) {
    apiUrl.searchParams.set("location", `${lat},${lon}`);
    if (radius) apiUrl.searchParams.set("radius", radius);
  }
  apiUrl.searchParams.set("key", key);

  const r = await fetch(apiUrl.toString());
  const j = (await r.json()) as {
    status?: string;
    predictions?: Array<{ description: string; place_id: string }>;
    error_message?: string;
  };

  if (!r.ok || (j.status && j.status !== "OK" && j.status !== "ZERO_RESULTS")) {
    return json({ ok: false, error: "places_autocomplete_failed", detail: j.error_message || j.status || "unknown" }, { status: 502 });
  }

  const predictions = (j.predictions || []).slice(0, 6).map((p) => ({
    id: p.place_id,
    label: p.description,
  }));

  return json(
    { ok: true, predictions },
    {
      headers: {
        // no-store because this can include partial user input.
        "cache-control": "no-store",
      },
    }
  );
}
