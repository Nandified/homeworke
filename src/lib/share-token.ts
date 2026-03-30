import crypto from "crypto";

export type ShareMode = "full" | "selected";

export type ShareRecipientRole =
  | "Homeowner"
  | "Homebuyer"
  | "Listing Agent"
  | "Buyer’s Agent"
  | "Buyer’s Closing Coordinator"
  | "Seller’s Closing Coordinator"
  | "Assistant"
  | "Contractor / Vendor"
  | "Other";

export type ReportShareLaneV1 = {
  title: string;
  items: Array<{ id: string; label: string; note?: string; range?: string; price?: number }>;
};

export type ReportSharePayloadV1 = {
  v: 1;
  kind: "express_estimate_report";
  reportId: string;
  address?: string;
  reportType?: string;

  // Optional client context (when the report is tied to a client property)
  client?: {
    name?: string;
    email?: string;
    phone?: string;
  };

  // Courtesy of the pro who generated/shared this report
  pro?: {
    code?: string; // partner pro_code (used to enrich from landing page profile)
    name?: string;
    email?: string;
    phone?: string;
    brokerageName?: string;
  };

  mode: ShareMode;
  selectedIds?: string[];

  // Snapshot of lanes at share time (keeps share view consistent even as demo data changes)
  lanes?: ReportShareLaneV1[];

  createdAt: number; // ms
  exp: number; // ms
  recipient: {
    name?: string;
    email?: string;
    phone?: string;
    role?: ShareRecipientRole;
  };
};

function b64urlEncode(buf: Buffer) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function b64urlDecode(s: string) {
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64");
}

function sign(input: string, secret: string) {
  return b64urlEncode(crypto.createHmac("sha256", secret).update(input).digest());
}

export function createShareToken(payload: ReportSharePayloadV1, secret: string) {
  const body = b64urlEncode(Buffer.from(JSON.stringify(payload), "utf8"));
  const sig = sign(body, secret);
  return `${body}.${sig}`;
}

export function verifyShareToken(token: string, secret: string): { ok: true; payload: ReportSharePayloadV1 } | { ok: false; error: string } {
  try {
    const [body, sig] = token.split(".");
    if (!body || !sig) return { ok: false, error: "invalid_token" };

    const expected = sign(body, secret);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { ok: false, error: "bad_signature" };

    const raw = b64urlDecode(body).toString("utf8");
    const payload = JSON.parse(raw) as ReportSharePayloadV1;
    if (!payload || payload.v !== 1 || payload.kind !== "express_estimate_report") return { ok: false, error: "unsupported" };

    if (typeof payload.exp === "number" && Date.now() > payload.exp) return { ok: false, error: "expired" };

    return { ok: true, payload };
  } catch {
    return { ok: false, error: "invalid_token" };
  }
}
