export const DEMO_QUERY_KEY = "demo";

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get(DEMO_QUERY_KEY) === "1";
}

export function withDemo(url: string): string {
  if (typeof window === "undefined") return url;
  const params = new URLSearchParams(window.location.search);
  if (params.get(DEMO_QUERY_KEY) !== "1") return url;

  const u = new URL(url, window.location.origin);
  u.searchParams.set(DEMO_QUERY_KEY, "1");
  return u.pathname + (u.search ? u.search : "");
}

export function ensureDemoHomeownerSession() {
  if (typeof window === "undefined") return;
  if (!isDemoMode()) return;

  const key = "hw_session_v1";
  try {
    const existing = window.localStorage.getItem(key);
    if (existing) return;
  } catch {}

  const demo = {
    token: "demo",
    jobId: "demo",
    email: "demo.homeowner@homeworke.com",
    service: "handyman",
    providerName: "Demo Pro Team",
    date: new Date().toISOString(),
    window: "AM",
    partner: { partnerId: "frj", partnerName: "FRJ Demo Partner" },
    shareWithPartner: true,
  };

  try {
    window.localStorage.setItem(key, JSON.stringify(demo));
  } catch {}
}

export function ensureDemoPartnerContext() {
  if (typeof window === "undefined") return;
  if (!isDemoMode()) return;

  // Must match `loadPartner()` storage key.
  const key = "hw3_partner_context_v1";
  try {
    const existing = window.localStorage.getItem(key);
    if (existing) return;
  } catch {}

  const demo = {
    partnerId: "frj",
    partnerName: "FRJ Demo Partner",
    partnerType: "Real Estate Pro",
    officeName: "FRJ Group",
    createdAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(key, JSON.stringify(demo));
  } catch {}
}
