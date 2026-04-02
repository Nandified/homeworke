import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Single-image OCR endpoint.
// Used by the client to OCR rasterized PDF pages when a PDF is scanned/image-only.

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY || "";
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "missing_openai_key" }, { status: 503 });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "missing_file" }, { status: 400 });
    }

    const mime = String((file as any).type || "");
    if (!mime.startsWith("image/")) {
      return NextResponse.json({ ok: false, error: "unsupported_type" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const b64 = buf.toString("base64");

    const sys =
      "You are performing OCR. Extract ALL readable text from the image. " +
      "Preserve order as best as possible. Return plain text only.";

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.4-mini",
        max_output_tokens: 1800,
        input: [
          { role: "system", content: sys },
          {
            role: "user",
            content: [
              { type: "input_text", text: "OCR this image." },
              { type: "input_image", image_url: `data:${mime};base64,${b64}` },
            ],
          },
        ],
      }),
    });

    const t = await res.text().catch(() => "");
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `openai_ocr_failed_${res.status}`, detail: (t || "").slice(0, 400) },
        { status: 502 }
      );
    }

    const j = JSON.parse(t);
    const direct = j?.output_text;
    if (typeof direct === "string" && direct.trim()) {
      return NextResponse.json({ ok: true, text: direct.trim() });
    }

    const parts: string[] = [];
    const out = Array.isArray(j?.output) ? j.output : [];
    for (const item of out) {
      const content = Array.isArray(item?.content) ? item.content : [];
      for (const c of content) {
        const txt = (c && typeof c.text === "string" ? c.text : "").trim();
        if (txt) parts.push(txt);
      }
    }
    return NextResponse.json({ ok: true, text: parts.join("\n").trim() });
  } catch (e) {
    const msg = e && typeof e === "object" && "message" in e ? String((e as any).message) : "";
    return NextResponse.json({ ok: false, error: "ocr_failed", detail: msg || "unknown" }, { status: 500 });
  }
}
