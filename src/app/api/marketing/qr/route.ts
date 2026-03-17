import { NextRequest } from "next/server";

import QRCode from "qrcode";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const data = req.nextUrl.searchParams.get("data") || "";

  if (!data) {
    return new Response("Missing data", { status: 400 });
  }

  // Generate a crisp QR PNG (bigger than the on-screen preview)
  const png = await QRCode.toBuffer(data, {
    margin: 1,
    width: 1024,
    errorCorrectionLevel: "M",
  });

  return new Response(png as unknown as BodyInit, {
    headers: {
      "Content-Type": "image/png",
      // inline so iOS Safari can open a viewer tab; users can still choose Download
      "Content-Disposition": "inline; filename=homeworke-invite-qr.png",
      "Cache-Control": "no-store",
    },
  });
}
