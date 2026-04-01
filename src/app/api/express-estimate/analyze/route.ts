import { NextResponse } from "next/server";

import crypto from "node:crypto";

import pdf from "pdf-parse";

type EvidenceThumb = { src: string; caption?: string };

type LaneItem = {
  id: string;
  label: string;
  note?: string;
  range?: string;
  evidence?: EvidenceThumb[];
};

type ExtractedLane = {
  title: string;
  items: LaneItem[];
};

function normalizeLabel(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 +/()-]/g, "")
    .trim();
}

function stableIdFor(label: string) {
  const h = crypto.createHash("sha1").update(normalizeLabel(label)).digest("hex").slice(0, 10);
  return `item_${h}`;
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
    ],
  };
}

function dedupeLanes(lanes: ExtractedLane[]): ExtractedLane[] {
  const seen = new Set<string>();
  return lanes
    .map((lane) => {
      const items = lane.items.filter((it) => {
        const key = normalizeLabel(it.label);
        if (!key) return false;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return { ...lane, items };
    })
    .filter((l) => l.items.length > 0);
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const notes = String(form.get("notes") || "");
    const location = String(form.get("location") || "");

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: true, ...demoResult(location), used: "demo" });
    }

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "missing_file" }, { status: 400 });
    }

    // ---- PDF text extraction (server-side) ----
    const buf = Buffer.from(await file.arrayBuffer());
    const parsedPdf = await pdf(buf);
    const extractedText = String(parsedPdf?.text || "").replace(/\u0000/g, "").trim();

    if (!extractedText) {
      return NextResponse.json({ ok: false, error: "pdf_no_text", detail: "Could not extract text from PDF (may be scanned)." }, { status: 422 });
    }

    // NOTE: Evidence image extraction from PDFs is non-trivial and highly format-dependent.
    // We will wire it next (likely via PDF.js operator parsing + a mapping heuristic).

    const schema = {
      type: "object",
      additionalProperties: false,
      properties: {
        summary: { type: "string" },
        lanes: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              items: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    id: { type: "string" },
                    label: { type: "string" },
                    note: { type: "string" },
                    range: { type: "string" },
                  },
                  required: ["label"],
                },
              },
            },
            required: ["title", "items"],
          },
        },
      },
      required: ["summary", "lanes"],
    };

    const system = {
      role: "system",
      content:
        "You are an expert home inspection estimator. " +
        "Your job is to read the inspection report text and output a consistent, de-duplicated set of repair items. " +
        "Rules: (1) Prefer the report's *summary* section when present; do not duplicate items found later in the report. " +
        "(2) Do not hallucinate defects not supported by the text. " +
        "(3) Use location-based pricing ranges when possible. " +
        "(4) Keep item labels short and scannable; put the detailed narrative in note. " +
        "(5) Group items into clear lanes (Exterior/Interior/Systems/Safety/Need more info etc).",
    };

    const user = {
      role: "user",
      content:
        `Location: ${location || "(unknown)"}\n` +
        `User notes: ${notes || "(none)"}\n\n` +
        "Return STRICT JSON matching the provided schema.\n\n" +
        "Inspection report text (verbatim):\n" +
        extractedText.slice(0, 180_000),
    };

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        temperature: 0,
        // Determinism: seed helps when supported; safe to include.
        seed: 42,
        input: [system, user],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "instant_estimate",
            schema,
            strict: true,
          },
        },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      return NextResponse.json({ ok: false, error: "openai_error", detail: t.slice(0, 2000) }, { status: 500 });
    }

    const data = (await res.json()) as unknown;
    const outputText = (data && typeof data === "object" && "output_text" in data) ? String((data as any).output_text || "") : "";

    let parsed: unknown = null;
    try {
      parsed = JSON.parse(outputText);
    } catch {
      return NextResponse.json({ ok: false, error: "bad_model_json", detail: outputText.slice(0, 2000) }, { status: 500 });
    }

    const rec = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    const rawLanes = Array.isArray(rec?.lanes) ? (rec!.lanes as unknown[]) : [];

    const lanes: ExtractedLane[] = rawLanes
      .filter((l) => l && typeof l === "object")
      .map((l) => {
        const lr = l as Record<string, unknown>;
        const title = typeof lr.title === "string" ? lr.title : "Other";
        const itemsRaw = Array.isArray(lr.items) ? (lr.items as unknown[]) : [];
        const items: LaneItem[] = itemsRaw
          .filter((it) => it && typeof it === "object")
          .map((it) => {
            const ir = it as Record<string, unknown>;
            const label = typeof ir.label === "string" ? ir.label : "";
            const note = typeof ir.note === "string" ? ir.note : undefined;
            const range = typeof ir.range === "string" ? ir.range : undefined;
            const id = typeof ir.id === "string" && ir.id ? ir.id : stableIdFor(label);
            return { id, label, note, range };
          })
          .filter((it) => it.label)
          .slice(0, 40);

        return { title, items };
      });

    const cleaned = dedupeLanes(lanes);

    return NextResponse.json({
      ok: true,
      summary: typeof rec?.summary === "string" ? String(rec.summary) : "",
      lanes: cleaned,
      used: "openai",
      extractedTextChars: extractedText.length,
    });
  } catch (e: unknown) {
    const msg = e && typeof e === "object" && "message" in e ? String((e as any).message) : String(e || "unknown");
    return NextResponse.json({ ok: false, error: "server_error", detail: msg }, { status: 500 });
  }
}
