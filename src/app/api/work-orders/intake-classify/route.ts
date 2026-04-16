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
      "We handle home services (plumbing, electrical, HVAC, etc.) — not gaming help.",
      "Home services only — we don’t do gaming/tech support.",
    ],
    computer: [
      "We handle home services (plumbing, electrical, HVAC, etc.) — not computer/IT support.",
      "Home services only — we don’t do computer/IT support.",
    ],
    printer: [
      "Home services only — we don’t do printer/IT support.",
      "We handle home repairs — not printer setup.",
    ],
    phone: [
      "Home services only — we don’t do phone/tablet support.",
      "We handle home repairs — not mobile tech support.",
    ],
    tech: [
      "Home services only — we don’t do tech support.",
      "We handle home repairs — not IT help.",
    ],
  };

  const playfulLines: Record<string, string[]> = {
    gaming: [
      "I can help with leaky pipes, not level-ups. Try me with a home issue.",
      "I’m great with roofs, not raids. Home services only.",
      "I fix houses, not high scores. What’s going on at the property?",
    ],
    computer: [
      "I can help with outlets, not Outlook. Home services only.",
      "I do plumbing, not PCs. Try me with a home repair.",
      "I’m handy with hammers, not hardware drivers. Home services only.",
    ],
    printer: [
      "I can fix a leak faster than a printer can print. Home services only.",
      "I do drywall, not drivers. Home services only.",
    ],
    phone: [
      "I do HVAC, not iOS. Home services only.",
      "I can help with water heaters, not screen protectors. Home services only.",
    ],
    tech: [
      "I’m your home-fix sidekick, not your IT department. Home services only.",
      "I can help with home repairs, not tech repairs. What’s the home issue?",
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

const STOPWORDS = new Set(
  "a an the and or but if then else is are was were be been being to of in on at for from with without about into over under my your our his her their this that these those it its i me we you they them he she".split(
    /\s+/
  )
);

function normalizeToken(w: string) {
  let x = (w || "").toLowerCase().trim();
  if (x === "ac" || x === "a/c") x = "hvac";
  // very light stemming
  if (x.endsWith("ing") && x.length > 5) x = x.slice(0, -3);
  else if (x.endsWith("ed") && x.length > 4) x = x.slice(0, -2);
  else if (x.endsWith("es") && x.length > 4) x = x.slice(0, -2);
  else if (x.endsWith("s") && x.length > 3) x = x.slice(0, -1);

  const synonyms: Record<string, string> = {
    resurface: "refinish",
    resurfacing: "refinish",
    refinish: "refinish",
    refinishing: "refinish",
    restain: "stain",
    restaining: "stain",
    stain: "stain",
    hardwood: "hardwood",
    floor: "floor",
    flooring: "floor",
    tiles: "tile",
  };

  return synonyms[x] || x;
}

function tokenize(text: string) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((w) => normalizeToken(w))
    .filter(Boolean)
    .filter((w) => w.length >= 2)
    .filter((w) => !STOPWORDS.has(w));
}

function scoreService(inputText: string, tokens: string[], s: TaxService) {
  const hay = `${s.trade} ${s.category} ${s.label} ${s.id}`.toLowerCase();
  let score = 0;

  const wantsFloor = /\bfloor\b|flooring|hardwood|tile|laminate|vinyl|carpet|refinish|resurface|restain|stain/.test(inputText);
  const wantsCabinet = /cabinet|cabinetry/.test(inputText);

  // Strong phrase boosts (only when the service itself is relevant)
  const phrases: Array<{ re: RegExp; pts: number; serviceHint: RegExp }> = [
    { re: /garage\s+door/, pts: 8, serviceHint: /garage\s+door|garage-door|garage\s*doors/ },
    { re: /tv\s+mount/, pts: 8, serviceHint: /tv\s+mount|tv-mount/ },
    { re: /roof\s+replacement|replace\s+.*roof|new\s+roof|re\s*roof|reroof/, pts: 8, serviceHint: /\broof\b|roofing/ },
    { re: /water\s+heater/, pts: 7, serviceHint: /water\s+heater|water-heater/ },
    { re: /sump\s+pump/, pts: 7, serviceHint: /sump\s+pump|sump-pump/ },
    { re: /circuit\s+breaker|electrical\s+panel/, pts: 7, serviceHint: /electrical|panel|breaker/ },
    {
      re: /hardwood\s+floor|floor\s+refinish|re\s*stain|resurface\s+.*floor|floor\s+resurface/,
      pts: 7,
      serviceHint: /\bfloor\b|flooring|hardwood|refinish|stain/,
    },
  ];
  for (const p of phrases) {
    if (!p.re.test(inputText)) continue;
    if (p.serviceHint.test(hay)) score += p.pts;
  }

  // Token overlap
  for (const tok of tokens) {
    if (!hay.includes(tok)) continue;
    // Weight common trade tokens slightly less
    if (/(repair|install|replacement|maintenance|service)/.test(tok)) score += 1;
    else score += 2;
  }

  // Slight preference for closer namespace matches
  for (const tok of tokens) {
    if (s.id.toLowerCase().includes(tok)) score += 1;
  }

  // Disambiguation: if the user says floor/resurface and NOT cabinets, avoid cabinet refinishing.
  const isCabinetService = /cabinet/.test(hay);
  if (wantsFloor && !wantsCabinet && isCabinetService) score -= 6;
  // Conversely, if they explicitly mention cabinets, boost cabinet services a bit.
  if (wantsCabinet && isCabinetService) score += 4;

  return score;
}

function pickFallback(text: string, services: TaxService[]) {
  const input = (text || "").toLowerCase();
  const tokens = tokenize(input);
  if (!tokens.length) return null;

  let best: { s: TaxService; score: number } | null = null;
  for (const s of services) {
    const score = scoreService(input, tokens, s);
    if (!best || score > best.score) best = { s, score };
  }

  // Require at least a small signal; otherwise return null and ask a clarifying question.
  if (!best || best.score < 2) return null;
  return best.s;
}

function fallbackQuestions(inputText: string, s: TaxService | null): string[] {
  const t = (inputText || "").toLowerCase();

  // Always ask 2-3 to keep the concierge flow even when the LLM is down.
  if (!s) {
    return [
      "Quick detail so I route this right: what exactly needs help?",
      "Where is it (room/area)?",
      "Anything time-sensitive or safety-related (active leak, sparks, smell of gas)?",
    ];
  }

  // Trade-specific prompts (simple, homeowner language)
  const trade = (s.trade || "").toLowerCase();

  if (trade.includes("roof")) {
    return [
      "Is this repair/maintenance, or a full replacement?",
      "Any active leaks or interior water staining?",
      "Is it a house, townhouse, or multi-unit building?",
    ];
  }

  if (trade.includes("plumb")) {
    return [
      "Is there an active leak right now?",
      "Where is it (kitchen, bathroom, basement, etc.)?",
      "Do you know the fixture (toilet, faucet, water heater, pipe, drain)?",
    ];
  }

  if (trade.includes("electrical")) {
    return [
      "What’s happening (no power, tripping breaker, flickering, outlet not working)?",
      "Any burning smell/heat/sparks?",
      "Which area of the home is affected?",
    ];
  }

  if (trade.includes("hvac")) {
    return [
      "Is this AC, heat, or airflow/duct issue?",
      "Any error code on the thermostat or unusual noise?",
      "When did it start — suddenly or getting worse over time?",
    ];
  }

  if (trade.includes("floor")) {
    return [
      "What kind of flooring is it (hardwood, tile, laminate, vinyl, carpet)?",
      "Is this repair, refinishing/resurfacing, or replacement?",
      "Roughly how many rooms or square feet?",
    ];
  }

  if (trade.includes("paint")) {
    return [
      "Is this interior or exterior?",
      "Are we painting everything or just touch-ups/trim?",
      "Any peeling, water damage, or repairs needed first?",
    ];
  }

  if (trade.includes("handyman")) {
    // Special-case TV mounting
    if (/tv\s+mount/.test(t) || (s.category || "").toLowerCase().includes("tv")) {
      return [
        "What size TV is it (approx.) and what type of wall (drywall, brick, concrete)?",
        "Do you want the mount installed too, or do you already have one?",
        "Any cable concealment needed?",
      ];
    }

    return [
      "What exactly needs to be done?",
      "Where is it (room/area)?",
      "Do you have any photos/videos that show the issue?",
    ];
  }

  if (trade.includes("garage doors")) {
    return [
      "Is the door stuck open/closed, or moving but not fully?",
      "Do you hear the motor running or clicking when you try to open it?",
      "Any obvious broken spring/cable/roller?",
    ];
  }

  // Default
  return [
    "What’s the main goal (repair, replace, install, or diagnose)?",
    "Where in the home is it?",
    "When would you like someone to come out?",
  ];
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
        return NextResponse.json({
          ok: true,
          used: "fallback_no_key",
          supported: true,
          serviceId: "",
          trade: "",
          category: "",
          subcategory: "",
          confidence: 0.2,
          aiSummary: text.trim(),
          urgency: "this_week",
          safetyFlags: [],
          clarifyingQuestions: fallbackQuestions(text, null).slice(0, 3),
        });
      }
      return NextResponse.json({
        ok: true,
        used: "fallback_no_key",
        supported: true,
        serviceId: s.id,
        trade: s.trade,
        category: s.category,
        subcategory: s.label,
        confidence: 0.35,
        aiSummary: text.trim(),
        urgency: "this_week",
        safetyFlags: [],
        clarifyingQuestions: fallbackQuestions(text, s).slice(0, 3),
      });
    }

    // Keep the list compact: id + trade/category/label only.
    const catalog = services
      .map((s) => ({ serviceId: s.id, trade: s.trade, category: s.category, subcategory: s.label }))
      .slice(0, 2000);

    const outOfScope = looksOutOfScope(text);

    // Note: no local rate limiting here; rely on provider limits/quota.
    // (We still keep graceful fallbacks on OpenAI failures.)

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

    const model =
      process.env.OPENAI_MODEL_WORK_ORDERS ||
      process.env.OPENAI_MODEL ||
      "gpt-4o-mini";

    const prompt =
      "Catalog (choose exactly one):\n" + JSON.stringify(catalog) + "\n\nUser description:\n" + text.trim();

    // Use Chat Completions for maximum compatibility/reliability.
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: outOfScope ? 0.7 : 0.2,
        max_tokens: outOfScope ? 220 : 520,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: sys },
          { role: "user", content: prompt },
        ],
      }),
    });

    const raw = await res.text().catch(() => "");
    if (!res.ok) {
      try {
        console.log("[intake-classify] openai_failed", res.status, (raw || "").slice(0, 200));
      } catch {}

      // Degrade gracefully to heuristic routing so real home-service requests don't hard-fail.
      const s = pickFallback(text, services);
      if (s) {
        return NextResponse.json({
          ok: true,
          used: `fallback_openai_failed_${res.status}`,
          supported: true,
          serviceId: s.id,
          trade: s.trade,
          category: s.category,
          subcategory: s.label,
          confidence: 0.22,
          aiSummary: text.trim(),
          urgency: "this_week",
          safetyFlags: [],
          clarifyingQuestions: fallbackQuestions(text, s).slice(0, 3),
        });
      }

      return NextResponse.json({
        ok: true,
        used: `fallback_openai_failed_${res.status}`,
        supported: true,
        serviceId: "",
        trade: "",
        category: "",
        subcategory: "",
        confidence: 0.1,
        aiSummary: text.trim(),
        urgency: "this_week",
        safetyFlags: [],
        clarifyingQuestions: fallbackQuestions(text, null).slice(0, 3),
      });
    }

    const j = safeJson(raw) || {};
    const outText = typeof j?.choices?.[0]?.message?.content === "string" ? j.choices[0].message.content : "";
    const jsonBlob = extractJsonObject(outText) || outText;
    const out = safeJson(jsonBlob) || null;

    // Log token usage for cost monitoring (never returned to users)
    try {
      if (j?.usage) {
        console.log("[intake-classify] usage", j.usage);
      }
    } catch {}

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

    // Guardrail: never mark common in-scope home issues as out-of-scope.
    const inScopeHint = /(\bac\b|a\/c|air\s+conditioner|hvac|furnace|thermostat|no\s+heat|no\s+cool|plumb|leak|toilet|drain|electrical|breaker|outlet|roof|shingle|garage\s+door|floor|hardwood|drywall|paint)/i.test(
      text
    );

    if ((out as any).supported === false && inScopeHint) {
      // Force to supported + route using deterministic fallback (keeps UX moving)
      const s = pickFallback(text, services);
      return NextResponse.json({
        ok: true,
        used: "openai_override_in_scope",
        supported: true,
        serviceId: s?.id || "",
        trade: s?.trade || "",
        category: s?.category || "",
        subcategory: s?.label || "",
        confidence: Math.max(0.35, Number((out as any).confidence || 0) || 0.35),
        aiSummary: (out as any).aiSummary || text.trim(),
        urgency: (out as any).urgency || "this_week",
        safetyFlags: Array.isArray((out as any).safetyFlags) ? (out as any).safetyFlags : [],
        clarifyingQuestions: fallbackQuestions(text, s || null).slice(0, 3),
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
