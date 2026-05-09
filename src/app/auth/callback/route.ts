import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  const res = NextResponse.redirect(new URL(next.startsWith("/") ? next : "/", req.url));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return res;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => req.headers.get("cookie")?.split(";").map((c) => {
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
  }

  return res;
}
