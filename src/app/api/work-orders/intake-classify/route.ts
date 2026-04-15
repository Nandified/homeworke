import { NextResponse } from "next/server";

import taxonomy from "@/content/homeworke_services_taxonomy.json";

export const runtime = "nodejs";

type TaxService = (typeof taxonomy.services)[number];

function pickOutOfScopeUserMessage(inputText: string) {
  const t = (inputText || "").toLowerCase();
  const vibe: "playful" | "pro" = Math.random() < 0.5 ? "playful" : "pro";

  const bucket =
    /xbox|playstation|ps5|ps4|nintendo|switch|steam|game|gaming/.test(t)
      ? "gaming"
      : /laptop|computer|pc|mac|windows|linux|wifi|router|internet|bluetooth/.test(t)
        ? "computer"
        : /printer|scan|scanner|paper jam|toner|ink/.test(t)
          ? "printer"
          : /iphone|android|phone|ipad|tablet/.test(t)
            ? "phone"
            : "tech";

  const proLines: Record<string, string[]> = {
    gaming: [
      "We’re focused on home services right now (plumbing, electrical, HVAC, etc.). Gaming help is coming soon.",
      "Home services only for now — we’ll add gaming/tech support soon.",
    ],
    computer: [
      "We’re focused on home services right now (plumbing, electrical, HVAC, etc.). Tech support is coming soon.",
      "Home services only for now — computer/IT help is coming soon.",
    ],
    printer: [
      "We’re focused on home services right now — printer/IT help is coming soon.",
      "Home services only for now — tech support is coming soon.",
    ],
    phone: [
      "We’re focused on home services right now — mobile/tech support is coming soon.",
      "Home services only for now — tech support is coming soon.",
    ],
    tech: [
      "We’re focused on home services right now — tech support is coming soon.",
      "Home services only for now — tech support is coming soon.",
    ],
  };

  const playfulLines: Record<string, string[]> = {
    gaming: [
      "I can help with leaky pipes, not level-ups (yet). Home services only for now — gaming help is coming soon.",
      "I’m great with roofs, not raids (yet). Home services only for now — gaming help is coming soon.",
    ],
    computer: [
      "I can help with outlets, not Outlook (yet). Home services only for now — tech support is coming soon.",
      "I do plumbing, not PCs (yet). Home services only for now — tech support is coming soon.",
    ],
    printer: [
      "I can fix a leak faster than a printer can print (yet). Home services only for now — tech help is coming soon.",
      "I do drywall, not drivers (yet). Home services only for now — tech help is coming soon.",
    ],
    phone: [
      "I can help with water heaters, not screen protectors (yet). Home services only for now — tech help is coming soon.",
      "I do HVAC, not iOS (yet). Home services only for now — tech help is coming soon.",
    ],
    tech: [
      "I can help with home repairs, not tech repairs (yet). Home services only for now — tech help is coming soon.",
      "I’m your home-fix sidekick, not your IT department (yet). Home services only for now — tech help is coming soon.",
    ],
  };

  const pool = (vibe === "playful" ? playfulLines : proLines)[bucket] || (vibe === "playful" ? playfulLines.tech : proLines.tech);
  return pool[Math.floor(Math.random() * pool.length)] || proLines.tech[0];
}

type RateState = { windowStartMs: number; count: number };
function rateLimit(key: string, limit: number, windowMs: number): { ok: true } | { ok: false; remainingMs: number } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = globalThis as any;
  if (!g.__HW3_OOS_RATE__) g.__HW3_OOS_RATE__ = new Map<string, RateState>();
  const m: Map<string, RateState> = g.__HW3_OOS_RATE__;

  const now = Date.now();
  const st = m.get(key);
  if (!st || now - st.windowStartMs > windowMs) {
    m.set(key, { windowStartMs: now, count: 1 });
    return { ok: true };
  }

  if (st.count >= limit) {
    return { ok: false, remainingMs: windowMs - (now - st.windowStartMs) };
  }

  st.count++;
  m.set(key, st);
  return { ok: true };
}

