// Build-time generator: convert the Top-100 repair catalog CSV into a TS module.
//
// Why: Vercel/serverless runtimes shouldn't depend on reading CSV from disk at runtime.
// This generates a typed JS array bundled into the app.

import fs from "node:fs/promises";
import path from "node:path";

const IN_PATH = process.env.REPAIR_CATALOG_CSV || path.join(process.cwd(), "data/repair_catalog_top100.csv");
const OUT_PATH =
  process.env.REPAIR_CATALOG_OUT || path.join(process.cwd(), "src/lib/repair-catalog.generated.ts");

function parseCsv(text) {
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
      // trim trailing CR
      if (row.length) row[row.length - 1] = String(row[row.length - 1]).replace(/\r$/, "");
      rows.push(row);
      row = [];
      i++;
      continue;
    }

    field += c;
    i++;
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function num(v) {
  const n = Number(String(v || "").trim());
  return Number.isFinite(n) ? n : null;
}

async function main() {
  const csv = await fs.readFile(IN_PATH, "utf8");
  const rows = parseCsv(csv);
  if (rows.length < 2) throw new Error("catalog CSV too small");

  const header = rows[0].map((h) => String(h || "").trim());
  const idx = (name) => header.findIndex((h) => h === name);

  const cols = {
    item_code: idx("item_code"),
    item_name: idx("item_name"),
    system: idx("system"),
    trade: idx("trade"),
    unit: idx("unit"),
    typical_qty_notes: idx("typical_qty_notes"),
    labor_hours_low: idx("labor_hours_low"),
    labor_hours_high: idx("labor_hours_high"),
    material_low: idx("material_low"),
    material_high: idx("material_high"),
    complexity_modifiers_notes: idx("complexity_modifiers_notes"),
    permit_likely: idx("permit_likely"),
    specialist_required: idx("specialist_required"),
  };

  const missing = Object.entries(cols)
    .filter(([, v]) => v < 0)
    .map(([k]) => k);
  if (missing.length) throw new Error(`catalog CSV missing columns: ${missing.join(", ")}`);

  const items = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const code = String(row[cols.item_code] || "").trim();
    if (!code || code.startsWith("#")) continue;
    items.push({
      item_code: code,
      item_name: String(row[cols.item_name] || "").trim(),
      system: String(row[cols.system] || "").trim(),
      trade: String(row[cols.trade] || "").trim(),
      unit: String(row[cols.unit] || "").trim(),
      typical_qty_notes: String(row[cols.typical_qty_notes] || "").trim(),
      labor_hours_low: num(row[cols.labor_hours_low]),
      labor_hours_high: num(row[cols.labor_hours_high]),
      material_low: num(row[cols.material_low]),
      material_high: num(row[cols.material_high]),
      complexity_modifiers_notes: String(row[cols.complexity_modifiers_notes] || "").trim(),
      permit_likely: String(row[cols.permit_likely] || "").trim().toLowerCase() === "yes",
      specialist_required: String(row[cols.specialist_required] || "").trim().toLowerCase() === "yes",
    });
  }

  const meta = { ok: true, generatedAt: new Date().toISOString(), count: items.length };

  const out =
    `// AUTO-GENERATED from ${path.relative(process.cwd(), IN_PATH)} at build time.\n` +
    `export const REPAIR_CATALOG_META = ${JSON.stringify(meta, null, 2)} as const;\n` +
    `export const REPAIR_CATALOG = ${JSON.stringify(items, null, 2)} as const;\n`;

  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });
  await fs.writeFile(OUT_PATH, out, "utf8");
  console.log(`[repair_catalog] generated ${OUT_PATH} with ${items.length} items`);
}

main().catch((e) => {
  console.warn(`[repair_catalog] WARN: ${e?.message || e}`);
  process.exit(0);
});
