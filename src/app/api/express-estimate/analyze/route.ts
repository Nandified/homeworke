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

  // Scope-aware pricing + booking eligibility
  pricingMode?: "Guardrails" | "Quote-only";
  confidence?: number; // 0..1
  quantityHint?: string; // e.g. "2 windows" | "multiple"
  scopeMultiplier?: number; // applied to guardrail-derived ranges/prices
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

import {
  applyRegexRules,
  LICENSE_HINT,
  RATING_RULES,
  SYSTEM_RULES,
  TRADE_RULES,
  type FindingPriority,
  type FindingRating,
  type FindingSystem,
} from "@/lib/inspection-normalization-map";

type NormalizedFinding = {
  system?: FindingSystem;
  component?: string;
  location?: string;
  rating?: FindingRating;
  priority?: FindingPriority;
  issue: string;
  narrative: string;
  recommendation?: string;
  recommendedTrade?: string;
  requiresSpecialist?: boolean;
  quantity?: { qty?: number; unit?: string; notes?: string };
  evidence?: { photoCount?: number; videoCount?: number };
  accessLimitation?: boolean;
  confidence?: number; // 0..1
  lane?: string;
};

function normalizeSystem(raw?: string): FindingSystem | undefined {
  return applyRegexRules(SYSTEM_RULES, raw) || (raw ? "Other" : undefined);
}

function normalizeRating(raw?: string): FindingRating | undefined {
  return applyRegexRules(RATING_RULES, raw) || (raw ? "Unknown" : undefined);
}

function normalizeTrade(raw?: string): string | undefined {
  const base = applyRegexRules(TRADE_RULES, raw);
  if (!base) return raw ? "other" : undefined;
  const hasLicenseHint = LICENSE_HINT.test(raw || "");
  if (base === "electrician" && hasLicenseHint) return "electrician_licensed";
  if (base === "plumber" && hasLicenseHint) return "plumber_licensed";
  return base;
}
function derivePriority(rating: FindingRating | undefined, text: string): FindingPriority {
  const t = (text || "").toLowerCase();
  if (rating === "Safety") return "P0";
  if (/(active leak|leaking now|sparking|shock|smoke|gas leak|carbon monoxide|no heat|sewer backup|standing water)/.test(t)) return "P1";
  if (rating === "Repair") return "P2";
  if (rating === "NotAccessible") return "P3";
  if (rating === "Monitor") return "P3";
  return "P2";
}

