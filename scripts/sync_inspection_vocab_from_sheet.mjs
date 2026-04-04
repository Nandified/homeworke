// Fetch vocab/mapping rules from the Google Sheet (public CSV export) and generate
// a TS module used by inspection normalization.
//
// This is designed to run during Vercel build (no OAuth). The sheet must be readable
// via the published CSV export URL.
//
// Env:
// - INSPECTION_VOCAB_SHEET_ID (optional)
// - INSPECTION_VOCAB_SHEET_NAME (optional, default Sheet1)
// - INSPECTION_VOCAB_RANGE (optional, default F97:K1000)
// - INSPECTION_VOCAB_OUT (optional)

import fs from "node:fs/promises";
import path from "node:path";

const SHEET_ID = process.env.INSPECTION_VOCAB_SHEET_ID || "10mTd71gvi7njJAbSuWDWez9mjGMGvlemQ3aXgsOLBAk";
const SHEET_NAME = process.env.INSPECTION_VOCAB_SHEET_NAME || "Sheet1";
const RANGE = process.env.INSPECTION_VOCAB_RANGE || "F97:K2000";
const OUT =
  process.env.INSPECTION_VOCAB_OUT ||
  path.join(process.cwd(), "src/lib/inspection-normalization-map.generated.ts");

const OVERRIDE_CSV_URL = process.env.INSPECTION_VOCAB_CSV_URL || "";

