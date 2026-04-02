import { NextResponse } from "next/server";

export const runtime = "nodejs";

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

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

type UsageCost = {
  model: string;
  estInputTokens: number;
  estOutputTokens: number;
  estCostUsd: number;
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

async function readCache(cacheKey: string) {
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

async function writeCache(cacheKey: string, payload: unknown) {
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
    const textOverride = String(form.get("text") || "");
    const hashOverride = String(form.get("hash") || "").trim();
    const notes = String(form.get("notes") || "");
    const location = String(form.get("location") || "");

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: true, ...demoResult(location), used: "demo" });
    }

    let extractedText = "";
    let hash = "";
    let pdfBytes = 0;

    if (textOverride.trim()) {
      extractedText = textOverride.trim();
      hash = hashOverride || crypto.createHash("sha256").update(extractedText).digest("hex");
      pdfBytes = 0;
    } else {
      if (!file || !(file instanceof File)) {
        return NextResponse.json({ ok: false, error: "missing_file" }, { status: 400 });
      }

      // ---- PDF text extraction (server-side) ----
      const buf = Buffer.from(await file.arrayBuffer());
      pdfBytes = buf.length;
      hash = crypto.createHash("sha256").update(buf).digest("hex");
      const parsedPdf = await pdf(buf);
      extractedText = String(parsedPdf?.text || "").replace(/\u0000/g, "").trim();

      if (!extractedText) {
        return NextResponse.json(
          { ok: false, error: "pdf_no_text", detail: "Could not extract text from PDF (may be scanned)." },
          { status: 422 }
        );
      }
    }

    // Cache by hash (PDF bytes hash if provided, else text hash)
    const cached = await readCache(hash);
    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
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
            "This often happens when the PDF is scanned/image-only (no selectable text) or the text extraction failed. " +
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

    const finalSystem =
      "You are an expert home inspection estimator. " +
      "You receive extracted issues from a home inspection report. " +
      "Your job is to produce a consistent, de-duplicated Instant Estimate. " +
      "Rules: (1) Do not duplicate items. (2) Do not hallucinate defects not in the issues list. " +
      "(3) Use location-based pricing ranges when possible. " +
      "(4) Keep labels short; put narrative in note. " +
      "(5) Group items into clear lanes.";

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
            const id = typeof ir.id === "string" && ir.id ? ir.id : stableIdFor(label);
            return { id, label, note, range };
          })
          .filter((it) => it.label)
          .slice(0, 60);

        return { title, items };
      });

    const cleaned = dedupeLanes(lanes);

    if (cleaned.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "no_items_generated",
          detail:
            "AI returned no estimate items. This is usually caused by poor/empty extracted text (scanned PDF) or an upstream model error. " +
            `Extracted text length: ${extractedText.length} chars; issues extracted: ${dedupedIssues.length}.`,
        },
        { status: 422 }
      );
    }

    const usage: AnalyzeUsage = {
      pdfBytes,
      extractedTextChars: extractedText.length,
      hash,
      calls: usageCalls,
      estTotalCostUsd: usageCalls.reduce((a, b) => a + (b.estCostUsd || 0), 0),
    };

    const payload = {
      ok: true,
      summary: typeof rec?.summary === "string" ? String(rec.summary) : "",
      lanes: cleaned,
      used: "openai",
      usage,
    };

    await writeCache(hash, payload);
    return NextResponse.json(payload);
  } catch (e: unknown) {
    const msg = e && typeof e === "object" && "message" in e ? String((e as any).message) : String(e || "unknown");
    return NextResponse.json({ ok: false, error: "server_error", detail: msg }, { status: 500 });
  }
}
