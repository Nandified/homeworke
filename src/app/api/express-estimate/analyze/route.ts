import { NextResponse } from "next/server";

export const runtime = "nodejs";

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import pdf from "pdf-parse";

import { db, dbEnabled } from "@/lib/db";

type EvidenceThumb = { src: string; caption?: string };

type LaneItem = {
  id: string;
  label: string;
  note?: string;
  range?: string;
  price?: number;
  evidence?: EvidenceThumb[];
};

type ExtractedLane = {
  title: string;
  items: LaneItem[];
};

type UsageCost = {
  model: string;
  estInputTokens: number;
  estOutputTokens: number;
  estCostUsd: number;
};

type AnalyzeCacheMeta = {
  cacheKey: string;
  pdfHash: string;
  locationKey: string;
  expiresAt?: string;
  cached?: boolean;
};

type AnalyzeUsage = {
  pdfBytes: number;
  extractedTextChars: number;
  hash: string;
  calls: UsageCost[];
  estTotalCostUsd: number;
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

function estimateTokensFromChars(chars: number) {
  // Rule of thumb; good enough for budgeting dashboards.
  return Math.max(0, Math.round(chars / 4));
}

// OpenAI pricing (USD per 1M tokens). Source: https://developers.openai.com/api/docs/pricing (as of 2026-04-01).
// NOTE: gpt-4.1 is no longer listed on the current pricing page; use current flagship models.
const PRICING_PER_1M: Record<string, { input: number; output: number }> = {
  "gpt-5.4": { input: 2.5, output: 15 },
  "gpt-5.4-mini": { input: 0.75, output: 4.5 },
};

function costUsd(model: string, estInputTokens: number, estOutputTokens: number) {
  const p = PRICING_PER_1M[model];
  if (!p) return 0;
  return (estInputTokens / 1_000_000) * p.input + (estOutputTokens / 1_000_000) * p.output;
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

function normalizeLaneTitle(title: string): ExtractedLane["title"] {
  const t = (title || "").toLowerCase().trim();
  if (t.includes("exterior")) return "Exterior";
  if (t.includes("interior")) return "Interior";
  if (t.includes("system")) return "Systems";
  if (t.includes("safety")) return "Safety";
  if (t.includes("need")) return "Need more info";
  if (t.includes("info")) return "Need more info";
  return "Other";
}

function parseMoney(s: string): number | null {
  const t = (s || "").replace(/,/g, "").trim();
  const m = t.match(/\$?\s*([0-9]+(?:\.[0-9]+)?)(k|m)?/i);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  const suf = (m[2] || "").toLowerCase();
  const mult = suf === "k" ? 1000 : suf === "m" ? 1_000_000 : 1;
  return n * mult;
}

function formatUsdCompact(n: number) {
  const rounded = Math.round(n);
  return `$${rounded.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function scaleRange(range: string, factor: number): string {
  const r = (range || "").replace(/–/g, "-");
  const parts = r.split("-").map((p) => p.trim());
  if (parts.length >= 2) {
    const a = parseMoney(parts[0]);
    const b = parseMoney(parts[1]);
    if (a !== null && b !== null) {
      const lo = a * factor;
      const hi = b * factor;
      return `${formatUsdCompact(lo)}–${formatUsdCompact(hi)}`;
    }
    const one = (a ?? b);
    if (one !== null) return formatUsdCompact(one * factor);
    return range;
  }
  const one = parseMoney(r);
  if (one !== null) return formatUsdCompact(one * factor);
  return range;
}

function midpointFromRange(range: string): number | null {
  const r = (range || "").replace(/–/g, "-");
  const parts = r.split("-").map((p) => p.trim());
  if (parts.length >= 2) {
    const a = parseMoney(parts[0]);
    const b = parseMoney(parts[1]);
    if (a !== null && b !== null) return Math.round((a + b) / 2);
    return a ?? b;
  }
  return parseMoney(r);
}

function fillMissingRange(label: string, location: string): string {
  const l = normalizeLabel(label);
  // Lightweight fallback ranges to avoid $0 totals when the model omits pricing.
  // These are intentionally broad.
  const rules: Array<{ re: RegExp; range: string }> = [
    // Roof / chimney (split into more specific buckets to avoid identical pricing everywhere)
    { re: /chimney\s+cap|install\s+cap|missing\s+cap/, range: "$180–$750" },
    { re: /chimney\s+cricket|install\s+cricket/, range: "$600–$2,400" },
    { re: /chimney\s+flashing|counter\s+flashing|step\s+flashing/, range: "$350–$1,800" },
    { re: /roof\s+flashing|flashing\s+install|flashing\s+repair/, range: "$250–$1,500" },
    { re: /replace\s+missing\s+shingles|missing\s+shingles|shingle\s+repair/, range: "$200–$1,200" },
    { re: /roof\s+sheathing|sheathing\s+repair|decking/, range: "$900–$4,500" },
    { re: /roof\b|roofing|shingles|soffit|fascia/, range: "$450–$3,200" },

    { re: /foundation|masonry|parging|brick|tuckpoint/, range: "$600–$4,500" },
    { re: /gutter|downspout/, range: "$250–$1,600" },
    { re: /hvac|furnace|ac|air conditioner|heat pump/, range: "$180–$2,200" },
    { re: /plumb|leak|water heater|sump/, range: "$200–$2,800" },
    { re: /electrical|panel|outlet|gfci|breaker/, range: "$180–$1,800" },
    { re: /window|door|screen/, range: "$150–$1,500" },
    { re: /paint|drywall|trim|baseboard/, range: "$200–$2,500" },
    { re: /floor|tile|carpet/, range: "$250–$3,500" },
    { re: /grading|drainage/, range: "$400–$3,000" },
    { re: /garage/, range: "$250–$3,500" },
  ];
  for (const r of rules) {
    if (r.re.test(l)) return r.range;
  }
  // Default broad handyman range
  return "$250–$1,500";
}

function dedupeLanes(lanes: ExtractedLane[], location: string, marketFactor = 1): ExtractedLane[] {
  const seen = new Set<string>();
  const homeownerFactor = 1.25; // Homeworke keeps 20% of final price => contractor gets 80%
  const totalFactor = homeownerFactor * (Number.isFinite(marketFactor) && marketFactor > 0 ? marketFactor : 1);

  return lanes
    .map((lane) => {
      const items = lane.items
        .map((it) => {
          const baseRange = it.range && it.range.trim() ? it.range : fillMissingRange(it.label, location);
          const range = scaleRange(baseRange, totalFactor);

          // If model provided a price, assume it's base contractor cost and scale it.
          const basePrice = typeof it.price === "number" && Number.isFinite(it.price) ? it.price : midpointFromRange(baseRange) ?? undefined;
          const price = typeof basePrice === "number" ? Math.round(basePrice * totalFactor) : undefined;

          return { ...it, range, price };
        })
        .filter((it) => {
          const key = normalizeLabel(it.label);
          if (!key) return false;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      return { ...lane, title: normalizeLaneTitle(lane.title), items };
    })
    .filter((l) => l.items.length > 0);
}

function chunkText(text: string, maxChars = 45_000) {
  // If the client included page sentinels, split on them.
  const hasPages = /\[PAGE\s+\d+\]/.test(text);
  const blocks = hasPages
    ? text
        .split(/(?=\[PAGE\s+\d+\])/g)
        .map((s) => s.trim())
        .filter(Boolean)
    : text
        .split(/\n{2,}/g)
        .map((s) => s.trim())
        .filter(Boolean);

  const chunks: string[] = [];
  let cur = "";
  for (const b of blocks) {
    if (!b) continue;
    // If a single block exceeds maxChars, hard-slice it so we don't exceed context.
    if (!cur && b.length > maxChars) {
      for (let i = 0; i < b.length; i += maxChars) {
        chunks.push(b.slice(i, i + maxChars));
        if (chunks.length >= 24) return chunks;
      }
      continue;
    }

    if ((cur + "\n\n" + b).length > maxChars && cur) {
      chunks.push(cur);
      cur = b;
    } else {
      cur = cur ? cur + "\n\n" + b : b;
    }

    if (chunks.length >= 24) break;
  }
  if (cur && chunks.length < 24) chunks.push(cur);
  return chunks;
}

function normalizeLocationKey(location: string) {
  return (location || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function computeCacheKey(pdfHash: string, location: string) {
  const loc = normalizeLocationKey(location);
  return crypto.createHash("sha256").update(`${pdfHash}|${loc}`).digest("hex");
}

async function readCache(cacheKey: string) {
  // Prefer DB cache when available (stable across Vercel instances)
  if (dbEnabled()) {
    try {
      const row = await db().expressEstimateCache.findUnique({ where: { cacheKey } });
      if (!row) return null;
      if (row.expiresAt && row.expiresAt.getTime() < Date.now()) return null;
      const j = row.payload as any;
      if (j && j.ok === true && Array.isArray(j.lanes)) return j;
      return null;
    } catch {
      // fall back to /tmp
    }
  }

  try {
    const dir = path.join("/tmp", "hw_ai_cache_v1");
    const p = path.join(dir, `${cacheKey}.json`);
    const raw = await fs.readFile(p, "utf8");
    const j = JSON.parse(raw) as any;
    if (j && j.ok === true && Array.isArray(j.lanes)) return j;
    return null;
  } catch {
    return null;
  }
}

async function writeCache(cacheKey: string, payload: unknown, pdfHash: string, location: string) {
  if (dbEnabled()) {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      // Include expiresAt inside payload for UI.
      const withMeta = (() => {
        if (payload && typeof payload === "object") {
          const p = payload as any;
          p.cache = p.cache || { cacheKey, pdfHash, locationKey: normalizeLocationKey(location) };
          p.cache.expiresAt = expiresAt.toISOString();
          return p;
        }
        return payload as any;
      })();

      await db().expressEstimateCache.upsert({
        where: { cacheKey },
        create: { cacheKey, pdfHash, location: normalizeLocationKey(location), payload: withMeta as any, expiresAt },
        update: { payload: withMeta as any, expiresAt },
      });
      return;
    } catch {
      // fall back to /tmp
    }
  }

  try {
    const dir = path.join("/tmp", "hw_ai_cache_v1");
    await fs.mkdir(dir, { recursive: true });
    const p = path.join(dir, `${cacheKey}.json`);
    await fs.writeFile(p, JSON.stringify(payload), "utf8");
  } catch {
    // ignore
  }
}

async function callOpenAIJsonSchema(args: {
  apiKey: string;
  model: string;
  temperature?: number;
  seed?: number;
  schemaName: string;
  schema: unknown;
  system: string;
  user: string;
}) {
  const temperature = typeof args.temperature === "number" ? args.temperature : 0;

  // Some model endpoints (and some org configurations) reject `response_format`.
  // We enforce JSON-only via prompt + post-parse instead.
  const system =
    args.system +
    "\n\nOutput rules: Return ONLY valid JSON. No markdown, no explanations, no trailing text.";

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: args.model,
      temperature,
      input: [
        { role: "system", content: system },
        { role: "user", content: args.user },
      ],
    }),
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    const detail = (text || "(empty error body from OpenAI)").slice(0, 2000);
    return { ok: false as const, status: res.status, detail };
  }

  let parsedRes: any = null;
  try {
    parsedRes = JSON.parse(text);
  } catch {
    return { ok: false as const, status: 500, detail: text.slice(0, 2000) };
  }

  // Responses API can return `output_text`, but some variants return structured `output` blocks.
  const outputText = (() => {
    const ot = typeof parsedRes?.output_text === "string" ? parsedRes.output_text : "";
    if (ot && ot.trim()) return ot;

    const out = Array.isArray(parsedRes?.output) ? parsedRes.output : [];
    for (const item of out) {
      if (!item || typeof item !== "object") continue;
      const content = Array.isArray((item as any).content) ? (item as any).content : [];
      for (const c of content) {
        const t = typeof c?.text === "string" ? c.text : "";
        if (t && t.trim()) return t;
      }
    }
    return "";
  })();

  let json: any = null;
  try {
    json = JSON.parse(outputText);
  } catch {
    // Try to salvage the first JSON object/array if the model leaked extra text.
    const m = outputText.match(/\{[\s\S]*\}$/) || outputText.match(/\[[\s\S]*\]$/);
    if (m) {
      try {
        json = JSON.parse(m[0]);
      } catch {
        return { ok: false as const, status: 500, detail: `non_json_output: ${outputText.slice(0, 2000)}` };
      }
    } else {
      return {
        ok: false as const,
        status: 500,
        detail: `missing_or_non_json_output: ${outputText ? outputText.slice(0, 500) : "(no text output)"} | raw: ${text.slice(0, 1500)}`,
      };
    }
  }

  // Estimated usage (we don't rely on exact token counts; we compute for admin dashboards).
  const estIn = estimateTokensFromChars((args.system.length + args.user.length) || 0);
  const estOut = estimateTokensFromChars(outputText.length || 0);

  return {
    ok: true as const,
    json,
    usage: {
      model: args.model,
      estInputTokens: estIn,
      estOutputTokens: estOut,
      estCostUsd: costUsd(args.model, estIn, estOut),
    },
  };
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const files = form.getAll("file").filter((f) => f instanceof File) as File[];
    const textOverride = String(form.get("text") || "");
    const hashOverride = String(form.get("hash") || "").trim();
    const cacheKeyOverride = String(form.get("cacheKey") || "").trim();
    const force = String(form.get("force") || "").trim() === "1";
    const notes = String(form.get("notes") || "");
    const location = String(form.get("location") || "");

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: true, ...demoResult(location), used: "demo" });
    }

    let extractedText = "";
    let hash = "";
    let pdfBytes = 0;

    // Optionally rerun using a previous cached entry (even if expired) without requiring the PDF upload again.
    if (!textOverride.trim() && !file && cacheKeyOverride && dbEnabled()) {
      const row = await db().expressEstimateCache.findUnique({ where: { cacheKey: cacheKeyOverride } });
      const src = (row?.payload as any)?.source?.extractedText;
      const loc = (row?.payload as any)?.source?.location;
      if (row && typeof src === "string" && src.trim()) {
        extractedText = src.trim();
        hash = row.pdfHash;
        pdfBytes = 0;
        // Override location with whatever the cached run used (so pricing market stays consistent).
        (form as any).set?.("location", loc || row.location || "");
      } else {
        return NextResponse.json({ ok: false, error: "cache_missing_source", detail: "Could not rerun: missing cached source text." }, { status: 400 });
      }
    }

    if (!extractedText) {
      if (textOverride.trim()) {
        extractedText = textOverride.trim();
        hash = hashOverride || crypto.createHash("sha256").update(extractedText).digest("hex");
        pdfBytes = 0;
      } else {
        const inputFiles = files.length ? files : file instanceof File ? [file] : [];
        if (!inputFiles.length) {
          return NextResponse.json({ ok: false, error: "missing_file" }, { status: 400 });
        }

        async function ocrImageToText(buf: Buffer, mime: string): Promise<string> {
          const b64 = buf.toString("base64");
          const sys =
            "You are performing OCR. Extract ALL readable text from the image. " +
            "Preserve order as best as possible. Return plain text only.";

          const res = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gpt-5.4-mini",
              max_output_tokens: 1800,
              input: [
                { role: "system", content: sys },
                {
                  role: "user",
                  content: [
                    { type: "input_text", text: "OCR this image." },
                    { type: "input_image", image_url: `data:${mime};base64,${b64}` },
                  ],
                },
              ],
            }),
          });

          const t = await res.text().catch(() => "");
          if (!res.ok) throw new Error(`openai_ocr_failed_${res.status}: ${(t || "").slice(0, 400)}`);
          const j = JSON.parse(t);

          // Prefer the convenience field when present, but also support the standard Responses shape.
          const direct = j?.output_text;
          if (typeof direct === "string" && direct.trim()) return direct.trim();

          const parts: string[] = [];
          const out = Array.isArray(j?.output) ? j.output : [];
          for (const item of out) {
            const content = Array.isArray(item?.content) ? item.content : [];
            for (const c of content) {
              const txt = (c && typeof c.text === "string" ? c.text : "").trim();
              if (txt) parts.push(txt);
            }
          }
          return parts.join("\n").trim();
        }

        const texts: string[] = [];
        const hashes: string[] = [];

        for (const f of inputFiles) {
          const mime = String((f as any).type || "");
          const buf = Buffer.from(await f.arrayBuffer());
          hashes.push(crypto.createHash("sha256").update(buf).digest("hex"));

          if (mime.startsWith("image/")) {
            const t = await ocrImageToText(buf, mime);
            if (t) texts.push(t);
            continue;
          }

          // Assume PDF
          pdfBytes += buf.length;
          const parsedPdf = await pdf(buf);
          const t = String(parsedPdf?.text || "").replace(/\u0000/g, "").trim();
          if (t) texts.push(t);
        }

        extractedText = texts.join("\n\n---\n\n").trim();
        hash = hashOverride || crypto.createHash("sha256").update(hashes.join("|")).digest("hex");

        if (!extractedText) {
          return NextResponse.json(
            { ok: false, error: "no_text_extracted", detail: "Could not extract readable text from the uploaded files." },
            { status: 422 }
          );
        }
      }
    }

    // Cache by (pdfHash + location) so the same PDF priced in different markets can differ.
    const cacheKey = cacheKeyOverride || computeCacheKey(hash, location);
    const locationKey = normalizeLocationKey(location);

    // ---- Market adjustment (ZIP-based; ACS median household income proxy) ----
    const market = (() => {
      const zip = (location.match(/\b(\d{5})\b/) || [])[1] || "";
      const st = (location.match(/,\s*([A-Z]{2})\s*\d{5}\b/) || [])[1] || "";
      return { zip, state: st };
    })();

    const STATE_FIPS: Record<string, string> = {
      AL: "01",
      AK: "02",
      AZ: "04",
      AR: "05",
      CA: "06",
      CO: "08",
      CT: "09",
      DE: "10",
      DC: "11",
      FL: "12",
      GA: "13",
      HI: "15",
      ID: "16",
      IL: "17",
      IN: "18",
      IA: "19",
      KS: "20",
      KY: "21",
      LA: "22",
      ME: "23",
      MD: "24",
      MA: "25",
      MI: "26",
      MN: "27",
      MS: "28",
      MO: "29",
      MT: "30",
      NE: "31",
      NV: "32",
      NH: "33",
      NJ: "34",
      NM: "35",
      NY: "36",
      NC: "37",
      ND: "38",
      OH: "39",
      OK: "40",
      OR: "41",
      PA: "42",
      RI: "44",
      SC: "45",
      SD: "46",
      TN: "47",
      TX: "48",
      UT: "49",
      VT: "50",
      VA: "51",
      WA: "53",
      WV: "54",
      WI: "55",
      WY: "56",
    };

    async function fetchAcsMedianHouseholdIncomeForZip(zip: string): Promise<number | null> {
      if (!zip || !/^\d{5}$/.test(zip)) return null;
      const url = `https://api.census.gov/data/2023/acs/acs5?get=B19013_001E&for=zip%20code%20tabulation%20area:${zip}`;
      const r = await fetch(url, { cache: "no-store" }).catch(() => null);
      if (!r || !r.ok) return null;
      const j = (await r.json().catch(() => null)) as any;
      const v = Array.isArray(j) && Array.isArray(j[1]) ? Number(j[1][0]) : NaN;
      return Number.isFinite(v) ? v : null;
    }

    async function fetchAcsMedianHouseholdIncomeForState(stateFips: string): Promise<number | null> {
      if (!stateFips || !/^\d{2}$/.test(stateFips)) return null;
      const url = `https://api.census.gov/data/2023/acs/acs5?get=B19013_001E&for=state:${stateFips}`;
      const r = await fetch(url, { cache: "no-store" }).catch(() => null);
      if (!r || !r.ok) return null;
      const j = (await r.json().catch(() => null)) as any;
      const v = Array.isArray(j) && Array.isArray(j[1]) ? Number(j[1][0]) : NaN;
      return Number.isFinite(v) ? v : null;
    }

    let marketFactor = 1;
    let marketMeta: { zip?: string; state?: string; medianIncomeZip?: number | null; medianIncomeState?: number | null; multiplier?: number } = {
      zip: market.zip || undefined,
      state: market.state || undefined,
    };
    try {
      const fips = STATE_FIPS[market.state] || "";
      if (market.zip && fips) {
        const [mZip, mState] = await Promise.all([
          fetchAcsMedianHouseholdIncomeForZip(market.zip),
          fetchAcsMedianHouseholdIncomeForState(fips),
        ]);
        marketMeta.medianIncomeZip = mZip;
        marketMeta.medianIncomeState = mState;
        if (mZip && mState) {
          const raw = mZip / mState;
          // Clamp to keep early pricing stable and avoid weird outliers.
          marketFactor = Math.max(0.75, Math.min(1.5, raw));
          marketMeta.multiplier = marketFactor;
        }
      }
    } catch {
      // ignore
    }

    if (!force) {
      const cached = await readCache(cacheKey);
      if (cached) {
        return NextResponse.json({ ...cached, cached: true });
      }
    }

    // ---- Chunking pass: extract issue candidates from chunks ----
    const chunkSchema = {
      type: "object",
      additionalProperties: false,
      properties: {
        issues: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              label: { type: "string" },
              note: { type: "string" },
              lane: { type: "string" },
            },
            required: ["label"],
          },
        },
      },
      required: ["issues"],
    };

    const chunkSystem =
      "You are extracting repair issues from a home inspection report chunk. " +
      "Return de-duplicated issues supported by the text. " +
      "Prefer summary/overview items. Do not invent defects. " +
      "Use short scannable labels; put the detailed narrative in note. " +
      "Lane should be one of: Exterior, Interior, Systems, Safety, Need more info, Other.";

    const chunks = chunkText(extractedText, 45_000);

    const usageCalls: UsageCost[] = [];
    const issues: Array<{ label: string; note?: string; lane?: string }> = [];

    for (let i = 0; i < chunks.length; i++) {
      const userMsg =
        `Location: ${location || "(unknown)"}\n` +
        `User notes: ${notes || "(none)"}\n` +
        `Chunk ${i + 1}/${chunks.length}:\n\n` +
        chunks[i];

      let r:
        | Awaited<ReturnType<typeof callOpenAIJsonSchema>>
        | { ok: false; status: number; detail: string };
      try {
        r = await callOpenAIJsonSchema({
          apiKey,
          model: "gpt-5.4-mini",
          schemaName: "instant_estimate_chunk_issues",
          schema: chunkSchema,
          system: chunkSystem,
          user: userMsg,
        });
      } catch (e: unknown) {
        const msg = e && typeof e === "object" && "message" in e ? String((e as any).message) : String(e || "unknown");
        return NextResponse.json(
          { ok: false, error: "openai_fetch_failed", detail: `chunk_${i + 1}: ${msg}` },
          { status: 500 }
        );
      }

      if (!r.ok) {
        return NextResponse.json(
          { ok: false, error: "openai_error", detail: `chunk_${i + 1}: ${r.detail || "(no detail)"}` },
          { status: 500 }
        );
      }

      usageCalls.push(r.usage);
      const arr = Array.isArray(r.json?.issues) ? r.json.issues : [];
      for (const it of arr) {
        if (!it || typeof it !== "object") continue;
        const rec = it as Record<string, unknown>;
        const label = typeof rec.label === "string" ? rec.label.trim() : "";
        if (!label) continue;
        const note = typeof rec.note === "string" ? rec.note : undefined;
        const lane = typeof rec.lane === "string" ? rec.lane : undefined;
        issues.push({ label, note, lane });
      }
    }

    // De-dupe issues by normalized label
    const issueSeen = new Set<string>();
    const dedupedIssues = issues.filter((it) => {
      const k = normalizeLabel(it.label);
      if (!k) return false;
      if (issueSeen.has(k)) return false;
      issueSeen.add(k);
      return true;
    });

    if (dedupedIssues.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "no_issues_extracted",
          detail:
            "We could not find any actionable issues in the extracted text. " +
            "If this is a real inspection report, this usually means the extracted text is mostly boilerplate, headers, or formatting artifacts (even if it isn't scanned). " +
            "Try a different export, or we can add an OCR/image fallback for this report type. " +
            `Extracted text length: ${extractedText.length} chars.`,
        },
        { status: 422 }
      );
    }

    // ---- Final pass: build lanes + price ranges ----
    const finalSchema = {
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
                    price: { type: "number" },
                  },
                  required: ["label", "range"],
                },
              },
            },
            required: ["title", "items"],
          },
        },
      },
      required: ["summary", "lanes"],
    };

    const finalSystem =
      "You are an expert home inspection estimator. " +
      "You receive extracted issues from a home inspection report. " +
      "Your job is to produce a consistent, de-duplicated Instant Estimate. " +
      "Rules: (1) Do not duplicate items. (2) Do not hallucinate defects not in the issues list. " +
      "(3) Every item MUST include a pricing range string in USD like '$450–$1,200' (never omit range). " +
      "(4) Use location-based pricing when possible; otherwise use typical US pricing. " +
      "(5) IMPORTANT: Ranges should reflect the homeowner price. Homeworke keeps 20% of the final price (contractor receives 80%), so homeowner price ~= contractor cost / 0.80. " +
      "(6) Keep labels short; put narrative in note. " +
      "(7) Group items into lanes titled exactly one of: Exterior, Interior, Systems, Safety, Need more info, Other. " +
      "Avoid dumping everything into Other—only use Other if you truly cannot classify.";

    const finalUser =
      `Location: ${location || "(unknown)"}\n` +
      `User notes: ${notes || "(none)"}\n\n` +
      "Issues extracted (JSON):\n" +
      JSON.stringify(dedupedIssues.slice(0, 140), null, 2);

    let final:
      | Awaited<ReturnType<typeof callOpenAIJsonSchema>>
      | { ok: false; status: number; detail: string };
    try {
      final = await callOpenAIJsonSchema({
        apiKey,
        model: "gpt-5.4",
        schemaName: "instant_estimate_final",
        schema: finalSchema,
        system: finalSystem,
        user: finalUser,
      });
    } catch (e: unknown) {
      const msg = e && typeof e === "object" && "message" in e ? String((e as any).message) : String(e || "unknown");
      return NextResponse.json({ ok: false, error: "openai_fetch_failed", detail: `final: ${msg}` }, { status: 500 });
    }

    if (!final.ok) {
      return NextResponse.json(
        { ok: false, error: "openai_error", detail: final.detail || "(no detail)" },
        { status: 500 }
      );
    }

    usageCalls.push(final.usage);

    const rec = final.json && typeof final.json === "object" ? (final.json as Record<string, unknown>) : null;
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
            const price = typeof ir.price === "number" && Number.isFinite(ir.price) ? ir.price : undefined;
            const id = typeof ir.id === "string" && ir.id ? ir.id : stableIdFor(label);
            return { id, label, note, range, price };
          })
          .filter((it) => it.label)
          .slice(0, 60);

        return { title, items };
      });

    const cleaned = dedupeLanes(lanes, location, marketFactor);

    if (cleaned.length === 0) {
      // Fallback: build lanes directly from extracted issues so we still return something usable.
      const laneOrder = ["Exterior", "Interior", "Systems", "Safety", "Need more info", "Other"] as const;
      const buckets = new Map<string, LaneItem[]>();
      for (const t of laneOrder) buckets.set(t, []);

      for (const it of dedupedIssues) {
        const lane = normalizeLaneTitle(it.lane || "Other");
        const label = it.label;
        const note = it.note;
        const range = fillMissingRange(label, location);
        const price = midpointFromRange(range) ?? undefined;
        buckets.get(lane)!.push({ id: stableIdFor(label), label, note, range, price });
      }

      const fallbackLanes: ExtractedLane[] = laneOrder
        .map((t) => ({ title: t, items: buckets.get(t)! }))
        .filter((l) => l.items.length > 0);

      const usage: AnalyzeUsage = {
        pdfBytes,
        extractedTextChars: extractedText.length,
        hash,
        calls: usageCalls,
        estTotalCostUsd: usageCalls.reduce((a, b) => a + (b.estCostUsd || 0), 0),
      };

      const expiresAtIso = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const payload = {
        ok: true,
        summary:
          "Estimate generated using fallback grouping/pricing because the final formatting step returned no items.",
        lanes: dedupeLanes(fallbackLanes, location, marketFactor),
        used: "fallback",
        usage,
        market: marketMeta,
        cache: {
          cacheKey,
          pdfHash: hash,
          locationKey,
          expiresAt: expiresAtIso,
        } satisfies AnalyzeCacheMeta,
        source: {
          extractedText,
          location,
          notes,
        },
      };

      await writeCache(cacheKey, payload, hash, location);
      return NextResponse.json(payload);
    }

    const usage: AnalyzeUsage = {
      pdfBytes,
      extractedTextChars: extractedText.length,
      hash,
      calls: usageCalls,
      estTotalCostUsd: usageCalls.reduce((a, b) => a + (b.estCostUsd || 0), 0),
    };

    const expiresAtIso = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const payload = {
      ok: true,
      summary: typeof rec?.summary === "string" ? String(rec.summary) : "",
      lanes: cleaned,
      used: "openai",
      usage,
      market: marketMeta,
      cache: {
        cacheKey,
        pdfHash: hash,
        locationKey,
        expiresAt: expiresAtIso,
      } satisfies AnalyzeCacheMeta,
      // Stored so we can rerun without requiring the PDF again.
      source: {
        extractedText,
        location,
        notes,
      },
    };

    await writeCache(cacheKey, payload, hash, location);
    return NextResponse.json(payload);
  } catch (e: unknown) {
    const msg = e && typeof e === "object" && "message" in e ? String((e as any).message) : String(e || "unknown");
    return NextResponse.json({ ok: false, error: "server_error", detail: msg }, { status: 500 });
  }
}