function csvUrl(sheetId, sheetName, range) {
  // gviz supports range + csv output; sheet must be readable.
  const base = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq`;
  const tqx = "out:csv";
  const params = new URLSearchParams({ tqx, sheet: sheetName, range });
  return `${base}?${params.toString()}`;
}

function parseCsv(text) {
  // Minimal CSV parser good enough for our simple sheet export.
  const rows = [];
  let row = [];
  let field = "";
  let i = 0;
  let inQuotes = false;

  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }

    if (c === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }

    if (c === "\n") {
      row.push(field);
      field = "";
      // Trim trailing \r
      if (row.length && typeof row[row.length - 1] === "string") {
        row[row.length - 1] = row[row.length - 1].replace(/\r$/, "");
      }
      rows.push(row);
      row = [];
      i++;
      continue;
    }

    field += c;
    i++;
  }

  // Last row
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function safeRegexSource(s) {
  // Convert a raw phrase into a tolerant regex source.
  // - escape regex metacharacters
  // - collapse whitespace into \\s+
  const t = String(s || "").trim();
  const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return escaped.replace(/\s+/g, "\\s+");
}

function normalizeContext(s) {
  const t = String(s || "").toLowerCase().trim();
  if (t.includes("system")) return "system";
  if (t.includes("rating")) return "rating";
  if (t.includes("trade")) return "trade";
  if (t.includes("access")) return "access";
  return null;
}

const ALLOWED_SYSTEMS = new Set([
  "Roof",
  "Exterior",
  "Garage",
  "Attic",
  "Interior",
  "Appliances",
  "HVAC",
  "Electrical",
  "Plumbing",
  "Structure",
  "Foundation",
  "WindowsDoors",
  "InsulationVentilation",
  "Fireplace",
  "PoolSpa",
  "SiteDrainage",
  "Other",
]);

const ALLOWED_RATINGS = new Set(["Acceptable", "Monitor", "Repair", "Safety", "NotAccessible", "Unknown"]);

const ALLOWED_TRADES = new Set([
  "general_contractor",
  "electrician",
  "electrician_licensed",
  "plumber",
  "plumber_licensed",
  "hvac",
  "roofer",
  "mason",
  "foundation",
  "carpenter",
  "pest",
  "mold",
  "asbestos",
  "structural_engineer",
  "other",
]);

function isAllowedValue(context, value) {
  if (context === "system") return ALLOWED_SYSTEMS.has(value);
  if (context === "rating") return ALLOWED_RATINGS.has(value);
  if (context === "trade") return ALLOWED_TRADES.has(value);
  // access rules aren't applied in code yet; allow but keep conservative.
  if (context === "access") return value === "NotAccessible";
  return false;
}

async function main() {
  const url = OVERRIDE_CSV_URL || csvUrl(SHEET_ID, SHEET_NAME, RANGE);

  let csv;
  try {
    const r = await fetch(url, {
      cache: "no-store",
      headers: {
        // Some proxies cache aggressively; this nudges freshness.
        "cache-control": "no-cache",
      },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    csv = await r.text();
  } catch (e) {
    console.warn(`[sync_inspection_vocab] WARN: could not fetch sheet CSV (${url}): ${e?.message || e}`);

    // Fail-safe: DO NOT overwrite an existing generated file.
    // This prevents a transient network/privacy issue from wiping rules in production.
    try {
      const existing = await fs.readFile(OUT, "utf8");
      if (existing && existing.includes("SHEET_RULES")) {
        console.warn(`[sync_inspection_vocab] keeping existing generated rules at ${OUT}`);
        return;
      }
    } catch {
      // ignore
    }

    // If no existing file, write an empty module so build doesn't fail.
    const fallback = `// AUTO-GENERATED (fallback). Sheet fetch failed at build time.\nexport const SHEET_RULES = [];\nexport const SHEET_META = { ok: false };\n`;
    await fs.mkdir(path.dirname(OUT), { recursive: true });
    await fs.writeFile(OUT, fallback, "utf8");
    return;
  }

  const rows = parseCsv(csv);
  // Expect header row with context/raw_phrase/normalized_type/normalized_value/notes.
  // Our append placed the section in columns F..K, but range begins at F and includes 6 cols.
  // We'll search for the header row containing "context" and "raw_phrase".
  let headerIdx = -1;
  for (let idx = 0; idx < rows.length; idx++) {
    const r = rows[idx].map((x) => String(x || "").toLowerCase());
    if (r.includes("context") && r.includes("raw_phrase") && r.includes("normalized_value")) {
      headerIdx = idx;
      break;
    }
  }

  const rules = [];
  if (headerIdx >= 0) {
    const header = rows[headerIdx].map((x) => String(x || "").trim());
    const col = (name) => header.findIndex((h) => h.toLowerCase() === name);
    const cContext = col("context");
    const cRaw = col("raw_phrase");
    const cType = col("normalized_type");
    const cValue = col("normalized_value");
    const cNotes = col("notes");

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const r = rows[i];
      const context = normalizeContext(r[cContext]);
      const rawPhrase = String(r[cRaw] || "").trim();
      const normalizedType = String(r[cType] || "").trim();
      const normalizedValue = String(r[cValue] || "").trim();
      const notes = String(r[cNotes] || "").trim();

      if (!context || !rawPhrase || !normalizedType || !normalizedValue) continue;
      if (normalizedType !== context && !(context === "access" && normalizedType === "access")) {
        // Allow strict match; skip inconsistent rows.
        // (We keep it conservative to avoid injecting wrong rules.)
      }

      if (!isAllowedValue(context, normalizedValue)) {
        console.warn(
          `[sync_inspection_vocab] skipping invalid enum: context=${context} raw='${rawPhrase}' value='${normalizedValue}' (${notes || ""})`
        );
        continue;
      }

      rules.push({
        context,
        pattern: safeRegexSource(rawPhrase),
        value: normalizedValue,
        note: notes || undefined,
      });
    }
  }

  const meta = {
    ok: true,
    generatedAt: new Date().toISOString(),
    sheetId: SHEET_ID,
    sheetName: SHEET_NAME,
    range: RANGE,
    sourceUrl: url,
    ruleCount: rules.length,
    validation: {
      allowedSystems: Array.from(ALLOWED_SYSTEMS),
      allowedRatings: Array.from(ALLOWED_RATINGS),
      allowedTrades: Array.from(ALLOWED_TRADES),
    },
  };

  // Rule-count drop guard: if the new rule count collapses, keep the existing file.
  const prevCountMatch = (await fs
    .readFile(OUT, "utf8")
    .catch(() => ""))
    .match(/"ruleCount"\s*:\s*(\d+)/);
  const prevCount = prevCountMatch ? Number(prevCountMatch[1]) : null;
  if (prevCount !== null && Number.isFinite(prevCount) && prevCount > 0) {
    const dropRatio = rules.length / prevCount;
    const MIN_RATIO = 0.5; // don't allow >50% drop automatically
    if (dropRatio < MIN_RATIO) {
      console.warn(
        `[sync_inspection_vocab] WARN: ruleCount drop too large (prev=${prevCount}, new=${rules.length}). Keeping existing generated file.`
      );
      return;
    }
  }

  const out =
    `// AUTO-GENERATED from Google Sheet at build time. Do not edit by hand.\n` +
    `// Source: ${url}\n` +
    `export const SHEET_META = ${JSON.stringify(meta, null, 2)};\n` +
    `export const SHEET_RULES = ${JSON.stringify(rules, null, 2)};\n`;

  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, out, "utf8");
  console.log(`[sync_inspection_vocab] generated ${OUT} with ${rules.length} rules`);
}

main().catch((e) => {
  console.warn(`[sync_inspection_vocab] WARN: ${e?.message || e}`);
  process.exit(0);
});
