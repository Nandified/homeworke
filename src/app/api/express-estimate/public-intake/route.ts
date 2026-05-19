import { NextResponse } from "next/server";
import crypto from "node:crypto";

import { put } from "@vercel/blob";

import { db, dbEnabled } from "@/lib/db";
import { upsertJob } from "@/lib/express-estimate-jobs-db";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return json({ ok: false, error: "missing_file" }, { status: 400 });

    const name = clean(form.get("name"));
    const email = clean(form.get("email")).toLowerCase();
    const phone = clean(form.get("phone"));
    const address = clean(form.get("address"));
    const propertyType = clean(form.get("propertyType"));
    const notes = clean(form.get("notes"));

    if (!name) return json({ ok: false, error: "missing_name" }, { status: 400 });
    if (!validEmail(email)) return json({ ok: false, error: "invalid_email" }, { status: 400 });
    if (!phone) return json({ ok: false, error: "missing_phone" }, { status: 400 });
    if (!address) return json({ ok: false, error: "missing_address" }, { status: 400 });

    const bytes = Number(file.size || 0);
    if (bytes > 25 * 1024 * 1024) {
      return json({ ok: false, error: "file_too_large", detail: "Max report size is 25MB." }, { status: 413 });
    }

    const fileName = String(file.name || "inspection-report.pdf").replace(/[^\w.\- ]+/g, "").trim() || "inspection-report.pdf";
    const mimeType = file.type || "application/pdf";
    const buf = Buffer.from(await file.arrayBuffer());
    const pdfSha256 = crypto.createHash("sha256").update(buf).digest("hex");

    const blob = await put(`instant-estimates/public/${Date.now()}-${fileName}`, buf, {
      access: "public",
      contentType: mimeType,
    });

    let reportId = `rpt_${pdfSha256.slice(0, 12)}`;
    let portalPath = `/ho/express-estimate/${encodeURIComponent(reportId)}?address=${encodeURIComponent(address)}&owner=${encodeURIComponent(name)}`;

    const payload = {
      kind: "instant_estimate_public_intake",
      reportmodel_version: "reportmodel.v0.1",
      scope_schema: "Homeworke_3_ScopeJSON_Schema",
      lead: { name, email, phone },
      property: { address, propertyType },
      report: {
        reportId,
        pdfUrl: blob.url,
        pdfBytes: bytes,
        pdfSha256,
        fileName,
        status: "QUEUED",
      },
      notes,
      portalPath,
    };

    if (dbEnabled()) {
      const report = await db().inspectionReport.create({
        data: {
          status: "QUEUED",
          pdfUrl: blob.url,
          pdfBytes: bytes,
          pdfSha256,
          ownerName: name,
          address,
          inspector: "Public Instant Estimate",
        },
      });

      reportId = report.id;
      portalPath = `/ho/express-estimate/${encodeURIComponent(reportId)}?address=${encodeURIComponent(address)}&owner=${encodeURIComponent(name)}`;

      await db().user.upsert({
        where: { email },
        update: { role: "HOMEOWNER" },
        create: { email, role: "HOMEOWNER" },
      });

      await db().pendingConfirmation.create({
        data: {
          email,
          name,
          phone,
          leadRole: "homeowner",
          redirectAfterConfirm: portalPath,
          payload: { ...payload, report: { ...payload.report, reportId }, portalPath },
        },
      });

      const token = crypto.randomBytes(24).toString("hex");
      await db().magicLinkToken.create({
        data: {
          email,
          token,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        },
      });

      const magic = new URL("/api/auth/consume", req.url);
      magic.searchParams.set("token", token);
      magic.searchParams.set("next", portalPath);
      console.log(JSON.stringify({ type: "public_instant_estimate_magic_link", email, reportId, link: magic.toString() }));
    } else {
      console.log(JSON.stringify({ type: "public_instant_estimate_mock", email, payload: { ...payload, report: { ...payload.report, reportId }, portalPath } }));
    }

    await upsertJob({ reportId, status: "PROCESSING", progressPct: 1, step: "Queued" }).catch(() => {});

    return json({
      ok: true,
      reportId,
      portalPath,
      message: "Report received. We will email the private portal link when the Instant Estimate is ready.",
    });
  } catch (e: unknown) {
    const detail = e && typeof e === "object" && "message" in e ? String(e.message) : "Unknown error";
    return json({ ok: false, error: "submit_failed", detail }, { status: 500 });
  }
}
