import crypto from "node:crypto";

import { PDFExtract } from "pdf.js-extract";

export type SummaryEvidenceImage = {
  sha256: string;
  mime: string;
  bytes: number;
  base64: string; // raw base64 (no data: prefix)
  bbox: { x0: number; y0: number; x1: number; y1: number; w: number; h: number };
};

export type SummaryEvidenceBlock = {
  summaryPage: number; // page number in PDF where the summary block appears
  targetPage: number; // the referenced page number in the anchor ("Page ## Item: #")
  itemNumber: number;
  section?: string;
  title?: string;
  anchorText: string;
  images: SummaryEvidenceImage[];
};

function normalizeText(s: string) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

function bboxFromItem(it: any) {
  const x0 = Number(it?.x ?? 0);
  const y0 = Number(it?.y ?? 0);
  const w = Number(it?.width ?? 0);
  const h = Number(it?.height ?? 0);
  return { x0, y0, x1: x0 + w, y1: y0 + h, w, h };
}

function bboxFromImage(img: any) {
  const t = Array.isArray(img?.transform) ? img.transform : [1, 0, 0, 1, 0, 0];
  const [a, b, c, d, e, f] = t.map((n: any) => Number(n));
  const drawW = Math.hypot(a, b) || Math.abs(a) || 0;
  const drawH = Math.hypot(c, d) || Math.abs(d) || 0;
  const x = Number.isFinite(Number(img?.x)) ? Number(img.x) : e;
  const y = Number.isFinite(Number(img?.y)) ? Number(img.y) : f;
  const x0 = x;
  const y1 = y;
  const x1 = x + drawW;
  const y0 = y - drawH;
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

function area(bb: { w: number; h: number }) {
  return Math.max(0, bb.w) * Math.max(0, bb.h);
}

export async function extractSummaryEvidenceBlocksFromPdf(buf: Buffer, opts?: { maxPages?: number }) {
  const pdfExtract = new PDFExtract();
  const data = await pdfExtract.extractBuffer(buf, {
    includeImages: true,
    normalizeWhitespace: true,
    verbosity: -1,
  });

  const blocks: SummaryEvidenceBlock[] = [];
  const maxPages = Math.min(opts?.maxPages ?? 20, data.pages.length);

  for (let pi = 0; pi < maxPages; pi++) {
    const p = data.pages[pi];
    const pageNum = pi + 1;
    const pageW = Number((p as any)?.pageInfo?.width ?? 612);
    const pageH = Number((p as any)?.pageInfo?.height ?? 792);
    const pageArea = pageW * pageH;

    const content = Array.isArray(p?.content) ? p.content : [];
    const images = Array.isArray(p?.images) ? p.images : [];

    const textItems = content
      .map((it: any) => ({ text: normalizeText(it?.str), raw: it, bbox: bboxFromItem(it) }))
      .filter((t: any) => t.text);

    const lines = textItems.map((t: any) => t.text);
    const joined = lines.join("\n");
    if (!/Report Summary/i.test(joined)) continue;

    // Find each anchor occurrence.
    for (let i = 0; i < textItems.length; i++) {
      const t = textItems[i];
      const m = t.text.match(/^Page\s+(\d+)\s+Item:\s*(\d+)/i);
      if (!m) continue;

      const targetPage = Number(m[1] || 0) || 0;
      const itemNumber = Number(m[2] || 0) || 0;

      // Best-effort: section is the nearest preceding standalone word line like "Exterior".
      let section: string | undefined;
      for (let j = i - 1; j >= 0; j--) {
        const txt = textItems[j].text;
        if (/^(Exterior|Interior|Systems|Safety)/i.test(txt)) {
          section = txt;
          break;
        }
      }

      // Best-effort: title is the next non-bullet line.
      let title: string | undefined;
      for (let j = i + 1; j < Math.min(textItems.length, i + 8); j++) {
        const txt = textItems[j].text;
        if (!txt) continue;
        if (txt.startsWith("•")) continue;
        if (/^Page\s+\d+\s+Item:/i.test(txt)) break;
        title = txt;
        break;
      }

      // Define a vertical window: from anchor line down until next anchor or end.
      const yTop = t.bbox.y0;
      let yBottom = pageH;
      for (let j = i + 1; j < textItems.length; j++) {
        const txt = textItems[j].text;
        if (/^Page\s+\d+\s+Item:/i.test(txt)) {
          yBottom = textItems[j].bbox.y1;
          break;
        }
      }

      const imgs: SummaryEvidenceImage[] = [];
      for (const im of images) {
        const bbox = bboxFromImage(im);
        const cover = area(bbox) / pageArea;
        if (cover > 0.85) continue; // drop full-page backgrounds

        const cy = (bbox.y0 + bbox.y1) / 2;
        if (cy < yTop - 10) continue;
        if (cy > yBottom + 10) continue;

        const base64 = typeof im?.base64data === "string" ? im.base64data : "";
        if (!base64) continue;

        // pdf.js-extract doesn't always provide mime; assume jpeg (common in these reports)
        const mime = String(im?.kind || "").toLowerCase().includes("png") ? "image/png" : "image/jpeg";
        const bytes = Math.floor((base64.length * 3) / 4);
        const sha256 = crypto.createHash("sha256").update(Buffer.from(base64, "base64")).digest("hex");
        imgs.push({ sha256, mime, bytes, base64, bbox });
      }

      if (imgs.length) {
        blocks.push({
          summaryPage: pageNum,
          targetPage,
          itemNumber,
          section,
          title,
          anchorText: t.text,
          images: imgs,
        });
      }
    }
  }

  return blocks;
}
