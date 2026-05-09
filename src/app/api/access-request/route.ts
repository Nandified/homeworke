import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      role?: string;
      type?: string;
      name?: string;
      email?: string;
      phone?: string;
      company?: string;
      notes?: string;
    };

    const email = body.email?.trim().toLowerCase();
    if (!email || !email.includes("@")) return json({ ok: false, error: "invalid_email" }, { status: 400 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRole) {
      // fallback: log only
      console.log(JSON.stringify({ type: "access_request", ...body, email }));
      return json({ ok: true, stored: "log_only" });
    }

    const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

    const { error } = await supabase.from("access_requests").insert({
      role: body.role ?? null,
      request_type: body.type ?? null,
      name: body.name ?? null,
      email,
      phone: body.phone ?? null,
      company: body.company ?? null,
      notes: body.notes ?? null,
      source: "web",
    });

    if (error) {
      console.log(JSON.stringify({ type: "access_request_error", error }));
      return json({ ok: false, error: "db_error" }, { status: 500 });
    }

    return json({ ok: true, stored: "supabase" });
  } catch {
    return json({ ok: false, error: "bad_json" }, { status: 400 });
  }
}
