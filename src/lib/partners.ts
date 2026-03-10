import partners from "@/../spec/partners.json";

/**
 * Shape of a single partner profile entry as defined in partners.json.
 */
export type PartnerProfile = (typeof partners)[number];

/**
 * Resolve a partner profile by its code (case-insensitive).
 *
 * @param code - The partner code to look up.
 * @returns The matching `PartnerProfile`, or `null` if no match is found.
 */
export function resolvePartner(code: string): PartnerProfile | null {
  const normalised = code.toLowerCase();
  return partners.find((p) => p.pro_code.toLowerCase() === normalised) ?? null;
}

/**
 * Derive a deterministic partner ID from a code.
 *
 * @param code - The partner code.
 * @returns A string in the form `pro_<lowercase code>`.
 */
export function partnerIdFor(code: string): string {
  return `pro_${code.toLowerCase()}`;
}
