import { NextResponse } from "next/server";

export const runtime = "nodejs";

import { db, dbEnabled } from "@/lib/db";
import { extractSummaryEvidenceBlocksFromPdf } from "@/lib/pdf-summary-evidence";
import { put } from "@vercel/blob";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!dbEnabled()) {
    return NextResponse.json({ ok: false, error: "DB disabled" }, { status: 503 });
  }
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

  const report = await db().inspectionReport.findUnique({ where: { id } });
  if (!report) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  await db().inspectionReport.update({ where: { id }, data: { status: "PROCESSING", error: null } });

  try {
    const r = await fetch(report.pdfUrl);
    if (!r.ok) throw new Error(`Failed to fetch PDF (${r.status})`);
    const ab = await r.arrayBuffer();
    const buf = Buffer.from(ab);

    // Phase 1: reuse existing summary extractor (will be replaced with all-pages item extraction)
    const blocks = await extractSummaryEvidenceBlocksFromPdf(buf, { maxPages: 25 });

    // Upload extracted images to Blob and write evidence rows.
    for (const b of blocks) {
      for (let i = 0; i < b.images.length; i++) {
        const im = b.images[i];
        const ext = im.mime.includes("png") ? "png" : "jpg";
        const key = `inspection-evidence/${id}/item-${b.itemNumber}/p${b.targetPage}-${i}.${ext}`;
        const bytes = Buffer.from(im.base64, "base64");
        const blob = await put(key, bytes, {
          access: "public",
          contentType: im.mime,
          addRandomSuffix: true,
        });

        await db().inspectionEvidence.create({
          data: {
            reportId: id,
            itemNumber: b.itemNumber || null,
            pageNum: b.targetPage || null,
            imageUrl: blob.url,
            caption: b.title || b.anchorText,
          },
        });
      }
    }

    await db().inspectionReport.update({
      where: { id },
      data: { status: "DONE" },
    });

    return NextResponse.json({ ok: true, extractedBlocks: blocks.length });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e || "error");
    await db().inspectionReport.update({ where: { id }, data: { status: "ERROR", error: msg } });
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
