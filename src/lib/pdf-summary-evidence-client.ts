// Client-side summary evidence extraction using pdfjs-dist operator list.
// Strategy:
// - Find pages containing "Report Summary" via textContent.
// - Detect anchors like "Page ## Item: #" and define vertical windows.
// - Walk operator list to locate image XObjects and infer drawn bboxes via CTM.
// - Render the page once and crop images from the rendered canvas using viewport coords.

import { getDocument, Util, OPS } from "pdfjs-dist";

export type ClientEvidenceThumb = { blob: Blob; caption: string; pageNum?: number; section?: string; itemNum?: number };

type ImgDraw = { bboxPdf: [number, number, number, number] };

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function bboxFromCtm(ctm: number[]): [number, number, number, number] {
  // Transform unit square corners by CTM
  const pts = [
    Util.applyTransform([0, 0], ctm),
    Util.applyTransform([1, 0], ctm),
    Util.applyTransform([0, 1], ctm),
    Util.applyTransform([1, 1], ctm),
  ];
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  return [x0, y0, x1, y1];
}

export async function extractSummaryEvidenceThumbsFromPdf(
  file: File,
  opts?: { maxPages?: number; scale?: number; startPage?: number; maxThumbs?: number }
) {
  const ab = await file.arrayBuffer();
  const pdf = await getDocument({ data: ab }).promise;
  // NOTE: despite the name, this now scans broadly (not just summary pages).
  const maxPages = Math.min(opts?.maxPages ?? 60, pdf.numPages || 0);
  const startPage = clamp(Number(opts?.startPage ?? 1), 1, maxPages);
  const maxThumbs = clamp(Number(opts?.maxThumbs ?? 60), 1, 500);
  const scale = opts?.scale ?? 1.25;

  const out: ClientEvidenceThumb[] = [];

  for (let pageNum = startPage; pageNum <= maxPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const strings = (textContent.items || [])
      .map((it: any) => (typeof it?.str === "string" ? String(it.str).trim() : ""))
      .filter(Boolean);

    // Capture anchor y positions.
    // We key off "Item:" markers when present; otherwise we still may capture images on the page.
    const anchors: Array<{ y: number; anchor: string; section?: string; itemNum?: number }> = [];
    const items = Array.isArray(textContent.items) ? (textContent.items as any[]) : [];

    // Best-effort section detection: keep latest seen section word.
    let currentSection: string | undefined;

    for (const it of items) {
      const s = typeof it?.str === "string" ? String(it.str).trim() : "";
      if (!s) continue;
      if (/^(Exterior|Interior|Systems|Safety)/i.test(s)) currentSection = s;
      // Common patterns we've seen:
      // - "Page 12 Item: 3"
      // - "Item: 3"
      // - "ITEM 3"
      const m = s.match(/^(?:Page\s+\d+\s+)?Item:\s*(\d+)$/i) || s.match(/^ITEM\s+(\d+)$/i);
      if (!m) continue;
      const itemNum = Number(m[1]);
      const tr = Array.isArray(it?.transform) ? it.transform : null;
      const y = tr && typeof tr[5] === "number" ? Number(tr[5]) : 0;
      anchors.push({ y, anchor: s, section: currentSection, itemNum: Number.isFinite(itemNum) ? itemNum : undefined });
    }

    anchors.sort((a, b) => b.y - a.y); // higher y first

    // Parse images from operator list
    const opList = await page.getOperatorList();
    const fnArray = opList.fnArray as number[];
    const argsArray = opList.argsArray as any[];

    // Minimal graphics state stack for CTM
    const stack: number[][] = [];
    let ctm = [1, 0, 0, 1, 0, 0];

    const images: ImgDraw[] = [];

    for (let i = 0; i < fnArray.length; i++) {
      const fn = fnArray[i];
      const args = argsArray[i];

      if (fn === (OPS as any).save) {
        stack.push(ctm.slice());
        continue;
      }
      if (fn === (OPS as any).restore) {
        const prev = stack.pop();
        if (prev) ctm = prev;
        continue;
      }
      if (fn === (OPS as any).transform) {
        const m = Array.isArray(args) ? args.map(Number) : [];
        if (m.length === 6) ctm = Util.transform(ctm, m);
        continue;
      }

      const isImageOp =
        fn === (OPS as any).paintImageXObject ||
        fn === (OPS as any).paintJpegXObject ||
        fn === (OPS as any).paintInlineImageXObject ||
        fn === (OPS as any).paintImageXObjectRepeat;

      if (isImageOp) {
        const bb = bboxFromCtm(ctm);
        images.push({ bboxPdf: bb });
        continue;
      }
    }

    if (!images.length) continue;

    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    await page.render({ canvasContext: ctx as any, viewport }).promise;

    // If we found item anchors, associate nearby images to each anchor window.
    // Otherwise, just take a few largest images from the page.
    if (anchors.length) {
      for (let ai = 0; ai < anchors.length; ai++) {
        const a = anchors[ai];
        const next = anchors[ai + 1];
        const yTop = a.y + 10;
        const yBottom = next ? next.y - 10 : -Infinity;

        const inBand = images.filter((im) => {
          const cy = (im.bboxPdf[1] + im.bboxPdf[3]) / 2;
          return cy <= yTop && cy >= yBottom;
        });

        for (const im of inBand.slice(0, 3)) {
          const [x0, y0, x1, y1] = im.bboxPdf;
          const rect = viewport.convertToViewportRectangle([x0, y0, x1, y1]);
          const rx0 = Math.min(rect[0], rect[2]);
          const ry0 = Math.min(rect[1], rect[3]);
          const rx1 = Math.max(rect[0], rect[2]);
          const ry1 = Math.max(rect[1], rect[3]);

          const sx = clamp(Math.floor(rx0), 0, canvas.width - 1);
          const sy = clamp(Math.floor(ry0), 0, canvas.height - 1);
          const sw = clamp(Math.ceil(rx1 - rx0), 1, canvas.width - sx);
          const sh = clamp(Math.ceil(ry1 - ry0), 1, canvas.height - sy);
          if (sw < 32 || sh < 32) continue;

          const crop = document.createElement("canvas");
          const cctx = crop.getContext("2d");
          if (!cctx) continue;
          crop.width = sw;
          crop.height = sh;
          cctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);

          const blob: Blob | null = await new Promise((resolve) => crop.toBlob(resolve, "image/jpeg", 0.82));
          if (!blob) continue;

          out.push({
            blob,
            caption: `${a.section || "Report"} • ${a.anchor} (page ${pageNum})`,
            pageNum,
            section: a.section,
            itemNum: typeof a.itemNum === "number" ? a.itemNum : undefined,
          });

          if (out.length >= maxThumbs) return out;
        }
      }
    } else {
      // No anchors: take up to 3 biggest images on the page.
      const scored = images
        .map((im) => ({ im, area: Math.abs((im.bboxPdf[2] - im.bboxPdf[0]) * (im.bboxPdf[3] - im.bboxPdf[1])) }))
        .sort((a, b) => b.area - a.area)
        .slice(0, 3);
      for (const { im } of scored) {
        const [x0, y0, x1, y1] = im.bboxPdf;
        const rect = viewport.convertToViewportRectangle([x0, y0, x1, y1]);
        const rx0 = Math.min(rect[0], rect[2]);
        const ry0 = Math.min(rect[1], rect[3]);
        const rx1 = Math.max(rect[0], rect[2]);
        const ry1 = Math.max(rect[1], rect[3]);

        const sx = clamp(Math.floor(rx0), 0, canvas.width - 1);
        const sy = clamp(Math.floor(ry0), 0, canvas.height - 1);
        const sw = clamp(Math.ceil(rx1 - rx0), 1, canvas.width - sx);
        const sh = clamp(Math.ceil(ry1 - ry0), 1, canvas.height - sy);
        if (sw < 64 || sh < 64) continue;

        const crop = document.createElement("canvas");
        const cctx = crop.getContext("2d");
        if (!cctx) continue;
        crop.width = sw;
        crop.height = sh;
        cctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);

        const blob: Blob | null = await new Promise((resolve) => crop.toBlob(resolve, "image/jpeg", 0.82));
        if (!blob) continue;

        out.push({ blob, caption: `Report image (page ${pageNum})`, pageNum });
        if (out.length >= maxThumbs) return out;
      }
    }
  }

  return out;
}
