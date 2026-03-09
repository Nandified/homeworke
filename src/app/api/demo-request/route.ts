import { NextResponse } from "next/server";

function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

function isEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isFreeMailDomain(domain: string) {
  const d = domain.toLowerCase();
  return ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com"].includes(d);
}

function getClientIp(req: Request) {
  const h = req.headers;
  // Vercel typically sets x-forwarded-for
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;

    const website = String(body.website ?? "").trim();
    if (website.length > 0) {
      // honeypot hit: discard silently
      return json({ ok: true });
    }

    const fullName = String(body.fullName ?? "").trim();
    const workEmail = String(body.workEmail ?? "").trim();
    const companyName = String(body.companyName ?? "").trim();
    const jobTitle = String(body.jobTitle ?? "").trim();
    const message = String(body.message ?? "").trim();

    const errors: string[] = [];

    if (fullName.length < 2 || fullName.length > 100) errors.push("fullName");
    if (!isEmail(workEmail) || workEmail.length > 200) errors.push("workEmail");
    const domain = workEmail.split("@")[1] || "";
    if (domain && isFreeMailDomain(domain)) errors.push("workEmailDomain");
    if (companyName.length < 1 || companyName.length > 120) errors.push("companyName");
    if (jobTitle.length < 2 || jobTitle.length > 100) errors.push("jobTitle");
    if (message.length > 500) errors.push("message");

    if (errors.length) {
      return json(
        {
          ok: false,
          error: "validation",
          fields: errors,
        },
        { status: 400 }
      );
    }

    // Phase 1: structured log (works with Vercel log drains)
    const record = {
      type: "demo_request",
      requestId: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ip: getClientIp(req),
      fullName,
      workEmail,
      companyName,
      jobTitle,
      message: message || null,
      userAgent: req.headers.get("user-agent"),
    };

    console.log(JSON.stringify(record));

    return json({
      ok: true,
      message: "Your demo request has been received. A member of our team will be in touch within one business day.",
    });
  } catch {
    return json(
      {
        ok: false,
        message:
          "We were unable to process your request at this time. Please try again or reach out to us directly at support.",
      },
      { status: 500 }
    );
  }
}
