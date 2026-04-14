import { NextResponse } from "next/server";

import taxonomy from "@/content/homeworke_services_taxonomy.json";

export const runtime = "nodejs";

type TaxService = (typeof taxonomy.services)[number];

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractJsonObject(text: string): string | null {
  const s = (text || "").trim();
  if (!s) return null;
  // Fast path
  if (s.startsWith("{") && s.endsWith("}")) return s;
  // Try to find the first {...} block
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) return s.slice(start, end + 1);
  return null;
}

function collectTextFromResponse(j: any): string {
  const direct = typeof j?.output_text === "string" ? j.output_text : "";
  if (direct.trim()) return direct;
  const out = Array.isArray(j?.output) ? j.output : [];
  const parts: string[] = [];
  for (const item of out) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const c of content) {
      const txt = (c && typeof c.text === "string" ? c.text : "").trim();
      if (txt) parts.push(txt);
    }
  }
  return parts.join("\n").trim();
}

function pickFallback(text: string, services: TaxService[]) {
  const t = (text || "").toLowerCase();
  const has = (re: RegExp) => re.test(t);
  const find = (pred: (s: TaxService) => boolean) => services.find(pred) || null;

  if (has(/leak|clog|toilet|faucet|pipe|drain|sewer|garbage disposal/))
    return find((s) => s.id.startsWith("plumbing."));
  if (has(/outlet|breaker|electrical|wiring|switch|light fixture|ceiling fan|panel/))
    return find((s) => s.id.startsWith("electrical."));
  if (has(/ac\b|a\/c|air conditioner|no heat|no cool|furnace|hvac|thermostat|duct/))
    return find((s) => s.id.startsWith("hvac."));
  if (has(/washer|dryer|dishwasher|refrigerator|fridge|oven|range|microwave/))
    return find((s) => s.id.startsWith("appliance-repair-install."));
  if (has(/cleaning|deep clean|move out|move-out|turnover|carpet/))
    return find((s) => s.id.startsWith("cleaning-turnover."));

  return null;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY_WORK_ORDERS || process.env.OPENAI_API_KEY || "";

    const body = await req.json().catch(() => null);
    const text = (body?.text ?? body?.input?.text ?? "").toString();

    if (!text.trim()) {
      return NextResponse.json({ ok: false, error: "missing_text" }, { status: 400 });
    }

    const services = taxonomy.services as TaxService[];

    // If no OpenAI key (e.g. local/dev), return a lightweight heuristic fallback.
    if (!apiKey) {
      const s = pickFallback(text, services);
      if (!s) {
        return NextResponse.json({ ok: true, used: "fallback", confidence: 0.2, aiSummary: text.trim() });
      }
      return NextResponse.json({
        ok: true,
        used: "fallback",
        serviceId: s.id,
        trade: s.trade,
        category: s.category,
        subcategory: s.label,
        confidence: 0.35,
        aiSummary: text.trim(),
        clarifyingQuestions: [],
      });
    }

    // Keep the list compact: id + trade/category/label only.
    const catalog = services
      .map((s) => ({ serviceId: s.id, trade: s.trade, category: s.category, subcategory: s.label }))
      .slice(0, 2000);

    const sys =
      "You are Homeworke's Work Order Intake classifier. " +
      "Given a short description of a home issue, select the best matching service from the provided catalog. " +
      "Return STRICT JSON only (no markdown). " +
      "You must always provide all required fields. " +
      "If uncertain about urgency, choose 'this_week'. If there are no safety flags, return an empty array. " +
      "If there are no clarifying questions needed, return an empty array.";

    const schema = {
      type: "object",
      additionalProperties: false,
      required: [
        "serviceId",
        "trade",
        "category",
        "subcategory",
        "confidence",
        "aiSummary",
        "urgency",
        "safetyFlags",
        "clarifyingQuestions",
      ],
      properties: {
        serviceId: { type: "string" },
        trade: { type: "string" },
        category: { type: "string" },
        subcategory: { type: "string" },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        aiSummary: { type: "string" },
        urgency: { type: "string", enum: ["emergency", "asap", "this_week", "flexible"] },
        safetyFlags: { type: "array", items: { type: "string" } },
        clarifyingQuestions: { type: "array", items: { type: "string" }, maxItems: 3 },
      },
    };

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.4-mini",
        max_output_tokens: 450,
        // Enforce structured JSON output.
        text: {
          format: {
            type: "json_schema",
            name: "work_order_intake_classify",
            schema,
            strict: true,
          },
        },
        input: [
          { role: "system", content: sys },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  "Catalog (choose exactly one):\n" +
                  JSON.stringify(catalog) +
                  "\n\nUser description:\n" +
                  text.trim(),
              },
            ],
          },
        ],
      }),
    });

    const raw = await res.text().catch(() => "");
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `openai_failed_${res.status}`, detail: (raw || "").slice(0, 400) },
        { status: 502 }
      );
    }

    const j = safeJson(raw) || {};
    const outText = collectTextFromResponse(j);
    const jsonBlob = extractJsonObject(outText) || outText;
    const out = safeJson(jsonBlob) || null;

    if (!out || typeof out !== "object") {
      return NextResponse.json(
        { ok: false, error: "bad_model_output", detail: (outText || raw).slice(0, 400) },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, used: "openai", ...out });
  } catch (e) {
    const msg = e && typeof e === "object" && "message" in e ? String((e as any).message) : "";
    return NextResponse.json({ ok: false, error: "server_error", detail: msg.slice(0, 300) }, { status: 500 });
  }
}
