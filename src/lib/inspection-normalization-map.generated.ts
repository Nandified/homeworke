// AUTO-GENERATED from Google Sheet at build time. Do not edit by hand.
// Source: https://docs.google.com/spreadsheets/d/10mTd71gvi7njJAbSuWDWez9mjGMGvlemQ3aXgsOLBAk/gviz/tq?tqx=out%3Acsv&sheet=Sheet1&range=F97%3AK2000
export const SHEET_META = {
  "ok": true,
  "generatedAt": "2026-04-10T20:56:34.280Z",
  "sheetId": "10mTd71gvi7njJAbSuWDWez9mjGMGvlemQ3aXgsOLBAk",
  "sheetName": "Sheet1",
  "range": "F97:K2000",
  "sourceUrl": "https://docs.google.com/spreadsheets/d/10mTd71gvi7njJAbSuWDWez9mjGMGvlemQ3aXgsOLBAk/gviz/tq?tqx=out%3Acsv&sheet=Sheet1&range=F97%3AK2000",
  "ruleCount": 21,
  "validation": {
    "allowedSystems": [
      "Roof",
      "Exterior",
      "Garage",
      "Attic",
      "Interior",
      "Appliances",
      "HVAC",
      "Electrical",
      "Plumbing",
      "Structure",
      "Foundation",
      "WindowsDoors",
      "InsulationVentilation",
      "Fireplace",
      "PoolSpa",
      "SiteDrainage",
      "Other"
    ],
    "allowedRatings": [
      "Acceptable",
      "Monitor",
      "Repair",
      "Safety",
      "NotAccessible",
      "Unknown"
    ],
    "allowedTrades": [
      "general_contractor",
      "electrician",
      "electrician_licensed",
      "plumber",
      "plumber_licensed",
      "hvac",
      "roofer",
      "mason",
      "foundation",
      "carpenter",
      "pest",
      "mold",
      "asbestos",
      "structural_engineer",
      "other"
    ]
  }
};
export const SHEET_RULES = [
  {
    "context": "system",
    "pattern": "Grounds",
    "value": "Exterior",
    "note": "Common synonym"
  },
  {
    "context": "system",
    "pattern": "Site",
    "value": "Exterior",
    "note": "Sometimes maps to SiteDrainage; use notes"
  },
  {
    "context": "system",
    "pattern": "Grading\\s+&\\s+Drainage",
    "value": "SiteDrainage"
  },
  {
    "context": "system",
    "pattern": "Heat",
    "value": "HVAC"
  },
  {
    "context": "system",
    "pattern": "Cooling",
    "value": "HVAC"
  },
  {
    "context": "system",
    "pattern": "Electrical\\s+Service",
    "value": "Electrical"
  },
  {
    "context": "system",
    "pattern": "Structure",
    "value": "Structure"
  },
  {
    "context": "system",
    "pattern": "Foundation",
    "value": "Foundation"
  },
  {
    "context": "rating",
    "pattern": "Unsat",
    "value": "Repair"
  },
  {
    "context": "rating",
    "pattern": "Deficient",
    "value": "Repair"
  },
  {
    "context": "rating",
    "pattern": "Major\\s+Concern",
    "value": "Repair",
    "note": "Often P1 depending on keywords"
  },
  {
    "context": "rating",
    "pattern": "Safety\\s+Hazard",
    "value": "Safety"
  },
  {
    "context": "rating",
    "pattern": "Not\\s+Inspected",
    "value": "NotAccessible"
  },
  {
    "context": "rating",
    "pattern": "Limited",
    "value": "NotAccessible"
  },
  {
    "context": "trade",
    "pattern": "Qualified\\s+electrician",
    "value": "electrician_licensed"
  },
  {
    "context": "trade",
    "pattern": "Licensed\\s+plumber",
    "value": "plumber_licensed"
  },
  {
    "context": "trade",
    "pattern": "HVAC\\s+contractor",
    "value": "hvac"
  },
  {
    "context": "trade",
    "pattern": "Roofing\\s+contractor",
    "value": "roofer"
  },
  {
    "context": "access",
    "pattern": "Not\\s+visible",
    "value": "NotAccessible"
  },
  {
    "context": "access",
    "pattern": "Obstructed",
    "value": "NotAccessible"
  },
  {
    "context": "access",
    "pattern": "Unable\\s+to\\s+evaluate",
    "value": "NotAccessible"
  }
];
