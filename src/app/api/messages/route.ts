import { NextResponse } from "next/server";

import { db, dbEnabled } from "@/lib/db";
import { createMessage, listMessages, markReadThread, seedDemoStoreIfEmpty } from "@/lib/mock-store";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

// Lightweight messages endpoint for dashboard widgets.
// When DB is disabled, we serve from mock-store.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || undefined;
  const rawPartnerId = url.searchParams.get("partnerId") || undefined;
  const partnerId = rawPartnerId ? rawPartnerId.replace(/^(pro_|partner_)/, "") : undefined;
  const limit = Number(url.searchParams.get("limit") || "20");

  const demo = url.searchParams.get("demo") === "1";
  if (demo) seedDemoStoreIfEmpty();

  if (dbEnabled() && !demo) {
    // DB mode
    const take = Number.isFinite(limit) ? Math.max(1, Math.min(500, limit)) : 20;
    // Permissions: only allow messages for this partner's proCode.
    // If a thread is linked to a WorkOrder, also require that the WorkOrder is shared with this partner.
    const partnerProfile = await db().partnerProfile.findUnique({ where: { proCode: partnerId } });
    const sharedWorkOrderIds = partnerProfile
      ? (
          await db().workOrder.findMany({
            where: {
              shareWithPartnerId: partnerProfile.id,
            },
            select: { id: true },
            take: 500,
          })
        ).map((x) => x.id)
      : [];

    const messages = await db().message.findMany({
      where: {
        partnerCode: partnerId,
        ...(token ? { token } : {}),
        thread: {
          OR: [{ workOrderId: null }, { workOrderId: { in: sharedWorkOrderIds } }],
        },
      } as any,
      orderBy: { createdAt: "desc" },
      take,
      include: { thread: true, attachments: true },
    });

    return json({
      ok: true,
      messages: messages.map((m) => ({
        id: m.id,
        createdAt: m.createdAt.toISOString(),
        threadId: m.threadId,
        threadTitle: (m.thread as any)?.title || null,
        propertyAddress: (m.thread as any)?.propertyAddress || null,
        ownerName: (m.thread as any)?.ownerName || null,
        propertyId: (m.thread as any)?.propertyId || null,
        workOrderId: (m.thread as any)?.workOrderId || null,
        reportId: (m.thread as any)?.reportId || null,
        fromRole: m.fromRole,
        fromName: m.fromName || null,
        body: m.body,
        readAt: m.readAt ? m.readAt.toISOString() : null,
        attachments: Array.isArray((m as any).attachments)
          ? (m as any).attachments.map((a: any) => ({ id: a.id, url: a.url, mimeType: a.mimeType, fileName: a.fileName, bytes: a.bytes }))
          : [],
      })),
    });
  }

  const messages = listMessages({ token, partnerId, limit: Number.isFinite(limit) ? limit : 20 });
  return json({ ok: true, messages });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      action?: "send" | "markRead";

      // legacy lead payload
      partnerId?: string;
      name?: string;
      email?: string;
      message?: string;

      // thread messaging payload
      threadId?: string;
      fromRole?: "HO" | "PARTNER" | "SP" | "HG" | "PM" | "SYSTEM";
      fromName?: string;
      text?: string;
      threadTitle?: string;
      propertyAddress?: string;
      ownerName?: string;
      propertyId?: string;
      workOrderId?: string;
      reportId?: string;
      token?: string;
    };

    const action = body.action || (body.threadId ? "send" : undefined);
    const partnerId = body.partnerId?.trim().replace(/^(pro_|partner_)/, "");

    if (!partnerId) return json({ ok: false, error: "missing_partner" }, { status: 400 });

    if (action === "markRead") {
      const threadId = String(body.threadId || "").trim();
      if (!threadId) return json({ ok: false, error: "missing_thread" }, { status: 400 });

      if (dbEnabled()) {
        await db().message.updateMany({
          where: { partnerCode: partnerId, threadId, readAt: null },
          data: { readAt: new Date() },
        });
        return json({ ok: true });
      }

      markReadThread({ partnerId, threadId });
      return json({ ok: true });
    }

    // Thread message send
    if (body.threadId && (body.text || body.message)) {
      const text = String(body.text || body.message || "").trim();
      if (!text) return json({ ok: false, error: "missing_text" }, { status: 400 });
      const threadId = String(body.threadId).trim();
      const fromRole = body.fromRole || "PARTNER";
      const fromName = (body.fromName || "").trim() || null;

      if (dbEnabled()) {
        // Upsert thread meta, then append message
        await db().messageThread.upsert({
          where: { id: threadId },
          create: {
            id: threadId,
            partnerCode: partnerId,
            propertyId: body.propertyId || null,
            workOrderId: body.workOrderId || null,
            reportId: body.reportId || null,
            title: body.threadTitle || null,
            ownerName: body.ownerName || null,
            propertyAddress: body.propertyAddress || null,
          },
          update: {
            propertyId: body.propertyId || undefined,
            workOrderId: body.workOrderId || undefined,
            reportId: body.reportId || undefined,
            title: body.threadTitle || undefined,
            ownerName: body.ownerName || undefined,
            propertyAddress: body.propertyAddress || undefined,
          },
        });

        const created = await db().message.create({
          data: {
            threadId,
            partnerCode: partnerId,
            fromRole: fromRole as any,
            fromName,
            body: text,
            readAt: null,
          },
        });

        return json({ ok: true, messageId: created.id });
      }

      const created = createMessage({
        partnerId,
        token: body.token,
        threadId,
        threadTitle: body.threadTitle,
        ownerName: body.ownerName,
        propertyAddress: body.propertyAddress,
        fromRole,
        body: text,
        readAt: null,
      });

      return json({ ok: true, messageId: created.id });
    }

    // Legacy: lead capture
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const message = body.message?.trim();

    if (!name) return json({ ok: false, error: "missing_name" }, { status: 400 });
    if (!email || !email.includes("@")) return json({ ok: false, error: "invalid_email" }, { status: 400 });
    if (!message) return json({ ok: false, error: "missing_message" }, { status: 400 });

    if (dbEnabled()) {
      const threadId = `lead_${partnerId}`;
      await db().messageThread.upsert({
        where: { id: threadId },
        create: { id: threadId, partnerCode: partnerId, title: "New lead" },
        update: {},
      });
      await db().message.create({
        data: {
          threadId,
          partnerCode: partnerId,
          fromRole: "HO",
          fromName: name,
          body: `${name} <${email}>: ${message}`,
          readAt: null,
        },
      });
      return json({ ok: true });
    }

    createMessage({
      partnerId,
      fromRole: "HO",
      body: `${name} <${email}>: ${message}`,
      readAt: null,
      threadId: `lead_${partnerId}`,
    });

    return json({ ok: true });
  } catch {
    return json({ ok: false, error: "bad_json" }, { status: 400 });
  }
}
