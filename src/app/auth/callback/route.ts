import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { dbEnabled, db } from "@/lib/db";

export const runtime = "nodejs";

function safeNext(next: string | null) {
  return next && next.startsWith("/") ? next : "/";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  const res = NextResponse.redirect(new URL(next, req.url));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return res;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () =>
        req.headers
          .get("cookie")
          ?.split(";")
          .map((c) => {
            const [name, ...rest] = c.trim().split("=");
            return { name, value: rest.join("=") };
          }) ?? [],
      setAll: (cookies) => {
        for (const c of cookies) res.cookies.set(c.name, c.value, c.options);
      },
    },
  });

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);

    // Homepage AI flow: if there is a pending confirmation for this email, finalize it now.
    try {
      if (dbEnabled()) {
        const { data } = await supabase.auth.getUser();
        const email = (data?.user?.email || "").trim().toLowerCase();
        if (email) {
          const pending = await db().pendingConfirmation.findFirst({
            where: { email, confirmedAt: null },
            orderBy: { createdAt: "desc" },
          });

          if (pending) {
            const payload = (pending.payload || {}) as any;
            const leadRole = String(payload.leadRole || pending.leadRole || "homeowner");
            const intake = payload.intake || {};

            const role = leadRole === "homeowner" ? "HOMEOWNER" : "PARTNER";
            const user = await db().user.upsert({
              where: { email },
              update: { role },
              create: { email, role },
            });

            await db().workOrder.create({
              data: {
                userId: user.id,
                originPartnerId: intake.originPartnerId ?? null,
                shareWithPartnerId: intake.shareWithPartner ? (intake.originPartnerId ?? null) : null,
                serviceCategory: intake.service_category || "General",
                serviceSubcategory: intake.service_subcategory || null,
                issueDescription: intake.issue_description || null,
                urgencyLevel: intake.urgency_level || null,
                propertyAddress: intake.property_address || null,
                propertyType: intake.property_type || null,
                preferredDate: intake.preferred_date ? new Date(String(intake.preferred_date) + "T00:00:00") : null,
                preferredWindow: intake.preferred_time_window || null,
                status: "SUBMITTED",
              },
            });

            await db().pendingConfirmation.update({
              where: { id: pending.id },
              data: { confirmedAt: new Date() },
            });
          }
        }
      }
    } catch (e) {
      console.log(JSON.stringify({ type: "auth_callback_finalize_error", message: String((e as any)?.message || e) }));
    }
  }

  return res;
}
