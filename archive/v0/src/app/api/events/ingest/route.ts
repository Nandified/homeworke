import { NextResponse } from "next/server";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

function getClientIp(req: Request) {
  const h = req.headers;
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
}

export async function POST(req: Request) {
  const secret = process.env.EVENTS_WEBHOOK_SECRET;
  if (!secret) {
    return json(
      {
        ok: false,
        error: "missing_server_secret",
      },
      { status: 500 }
    );
  }

  const got = req.headers.get("x-homeworke-events-secret");
  if (!got || got !== secret) {
    return json(
      {
        ok: false,
        error: "unauthorized",
      },
      { status: 401 }
    );
  }

  try {
    const payload = (await req.json()) as unknown;

    // Phase 1: structured log for log drains
    console.log(
      JSON.stringify({
        type: "event_ingest",
        createdAt: new Date().toISOString(),
        ip: getClientIp(req),
        payload,
        userAgent: req.headers.get("user-agent"),
      })
    );

    return json({ ok: true });
  } catch {
    return json(
      {
        ok: false,
        error: "bad_json",
      },
      { status: 400 }
    );
  }
}