function looksOutOfScope(text: string) {
  const t = (text || "").toLowerCase();
  return /xbox|playstation|ps5|ps4|nintendo|switch|steam|gaming|game\b|laptop|computer|pc\b|mac\b|printer|scanner|iphone|android|ipad|tablet|it\s+help|tech\s+support|wifi|router/.test(
    t
  );
}

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

  // Environmental / commercial diligence
  if (has(/\besa\b|environmental\s+site\s+assessment|\bphase\s*i\b|\bphase\s*ii\b|phase\s*1|phase\s*2|\bust\b|underground\s+storage\s+tank|soil\s+(test|testing)|groundwater\s+(test|testing)|contaminat|brownfield/)) {
    return find((s) => s.id === "mold-water-damage-environmental.environmental.esa-phase-i-ii") ||
      find((s) => s.id.startsWith("mold-water-damage-environmental."));
  }

  // Water intrusion can be plumbing OR roof. Use simple cues.
  if (has(/ceiling\s+leak|water\s+stain\s+on\s+ceiling|leaking\s+ceiling|water\s+coming\s+through\s+ceiling/)) {
    if (has(/rain|roof|attic|storm|shingles|gutter/)) return find((s) => s.id.startsWith("roofing."));
    return find((s) => s.id.startsWith("plumbing."));
  }

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

    const outOfScope = looksOutOfScope(text);

    // Limits to prevent people from spamming random out-of-scope prompts.
    // If we hit the limit, we return a local funny message without calling the model.
    if (outOfScope) {
      const key = (req.headers.get("x-forwarded-for") || "") + "|" + (req.headers.get("user-agent") || "");
      const lim = rateLimit(key, 6, 60 * 60 * 1000); // 6/hour
      if (!lim.ok) {
        return NextResponse.json({
          ok: true,
          used: "rate_limited",
          supported: false,
          userMessage: pickOutOfScopeUserMessage(text),
          serviceId: "",
          trade: "",
          category: "",
          subcategory: "",
          confidence: 0,
          aiSummary: text.trim(),
          urgency: "this_week",
          safetyFlags: [],
          clarifyingQuestions: [],
        });
      }
    }

    const sys =
      "You are Homeworke's Work Order Intake classifier. " +
      "We ONLY support home services from the provided catalog. " +
      "Given a short description, select the best matching service from the catalog. " +
      "Return STRICT JSON only (no markdown). " +
      "You must always provide all required fields. " +
      "If the request is OUT OF SCOPE (e.g., gaming help, laptop/computer repair, phone repair, IT help, printer setup), set supported=false and write a short, funny-but-helpful userMessage that references what they asked for. Use a 50/50 vibe: sometimes playful, sometimes pro. In that case, set serviceId/trade/category/subcategory to empty strings, confidence=0, and clarifyingQuestions=[]. " +
      "If uncertain about urgency, choose 'this_week'. If there are no safety flags, return an empty array. " +
      "When supported=true, always include 1-3 clarifyingQuestions (aim for 2) to confirm scope/safety and improve routing. " +
      "Write questions in simple homeowner language (no jargon). " +
      "If the user mentions ESA / Phase I / Phase II / underground storage tank (UST) / contamination or soil/groundwater testing, treat it like environmental due-diligence (often commercial) and DO NOT ask for 'where in the home (kitchen/bathroom/etc)'. Prefer asking about property type, timeline (closing), and any documents/records instead. " +
      "If the user reports a ceiling/wall leak or water stain and the source is ambiguous, your FIRST clarifying question should quickly disambiguate roof/rain intrusion vs plumbing: ask whether it happens during/after rain OR after using fixtures/appliances above (shower, toilet, dishwasher, washer). Also ask about electrical hazard if near lights/outlets.";

    const schema = {
      type: "object",
      additionalProperties: false,
      required: [
        "supported",
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
        supported: { type: "boolean" },
        userMessage: { type: "string" },
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
        max_output_tokens: outOfScope ? 180 : 450,
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
      // If the model fails to return structured JSON, degrade gracefully with a friendly message.
      return NextResponse.json({
        ok: true,
        used: "openai",
        supported: false,
        userMessage: pickOutOfScopeUserMessage(text),
        serviceId: "",
        trade: "",
        category: "",
        subcategory: "",
        confidence: 0,
        aiSummary: text.trim(),
        urgency: "this_week",
        safetyFlags: [],
        clarifyingQuestions: [],
      });
    }

    // Ensure out-of-scope replies always have a friendly message.
    if ((out as any).supported === false && !(out as any).userMessage) {
      (out as any).userMessage = pickOutOfScopeUserMessage(text);
    }

    return NextResponse.json({ ok: true, used: "openai", ...out });
  } catch (e) {
    const msg = e && typeof e === "object" && "message" in e ? String((e as any).message) : "";
    return NextResponse.json({ ok: false, error: "server_error", detail: msg.slice(0, 300) }, { status: 500 });
  }
}
