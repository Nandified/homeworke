import { NextResponse } from "next/server";

type LaneItem = {
  id: string;
  label: string;
  note?: string;
  range?: string;
};

type ExtractedLane = {
  title: string;
  items: LaneItem[];
};

function safeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function demoResult(location: string): { lanes: ExtractedLane[]; summary: string } {
  return {
    summary: `Demo parse (no OpenAI key configured yet). Location: ${location || "—"}`,
    lanes: [
      {
        title: "Exterior",
        items: [
          { id: "roof", label: "Roofing patch / replace", note: "shingles + underlayment", range: "$4.8k–$8.2k" },
          { id: "gutters", label: "Gutters + downspouts", range: "$1.1k–$1.9k" },
        ],
      },
      {
        title: "Interior",
        items: [
          { id: "paint", label: "Interior paint refresh", note: "living + hall", range: "$1.3k–$2.5k" },
          { id: "floor", label: "Floor repair / refinish", range: "$900–$2.1k" },
        ],
      },
      {
        title: "Systems",
        items: [
          { id: "hvac", label: "HVAC tune-up / diagnostic", range: "$180–$450" },
          { id: "plumbing", label: "Plumbing leak locate", range: "$250–$650" },
        ],
      },
      {
        title: "Need more info",
        items: [
          { id: "foundation", label: "Foundation crack severity", note: "photos needed" },
          { id: "mold", label: "Mold / moisture source", note: "inspection recommended" },
        ],
      },
    ],
  };
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const notes = String(form.get("notes") || "");
    const location = String(form.get("location") || "");

    // We accept a PDF file now, but PDF text extraction will be added next.
    // (Keeping the interface stable so we can swap in real parsing without UI changes.)
    const _fileName = file && typeof file === "object" && "name" in file ? String((file as File).name) : "";

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: true, ...demoResult(location), used: "demo" });
    }

    const prompt = {
      role: "user",
      content:
        "You are an estimating assistant. Create a repair estimate from an inspection/appraisal report. " +
        "Return STRICT JSON with this shape: {summary:string, lanes:[{title:string, items:[{id:string,label:string,note?:string,range?:string}]}]}. " +
        "Pricing MUST be location-based. Use the provided location. " +
        "If you cannot price, omit range and put an explanatory note.\n\n" +
        `Location: ${location || "(unknown)"}\n` +
        `Notes from user: ${notes || "(none)"}\n` +
        "Report text: (PDF extraction not yet wired; infer common repair buckets and reasonable location-based ranges).",
    };

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [prompt],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      return NextResponse.json({ ok: false, error: "openai_error", detail: t.slice(0, 2000) }, { status: 500 });
    }

    const data = (await res.json()) as any;
    const text = String(data?.output_text || "");
    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      // fallback: demo if model response isn't parseable
      return NextResponse.json({ ok: true, ...demoResult(location), used: "demo_parse_fail" });
    }

    // minimal normalization
    const lanes: ExtractedLane[] = Array.isArray(parsed?.lanes)
      ? parsed.lanes
          .filter((l: any) => l && typeof l.title === "string" && Array.isArray(l.items))
          .map((l: any) => ({
            title: l.title,
            items: l.items
              .filter((it: any) => it && typeof it.label === "string")
              .slice(0, 25)
              .map((it: any) => ({
                id: typeof it.id === "string" ? it.id : safeId("item"),
                label: String(it.label),
                note: it.note ? String(it.note) : undefined,
                range: it.range ? String(it.range) : undefined,
              })),
          }))
      : demoResult(location).lanes;

    return NextResponse.json({ ok: true, summary: String(parsed?.summary || ""), lanes, used: "openai" });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "server_error", detail: String(e?.message || e || "unknown") }, { status: 500 });
  }
}
