import { NextResponse } from "next/server";

// Demo-only: accept a PDF upload and return a staged id.
// In a real implementation, this would persist the PDF to storage and create a Report row.
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file) return NextResponse.json({ ok: false, error: "missing_file" }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "server_error", detail: String(e?.message || e || "unknown") }, { status: 500 });
  }
}
