export const PARTNER_STORAGE_KEY = "hw3_partner_context_v1";

export type PartnerContext = {
  partnerId: string;
  partnerName: string;
  partnerType: string;
  officeName: string;
  createdAt: string;
};

export function loadPartner(): PartnerContext | null {
  try {
    const raw = localStorage.getItem(PARTNER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PartnerContext;
  } catch {
    return null;
  }
}

export function clearPartner() {
  try {
    localStorage.removeItem(PARTNER_STORAGE_KEY);
  } catch {
    // ignore
  }
}
