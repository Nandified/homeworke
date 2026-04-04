export type FindingSystem =
  | "Roof"
  | "Exterior"
  | "Garage"
  | "Attic"
  | "Interior"
  | "Appliances"
  | "HVAC"
  | "Electrical"
  | "Plumbing"
  | "Structure"
  | "Foundation"
  | "WindowsDoors"
  | "InsulationVentilation"
  | "Fireplace"
  | "PoolSpa"
  | "SiteDrainage"
  | "Other";

export type FindingRating = "Acceptable" | "Monitor" | "Repair" | "Safety" | "NotAccessible" | "Unknown";

export type FindingPriority = "P0" | "P1" | "P2" | "P3";

export type NormalizationContext = "system" | "rating" | "trade" | "access";

export type RegexRule<T extends string> = {
  context: NormalizationContext;
  pattern: string; // JS regex source (will be compiled with /i)
  value: T;
  note?: string;
};

import { SHEET_RULES } from "@/lib/inspection-normalization-map.generated";

function asRules<T extends string>(context: NormalizationContext): Array<RegexRule<T>> {
  return (SHEET_RULES || [])
    .filter((r) => r && typeof r === "object" && String((r as any).context) === context)
    .map((r) => ({
      context,
      pattern: String((r as any).pattern || ""),
      value: String((r as any).value || "") as T,
      note: typeof (r as any).note === "string" ? (r as any).note : undefined,
    }))
    .filter((r) => r.pattern && r.value);
}

const SHEET_SYSTEM_RULES = asRules<FindingSystem>("system");
const SHEET_RATING_RULES = asRules<FindingRating>("rating");
const SHEET_TRADE_RULES = asRules<string>("trade");

export const SYSTEM_RULES: Array<RegexRule<FindingSystem>> = [
  ...SHEET_SYSTEM_RULES,
  // Built-in fallbacks
  { context: "system", pattern: "roof|flashing", value: "Roof" },
  { context: "system", pattern: "exterior|siding|trim|deck|porch|steps|driveway|walkway|ground(s)?|site", value: "Exterior" },
  { context: "system", pattern: "grading|drainage", value: "SiteDrainage" },
  { context: "system", pattern: "garage", value: "Garage" },
  { context: "system", pattern: "attic", value: "Attic" },
  { context: "system", pattern: "interior|walls|ceilings|floors|stairs", value: "Interior" },
  { context: "system", pattern: "appliance|dishwasher|range|oven|microwave|refrigerator|washer|dryer", value: "Appliances" },
  { context: "system", pattern: "hvac|furnace|boiler|cooling|ac\\b|a/c|air conditioner|heat pump|duct|heat", value: "HVAC" },
  { context: "system", pattern: "electrical|service|panel|breaker|outlet|receptacle|gfci", value: "Electrical" },
  { context: "system", pattern: "plumbing|water heater|supply|drain|waste|vent|sump|sewer", value: "Plumbing" },
  { context: "system", pattern: "structure|framing|joist|beam|post|column", value: "Structure" },
  { context: "system", pattern: "foundation|crawlspace|basement|slab", value: "Foundation" },
  { context: "system", pattern: "window|door", value: "WindowsDoors" },
  { context: "system", pattern: "insulation|ventilation|soffit|ridge vent", value: "InsulationVentilation" },
  { context: "system", pattern: "fireplace|chimney", value: "Fireplace" },
  { context: "system", pattern: "pool|spa|hot tub", value: "PoolSpa" },
];

export const RATING_RULES: Array<RegexRule<FindingRating>> = [
  ...SHEET_RATING_RULES,
  { context: "rating", pattern: "safety|hazard|danger", value: "Safety" },
  { context: "rating", pattern: "not accessible|not inspected|inaccessible|limited|unable to|could not|not visible|obstruct", value: "NotAccessible" },
  { context: "rating", pattern: "unsat|defect|defective|deficient|repair|replace|recommend", value: "Repair" },
  { context: "rating", pattern: "monitor|maintenance|marginal|watch", value: "Monitor" },
  { context: "rating", pattern: "acceptable|ok|satisfactory|good|working|functional|serviceable", value: "Acceptable" },
];

export const TRADE_RULES: Array<RegexRule<string>> = [
  ...SHEET_TRADE_RULES,
  { context: "trade", pattern: "electric", value: "electrician" },
  { context: "trade", pattern: "plumb", value: "plumber" },
  { context: "trade", pattern: "hvac|furnace|boiler|air conditioner|heat pump", value: "hvac" },
  { context: "trade", pattern: "roof", value: "roofer" },
  { context: "trade", pattern: "foundation", value: "foundation" },
  { context: "trade", pattern: "mason|brick|tuckpoint", value: "mason" },
  { context: "trade", pattern: "pest|termite", value: "pest" },
  { context: "trade", pattern: "mold", value: "mold" },
  { context: "trade", pattern: "asbestos", value: "asbestos" },
  { context: "trade", pattern: "engineer", value: "structural_engineer" },
  { context: "trade", pattern: "carpenter|framing", value: "carpenter" },
  { context: "trade", pattern: "general|qualified contractor|contractor|handyman", value: "general_contractor" },
];

export const LICENSE_HINT = /\blicensed\b|\bqualified\b|\bcertified\b/i;

export function applyRegexRules<T extends string>(rules: Array<RegexRule<T>>, raw?: string): T | undefined {
  const s = (raw || "").toLowerCase();
  if (!s) return undefined;
  for (const r of rules) {
    try {
      const re = new RegExp(r.pattern, "i");
      if (re.test(s)) return r.value;
    } catch {
      // ignore bad rule
    }
  }
  return undefined;
}
