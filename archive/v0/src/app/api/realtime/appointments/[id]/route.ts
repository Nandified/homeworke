export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sse(data: unknown, event?: string) {
  const payload = JSON.stringify(data);
  const lines = [event ? `event: ${event}` : null, `data: ${payload}`, ""].filter(Boolean);
  return lines.join("\n") + "\n";
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") || "demo";

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      const send = (obj: unknown, event?: string) => {
        if (closed) return;
        controller.enqueue(encoder.encode(sse(obj, event)));
      };

      send({ ok: true, appointmentId: id, mode, serverTime: new Date().toISOString() }, "hello");

      const timeline =
        mode === "fast"
          ? [
              { t: 1000, type: "pm_assigned", etaMinutes: 20 },
              { t: 2500, type: "pm_on_the_way", etaMinutes: 8 },
              { t: 4200, type: "arrived", etaMinutes: 0 },
              { t: 6500, type: "work_started" },
              { t: 9000, type: "work_completed" },
            ]
          : [
              { t: 2500, type: "pm_assigned", etaMinutes: 24 },
              { t: 6000, type: "pm_on_the_way", etaMinutes: 11 },
              { t: 10000, type: "arrived", etaMinutes: 0 },
              { t: 15000, type: "work_started" },
              { t: 21000, type: "work_completed" },
            ];

      const timers = timeline.map((e, idx) =>
        setTimeout(() => {
          send(
            {
              appointmentId: id,
              seq: idx + 1,
              type: e.type,
              etaMinutes: (e as { etaMinutes?: number }).etaMinutes,
              createdAt: new Date().toISOString(),
            },
            "timeline"
          );
        }, e.t)
      );

      const hb = setInterval(() => {
        send({ serverTime: new Date().toISOString() }, "ping");
      }, 15000);

      const abort = () => {
        if (closed) return;
        closed = true;
        timers.forEach(clearTimeout);
        clearInterval(hb);
        try {
          controller.close();
        } catch {
          // ignore
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (req as any).signal?.addEventListener?.("abort", abort);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