function deriveConfidence(it: {
  rating?: FindingRating;
  evidence?: { photoCount?: number; videoCount?: number };
  accessLimitation?: boolean;
  location?: string;
  component?: string;
}): number {
  let c = 0.7;
  const photos = it.evidence?.photoCount || 0;
  const videos = it.evidence?.videoCount || 0;
  if (photos > 0 || videos > 0) c += 0.1;
  if (it.accessLimitation || it.rating === "NotAccessible") c -= 0.3;
  if (!it.location) c -= 0.1;
  if (!it.component) c -= 0.05;
  c = Math.max(0, Math.min(1, c));
  return Math.round(c * 100) / 100;
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

type TradeGuardrail = {
  tradeId: string;
  name?: string;
  guardrails: {
    minTripCharge: number;
    minBillableHours: number;
    hourlyRate: { min: number; max: number };
    smallJobCeiling?: number;
    noPrice?: boolean;
  };
};

type TradeGuardrailsConfig = {
  version: string;
  currency: string;
  region?: { country?: string; state?: string; metro?: string };
  defaultGuardrails: { minTripCharge: number; minBillableHours: number; hourlyRate: { min: number; max: number } };
  trades: TradeGuardrail[];
};

// Keep this as a direct import so Vercel bundles it and we don't rely on FS paths at runtime.
// (This is our hard-coded pricing seed that we tune over time.)
import guardrailsChicagoland from "@/lib/trade-guardrails.chicagoland.json";
import { REPAIR_CATALOG } from "@/lib/repair-catalog.generated";

const CHICAGOLAND_GUARDRAILS = guardrailsChicagoland as unknown as TradeGuardrailsConfig;
const TRADE_GUARDRAILS_BY_ID = new Map(
  (CHICAGOLAND_GUARDRAILS?.trades || []).map((t) => [String(t.tradeId || "").toLowerCase(), t.guardrails])
);

function formatUsd(n: number) {
  const v = Math.round(Number(n) || 0);
  return "$" + v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function rangeFromTradeGuardrails(tradeId: string): string {
  const g = TRADE_GUARDRAILS_BY_ID.get(String(tradeId || "").toLowerCase());
  const fallback = CHICAGOLAND_GUARDRAILS?.defaultGuardrails;

  const minTrip = (g?.minTripCharge ?? fallback?.minTripCharge ?? 250) || 0;
  const minHours = (g?.minBillableHours ?? fallback?.minBillableHours ?? 1) || 0;
  const hourlyMax = (g?.hourlyRate?.max ?? fallback?.hourlyRate?.max ?? 185) || 0;

  // If we have a small-job ceiling, use it as a soft high end.
  // Otherwise, approximate a small job as minTrip + up to ~4 hours at max rate.
  const hi =
    typeof g?.smallJobCeiling === "number" && Number.isFinite(g.smallJobCeiling) && g.smallJobCeiling > 0
      ? g.smallJobCeiling
      : Math.max(minTrip * 2, minTrip + hourlyMax * Math.max(1, minHours) * 4);

  const lo = Math.max(0, minTrip);
  const high = Math.max(lo, Math.round(hi));
  return `${formatUsd(lo)}–${formatUsd(high)}`;
}

function inferTradeId(label: string): string {
  const l = normalizeLabel(label);
  const rules: Array<{ re: RegExp; tradeId: string }> = [
    { re: /chimney|flashing|shingle|soffit|fascia|roof\b|roofing/, tradeId: "roofing" },
    { re: /foundation|masonry|parging|brick|tuckpoint/, tradeId: "masonry" },
    { re: /gutter|downspout/, tradeId: "gutters" },
    { re: /hvac|furnace|air conditioner|ac\b|heat pump|thermostat/, tradeId: "hvac" },
    { re: /plumb|leak|water heater|sump|drain|sewer/, tradeId: "plumbing" },
    { re: /electrical|panel|outlet|gfci|breaker|ceiling fan|fixture/, tradeId: "electrical" },
    { re: /window|door|screen/, tradeId: "windows_doors" },
    { re: /drywall|patch|texture/, tradeId: "drywall" },
    { re: /paint|painting/, tradeId: "painting" },
    { re: /tile\b/, tradeId: "tile" },
    { re: /floor|hardwood|laminate|lvp|carpet/, tradeId: "flooring" },
    { re: /grading|drainage/, tradeId: "grading" },
    { re: /garage door|garage\b/, tradeId: "garage_door" },
    { re: /fence|fencing/, tradeId: "fencing" },
    { re: /landscap|yard|sod|mulch/, tradeId: "landscaping" },
    { re: /lock|deadbolt|rekey|locksmith/, tradeId: "locksmith" },
    { re: /pest|termite|rodent/, tradeId: "pest_control" },
    { re: /power wash|pressure wash/, tradeId: "power_washing" },
    { re: /concrete|slab|driveway|walkway/, tradeId: "concrete" },
    { re: /tree|branch|stump/, tradeId: "tree_service" },
    { re: /mold|remediation/, tradeId: "mold_remediation" },
  ];
  const hit = rules.find((r) => r.re.test(l));
  return hit?.tradeId || "handyman";
}

type CatalogItem = {
  item_code: string;
  item_name: string;
  system: string;
  trade: string;
  unit: string;
  typical_qty_notes: string;
  labor_hours_low: number | null;
  labor_hours_high: number | null;
  material_low: number | null;
  material_high: number | null;
  complexity_modifiers_notes: string;
  permit_likely: boolean;
  specialist_required: boolean;
};

function tokens(s: string): string[] {
  const t = normalizeLabel(s)
    .replace(/[()/+-]/g, " ")
    .split(" ")
    .map((x) => x.trim())
    .filter(Boolean);
  // remove very common filler tokens
  const stop = new Set(["replace", "repair", "install", "add", "basic", "minor", "localized", "standard", "swap", "per"]);
  return t.filter((x) => x.length >= 3 && !stop.has(x));
}

function overlapScore(a: string[], b: string[]) {
  if (!a.length || !b.length) return 0;
  const setB = new Set(b);
  let hit = 0;
  for (const w of a) if (setB.has(w)) hit++;
  return hit;
}

function normalizeCatalogTradeId(trade: string): string {
  const t = normalizeLabel(trade);
  // Normalize common catalog trade labels into our guardrail IDs.
  if (/electric/.test(t)) return "electrical";
  if (/plumb|drain/.test(t)) return "plumbing";
  if (/hvac|furnace|ac\b|air conditioner|heat pump/.test(t)) return "hvac";
  if (/roof/.test(t)) return "roofing";
  if (/gutter/.test(t)) return "gutters";
  if (/mason|brick|stucco/.test(t)) return "masonry";
  if (/drywall/.test(t)) return "drywall";
  if (/paint/.test(t)) return "painting";
  if (/floor/.test(t)) return "flooring";
  if (/garage door/.test(t)) return "garage_door";
  if (/landscap/.test(t)) return "landscaping";
  if (/concrete/.test(t)) return "concrete";
  if (/window|door|glazier/.test(t)) return "windows_doors";
  return "handyman";
}

function rangeFromCatalogItem(it: CatalogItem, marketFactor = 1, qty = 1): string | null {
  const tradeId = normalizeCatalogTradeId(it.trade);
  const g = TRADE_GUARDRAILS_BY_ID.get(String(tradeId || "").toLowerCase());
  const fallback = CHICAGOLAND_GUARDRAILS?.defaultGuardrails;
  const minTrip = (g?.minTripCharge ?? fallback?.minTripCharge ?? 250) || 0;
  const minHours = (g?.minBillableHours ?? fallback?.minBillableHours ?? 1) || 0;
  const hrMin = (g?.hourlyRate?.min ?? fallback?.hourlyRate?.min ?? 95) || 0;
  const hrMax = (g?.hourlyRate?.max ?? fallback?.hourlyRate?.max ?? 185) || 0;

  // Only scale qty for unit-priced items (ea / each / circuit). For LF/SF/CY/allowance,
  // the catalog row is assumed to already represent a scoped allowance.
  const unit = normalizeLabel(it.unit || "");
  const scalesWithQty = unit === "ea" || unit === "each" || unit === "circuit";
  const q = scalesWithQty ? Math.max(1, Math.min(12, Number(qty) || 1)) : 1;

  const hLo = it.labor_hours_low ?? null;
  const hHi = it.labor_hours_high ?? null;
  const mLo = it.material_low ?? 0;
  const mHi = it.material_high ?? mLo;

  if (hLo === null && hHi === null && (mLo || mHi)) {
    const matOnlyLo = (mLo || 0) * q * marketFactor;
    const matOnlyHi = (mHi || 0) * q * marketFactor;
    return `${formatUsdCompact(matOnlyLo)}–${formatUsdCompact(matOnlyHi)}`;
  }

  const laborLo = (Math.max(minHours, (hLo ?? minHours) * q) * hrMin + minTrip) * marketFactor;
  const laborHi =
    (Math.max(minHours, (hHi ?? Math.max(minHours, hLo ?? minHours)) * q) * hrMax + minTrip) * marketFactor;
  const totalLo = laborLo + (mLo || 0) * q * marketFactor;
  const totalHi = Math.max(totalLo, laborHi + (mHi || 0) * q * marketFactor);

  // Convert to homeowner price (Homeworke keeps 20%).
  const homeownerLo = totalLo / 0.8;
  const homeownerHi = totalHi / 0.8;
  return `${formatUsdCompact(homeownerLo)}–${formatUsdCompact(homeownerHi)}`;
}

function inferQtyForFinding(f: any, catalogItem: CatalogItem): { qty: number; source: string; missing: boolean } {
  // Explicit quantity from extraction
  const explicit = typeof f?.quantity?.qty === "number" && Number.isFinite(f.quantity.qty) ? f.quantity.qty : null;
  if (explicit && explicit > 0) return { qty: Math.max(1, Math.min(50, explicit)), source: "explicit", missing: false };

  const unit = normalizeLabel(catalogItem.unit || "");
  const scales = unit === "ea" || unit === "each" || unit === "circuit";
  if (!scales) return { qty: 1, source: "n/a", missing: true };

  const text = `${f?.issue || ""} ${f?.narrative || ""} ${f?.recommendation || ""}`.toLowerCase();
  const pluralCue = /(multiple|several|various|throughout|numerous|many|all|both)/.test(text);

  const photos = Number(f?.evidence?.photoCount || 0);
  const videos = Number(f?.evidence?.videoCount || 0);
  const mediaCue = Math.max(photos, videos);

  // Conservative defaults: 1 unless we have a reason.
  let qty = 1;
  let source = "default";

  if (pluralCue) {
    qty = 2;
    source = "plural_cue";
  }

  // Weak proxy: more media often implies more occurrences.
  if (mediaCue >= 2) {
    qty = Math.max(qty, Math.min(6, mediaCue));
    source = source === "default" ? "media_proxy" : source;
  }

  return { qty, source, missing: true };
}

function matchCatalogForFinding(f: { issue: string; narrative?: string; system?: string; component?: string }, marketFactor = 1) {
  const issueT = tokens(f.issue);
  const compT = tokens((f as any).component || "");
  const sys = normalizeLabel((f as any).system || "");

  let best: { item: CatalogItem; score: number } | null = null;

  for (const raw of REPAIR_CATALOG as unknown as CatalogItem[]) {
    const nameT = tokens(raw.item_name);
    const s = overlapScore(issueT, nameT) * 3 + overlapScore(compT, nameT);
    const sysBonus = sys && normalizeLabel(raw.system).includes(sys) ? 3 : 0;
    const score = s + sysBonus;
    if (!best || score > best.score) {
      best = { item: raw, score };
    }
  }

  // Require a minimal score so we don't attach nonsense.
  if (!best || best.score < 4) return null;

  const qtyMeta = inferQtyForFinding(f as any, best.item);
  const range = rangeFromCatalogItem(best.item, marketFactor, qtyMeta.qty);

  return {
    item_code: best.item.item_code,
    item_name: best.item.item_name,
    unit: best.item.unit,
    trade: best.item.trade,
    score: best.score,
    qty: qtyMeta.qty,
    qtySource: qtyMeta.source,
    qtyMissing: qtyMeta.missing,
    rangeHint: range,
    permitLikely: best.item.permit_likely,
    specialistRequired: best.item.specialist_required,
    notes: best.item.complexity_modifiers_notes,
  };
}

function inferScope(label: string, note?: string): { scopeMultiplier: number; quantityHint: string; confidence: number } {
  const text = `${label || ""} ${note || ""}`.trim();
  const t = normalizeLabel(text);

  // Explicit counts: "(2)" or "2" or "two" etc.
  const digit = t.match(/\b(\d{1,2})\b/);
  if (digit) {
    const n = Math.max(1, Math.min(25, Number(digit[1]) || 1));
    return { scopeMultiplier: Math.max(1, Math.min(6, 0.8 + n * 0.6)), quantityHint: `${n}`, confidence: 0.82 };
  }

  const hasPluralSignals = /\b(windows|doors|screens|gutters|downspouts|outlets|switches|fixtures)\b/.test(t);
  const hasMultiWords = /\b(multiple|several|various|throughout|all|many)\b/.test(t);
  const hasTwoAreas = /\b(front and rear|both sides|left and right|upstairs and downstairs)\b/.test(t);

  if (hasMultiWords) return { scopeMultiplier: 2.6, quantityHint: "multiple", confidence: 0.55 };
  if (hasTwoAreas) return { scopeMultiplier: 1.9, quantityHint: "two areas", confidence: 0.58 };
  if (hasPluralSignals) return { scopeMultiplier: 1.7, quantityHint: "plural", confidence: 0.52 };

  return { scopeMultiplier: 1.0, quantityHint: "single", confidence: 0.62 };
}

function needsScopeForBooking(tradeId: string): boolean {
  return ["windows_doors", "gutters", "flooring", "painting", "roofing"].includes(String(tradeId || "").toLowerCase());
}

function fillMissingRange(label: string, _location: string): string {
  const tradeId = inferTradeId(label);
  return rangeFromTradeGuardrails(tradeId);
}

function priceFromRangeByLabel(range: string, label: string): number | null {
  const r = (range || "").replace(/–/g, "-");
  const parts = r.split("-").map((p) => p.trim());
  if (parts.length < 2) return midpointFromRange(range);
  const lo = parseMoney(parts[0]);
  const hi = parseMoney(parts[1]);
  if (lo === null || hi === null) return midpointFromRange(range);

  const a = Math.min(lo, hi);
  const b = Math.max(lo, hi);
  if (a === b) return a;

  // Stable pseudo-random within the range so fallback prices don't all look identical.
  // Keep it centered-ish (30%–69% of the range) so we avoid extreme lows/highs.
  const h = crypto.createHash("sha1").update(normalizeLabel(label)).digest("hex").slice(0, 8);
  const n = parseInt(h, 16);
  const pct = 0.3 + ((n % 40) / 100); // 0.30–0.69
  return Math.round(a + (b - a) * pct);
}

function dedupeLanes(lanes: ExtractedLane[], location: string, marketFactor = 1): ExtractedLane[] {
  const seen = new Set<string>();
  const homeownerFactor = 1.25; // Homeworke keeps 20% of final price => contractor gets 80%
  const totalFactor = homeownerFactor * (Number.isFinite(marketFactor) && marketFactor > 0 ? marketFactor : 1);

  return lanes
    .map((lane) => {
      const items = lane.items
        .map((it) => {
          const hadRange = !!(it.range && it.range.trim());
          const tradeId = inferTradeId(it.label);

          // If we don't have an explicit quantity, infer scope from wording.
          const inferred = inferScope(it.label, it.note);
          const scopeMultiplier = Math.max(1, Number.isFinite(inferred.scopeMultiplier) ? inferred.scopeMultiplier : 1);

          // Only apply scope multiplier when we are synthesizing the guardrail range.
          const baseRangeRaw = hadRange ? it.range! : fillMissingRange(it.label, location);
          const baseRange = !hadRange ? scaleRange(baseRangeRaw, scopeMultiplier) : baseRangeRaw;
          const range = scaleRange(baseRange, totalFactor);

          // If model provided a price, assume it's base contractor cost and scale it.
          // If we had to synthesize the range, synthesize a *non-identical* price too.
          const basePrice =
            typeof it.price === "number" && Number.isFinite(it.price)
              ? it.price
              : hadRange
                ? (midpointFromRange(baseRange) ?? undefined)
                : (priceFromRangeByLabel(baseRange, it.label) ?? undefined);
          const price = typeof basePrice === "number" ? Math.round(basePrice * totalFactor) : undefined;

          // Booking eligibility: if scope is needed but confidence is low, force quote-only.
          const scopeNeeded = needsScopeForBooking(tradeId);
          const confidence = typeof it.confidence === "number" ? it.confidence : inferred.confidence;
          const pricingMode: LaneItem["pricingMode"] = scopeNeeded && confidence < 0.65 ? "Quote-only" : (it.pricingMode || "Guardrails");

          return {
            ...it,
            range,
            price,
            scopeMultiplier,
            quantityHint: it.quantityHint || inferred.quantityHint,
            confidence,
            pricingMode,
          };
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
        findings: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              system: { type: "string" },
              component: { type: "string" },
              location: { type: "string" },
              rating: { type: "string" },
              issue: { type: "string" },
              narrative: { type: "string" },
              recommendation: { type: "string" },
              recommendedTrade: { type: "string" },
              requiresSpecialist: { type: "boolean" },
              quantity: {
                type: "object",
                additionalProperties: false,
                properties: {
                  qty: { type: "number" },
                  unit: { type: "string" },
                  notes: { type: "string" },
                },
              },
              evidence: {
                type: "object",
                additionalProperties: false,
                properties: {
                  photoCount: { type: "number" },
                  videoCount: { type: "number" },
                },
              },
              accessLimitation: { type: "boolean" },
              lane: { type: "string" },
            },
            required: ["issue", "narrative"],
          },
        },
      },
      required: ["findings"],
    };

    const chunkSystem =
      "You are extracting normalized findings from a home inspection report chunk. " +
      "Return de-duplicated findings supported by the text (do not invent defects). " +
      "Only include ACTIONABLE issues that need repair, monitoring, safety attention, or need-more-info due to access limitations. " +
      "Do NOT include items that are acceptable / good / working / satisfactory / functional unless the text also notes a defect. " +
      "Each finding MUST include: issue (short label) + narrative (verbatim-ish). " +
      "Include as many cost-driver fields as you can: system, component, location, rating, recommendation, recommendedTrade, requiresSpecialist, quantity, evidence counts, accessLimitation. " +
      "If the report uses a severity scheme, map it into rating using these buckets: Acceptable | Monitor | Repair | Safety | NotAccessible | Unknown. " +
      "Lane should be one of: Exterior, Interior, Systems, Safety, Need more info, Other.";

    const chunks = chunkText(extractedText, 45_000);

    const usageCalls: UsageCost[] = [];
    const findings: NormalizedFinding[] = [];

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
      const arr = Array.isArray((r.json as any)?.findings) ? ((r.json as any).findings as unknown[]) : [];
      for (const it of arr) {
        if (!it || typeof it !== "object") continue;
        const rec = it as Record<string, unknown>;

        const issue = typeof rec.issue === "string" ? rec.issue.trim() : "";
        const narrative = typeof rec.narrative === "string" ? rec.narrative.trim() : "";
        if (!issue || !narrative) continue;

        // Skip "acceptable / good condition" items; we only price actionable issues.
        const ratingLower = (rating || "").toLowerCase();
        const issueLower = issue.toLowerCase();
        const narrativeLower = narrative.toLowerCase();
        const looksAcceptable =
          ratingLower === "acceptable" ||
          ratingLower.includes("satisfactory") ||
          ratingLower.includes("good") ||
          ratingLower.includes("working");
        const saysOk =
          issueLower.includes("acceptable") ||
          issueLower.includes("satisfactory") ||
          issueLower.includes("good condition") ||
          issueLower.includes("working") ||
          narrativeLower.includes("in good condition") ||
          narrativeLower.includes("operated as intended") ||
          narrativeLower.includes("no defects") ||
          narrativeLower.includes("no issues noted") ||
          narrativeLower.includes("serviceable") ||
          narrativeLower.includes("ok");
        if (looksAcceptable && saysOk) continue;

        const systemRaw = typeof rec.system === "string" ? rec.system : undefined;
        const component = typeof rec.component === "string" ? rec.component : undefined;
        const location = typeof rec.location === "string" ? rec.location : undefined;
        const ratingRaw = typeof rec.rating === "string" ? rec.rating : undefined;
        const recommendation = typeof rec.recommendation === "string" ? rec.recommendation : undefined;
        const recommendedTradeRaw = typeof rec.recommendedTrade === "string" ? rec.recommendedTrade : undefined;
        const requiresSpecialistRaw = typeof rec.requiresSpecialist === "boolean" ? rec.requiresSpecialist : undefined;
        const lane = typeof rec.lane === "string" ? rec.lane : undefined;
        const accessLimitation = typeof rec.accessLimitation === "boolean" ? rec.accessLimitation : undefined;

        const system = normalizeSystem(systemRaw);
        const rating = normalizeRating(ratingRaw);
        const recommendedTrade = normalizeTrade(recommendedTradeRaw);
        const requiresSpecialist =
          typeof requiresSpecialistRaw === "boolean"
            ? requiresSpecialistRaw
            : LICENSE_HINT.test(`${recommendedTradeRaw || ""} ${recommendation || ""}`);

        const quantity = rec.quantity && typeof rec.quantity === "object" ? (rec.quantity as any) : undefined;
        const qQty = typeof quantity?.qty === "number" && Number.isFinite(quantity.qty) ? quantity.qty : undefined;
        const qUnit = typeof quantity?.unit === "string" ? quantity.unit : undefined;
        const qNotes = typeof quantity?.notes === "string" ? quantity.notes : undefined;

        const evidence = rec.evidence && typeof rec.evidence === "object" ? (rec.evidence as any) : undefined;
        const photoCount = typeof evidence?.photoCount === "number" && Number.isFinite(evidence.photoCount) ? evidence.photoCount : undefined;
        const videoCount = typeof evidence?.videoCount === "number" && Number.isFinite(evidence.videoCount) ? evidence.videoCount : undefined;

        const quantityObj = qQty || qUnit || qNotes ? { qty: qQty, unit: qUnit, notes: qNotes } : undefined;
        const evidenceObj = photoCount || videoCount ? { photoCount, videoCount } : undefined;

        const priority = derivePriority(rating, `${issue} ${narrative} ${recommendation || ""}`);
        const confidence = deriveConfidence({ rating, evidence: evidenceObj, accessLimitation, location, component });

        findings.push({
          system,
          component,
          location,
          rating,
          priority,
          issue,
          narrative,
          recommendation,
          recommendedTrade,
          requiresSpecialist,
          quantity: quantityObj,
          evidence: evidenceObj,
          accessLimitation,
          confidence,
          lane,
        });
      }
    }

    // De-dupe issues by normalized label
    const issueSeen = new Set<string>();
    const dedupedFindings = findings.filter((it) => {
      const k = normalizeLabel([it.system, it.component, it.location, it.issue].filter(Boolean).join(" | "));
      if (!k) return false;
      if (issueSeen.has(k)) return false;
      issueSeen.add(k);
      return true;
    });

    if (dedupedFindings.length === 0) {
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
      "You receive normalized findings extracted from a home inspection report (system/component/location/rating/issue/narrative/etc.). " +
      "Your job is to produce a consistent, de-duplicated Instant Estimate. " +
      "Rules: (1) Do not duplicate items. (2) Do not hallucinate defects not supported by the findings list. " +
      "(3) Every item MUST include a pricing range string in USD like '$450–$1,200' (never omit range). " +
      "(4) Use location-based pricing when possible; otherwise use typical US pricing. " +
      "(5) IMPORTANT: Ranges should reflect the homeowner price. Homeworke keeps 20% of the final price (contractor receives 80%), so homeowner price ~= contractor cost / 0.80. " +
      "(6) Keep labels short; put specifics (location, narrative, constraints) in note. " +
      "(7) Use the cost-driver fields to vary ranges realistically: rating/priority, trade, quantity, access limitations, and evidence. " +
      "(8) Group items into lanes titled exactly one of: Exterior, Interior, Systems, Safety, Need more info, Other. " +
      "Avoid dumping everything into Other—only use Other if you truly cannot classify.";

    const pricedFindings = dedupedFindings.map((f) => {
      const catalog = matchCatalogForFinding(f, marketFactor);
      return {
        ...f,
        catalog,
        rangeHint: catalog?.rangeHint || null,
      };
    });

    const finalUser =
      `Location: ${location || "(unknown)"}\n` +
      `User notes: ${notes || "(none)"}\n\n` +
      "Findings extracted (JSON). If rangeHint is present, prefer it unless you have strong reason to adjust:\n" +
      JSON.stringify(pricedFindings.slice(0, 220), null, 2);

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
      // Fallback: build lanes directly from extracted findings so we still return something usable.
      const laneOrder = ["Exterior", "Interior", "Systems", "Safety", "Need more info", "Other"] as const;
      const buckets = new Map<string, LaneItem[]>();
      for (const t of laneOrder) buckets.set(t, []);

      for (const it of dedupedFindings) {
        const lane = normalizeLaneTitle(it.lane || "Other");
        const label = it.issue;
        const catalog = matchCatalogForFinding(it, marketFactor);
        const noteParts = [
          it.system ? `System: ${it.system}` : "",
          it.component ? `Component: ${it.component}` : "",
          it.location ? `Location: ${it.location}` : "",
          it.rating ? `Rating: ${it.rating}` : "",
          it.priority ? `Priority: ${it.priority}` : "",
          it.recommendedTrade ? `Trade: ${it.recommendedTrade}` : "",
          catalog?.item_code ? `Catalog: ${catalog.item_code}` : "",
          it.requiresSpecialist ? "Requires specialist/licensed pro" : "",
          it.accessLimitation ? "Access limitation noted" : "",
          it.narrative,
          it.recommendation ? `Recommendation: ${it.recommendation}` : "",
        ].filter(Boolean);
        const note = noteParts.join("\n");
        const range = catalog?.rangeHint || fillMissingRange(label, location);
        const price = midpointFromRange(range) ?? undefined;
        buckets.get(lane)!.push({ id: stableIdFor(label + "|" + (it.location || "")), label, note, range, price });
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

      // Learning loop: log extracted+priced outputs (DB-first). Silent failure.
      try {
        if (dbEnabled()) {
          await db().inspectionLearningEvent.create({
            data: {
              pdfHash: hash,
              location: location || null,
              zip: marketMeta.zip || null,
              state: marketMeta.state || null,
              marketMultiplier: marketMeta.multiplier ?? null,
              findings: dedupedFindings as any,
              lanes: payload.lanes as any,
              summary: payload.summary || null,
              schemaVersion: "inspection_json_v2",
              modelChunk: "gpt-5.4-mini",
              modelFinal: "gpt-5.4",
            },
          });
        }
      } catch {
        // ignore
      }

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

    // Learning loop: log extracted+priced outputs (DB-first). Silent failure.
    try {
      if (dbEnabled()) {
        // Prefer enriched findings with catalog/range hints when available.
        const findingsForLog = (typeof pricedFindings !== "undefined" ? pricedFindings : dedupedFindings) as any;
        await db().inspectionLearningEvent.create({
          data: {
            pdfHash: hash,
            location: location || null,
            zip: marketMeta.zip || null,
            state: marketMeta.state || null,
            marketMultiplier: marketMeta.multiplier ?? null,
            findings: findingsForLog,
            lanes: payload.lanes as any,
            summary: payload.summary || null,
            schemaVersion: "inspection_json_v2",
            modelChunk: "gpt-5.4-mini",
            modelFinal: "gpt-5.4",
          },
        });
      }
    } catch {
      // ignore
    }

    return NextResponse.json(payload);
  } catch (e: unknown) {
    const msg = e && typeof e === "object" && "message" in e ? String((e as any).message) : String(e || "unknown");
    return NextResponse.json({ ok: false, error: "server_error", detail: msg }, { status: 500 });
  }
}
