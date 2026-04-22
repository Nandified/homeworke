# Homeworke 3.0 — Negotiation Packet ReportModel Contract (v0.1)

**Goal:** A deterministic, renderer-ready JSON payload ("ReportModel") produced from `ScopeBundle` + pricing output + user selection.

- **Input:** `ScopeBundle` + pricing results + selection state
- **Output:** `ReportModel` JSON (no LLM required)
- **Consumer:** PDF/HTML renderer (server-side or client-side)

---

## 1) JSON Schema (for CI validation)

- `reportmodel.v0.1.schema.json`

## 2) Validator script + sample payload

- Sample payload: `scripts/reportmodel.sample.json`
- Validator: `scripts/validate_reportmodel.mjs`
- Run locally / in CI:
  - `npm run validate:reportmodel`
  - Validate a specific file: `node scripts/validate_reportmodel.mjs path/to/reportmodel.json`

## 3) ReportModel JSON (shape)

```json
{
  "report_version": "reportmodel.v0.1",
  "report_id": "rep_...",
  "created_at": "2026-03-07T00:00:00Z",

  "mode": "full|selected",

  "branding": {
    "title": "Homeworke Negotiation Packet",
    "subtitle": "Instant Estimate (Informational)",
    "logo_uri": null,
    "prepared_for": {"name": null, "role": "buyer|seller|agent|unknown", "email": null, "phone": null},
    "prepared_by": {"name": null, "company": null, "email": null, "phone": null},
    "contact": {"email": null, "phone": null, "website": null}
  },

  "property": {
    "address_line1": null,
    "address_line2": null,
    "city": null,
    "state": null,
    "postal_code": null,
    "property_type": null,
    "year_built": null,
    "sqft": null,
    "notes": null
  },

  "disclaimers": {
    "primary": "This estimate is for informational purposes only and is not a final bid. Pricing and scope are subject to change after field verification.",
    "secondary": []
  },

  "how_to_use": [
    "Review items by category",
    "Use selected items for negotiation (repairs or credit)",
    "Treat allowances/needs-more-info items as variable pending verification"
  ],

  "summary": {
    "counts": {
      "items_total": 0,
      "items_selected": 0,
      "items_need_more_info": 0
    },
    "totals": {
      "currency": "USD",
      "selected": {"low": null, "high": null, "exact": null},
      "all": {"low": null, "high": null, "exact": null}
    },
    "category_totals": [
      {
        "category": "electrical",
        "label": "Electrical",
        "selected": {"low": null, "high": null, "exact": null},
        "all": {"low": null, "high": null, "exact": null}
      }
    ],
    "legend": [
      {"badge": "ALLOWANCE", "meaning": "Quantity/specs unknown; range shown"},
      {"badge": "NEEDS MORE INFO", "meaning": "Requires follow-up before firm scope"}
    ]
  },

  "sections": [
    {
      "kind": "category",
      "category": "electrical",
      "label": "Electrical",
      "subtotal": {"currency": "USD", "selected": {"low": null, "high": null, "exact": null}},
      "items": [
        {
          "id": "li_1",
          "title": "Repair electrical wiring",
          "category": "electrical",
          "trade": "electrician",

          "selection": {"selected": true, "selectable": true},

          "quantity": {"display": "Qty: 1", "value": 1, "unit": "ea", "known": true},

          "pricing": {
            "currency": "USD",
            "kind": "exact|range|allowance",
            "exact": 200.0,
            "low": null,
            "high": null,
            "explain": null
          },

          "notes": {
            "inspection_notes": ["..."],
            "assumptions": ["..."],
            "exclusions": ["..."]
          },

          "evidence": [
            {
              "kind": "pdf_quote|pdf_page|photo|video_frame|note",
              "label": "Inspection report",
              "source_filename": "report.pdf",
              "page": 12,
              "quote": "...",
              "asset_uri": null,
              "asset_bbox": null,
              "timecode": null,

              "asset_mime": null,
              "asset_bytes": null,
              "asset_sha256": null,
              "vision": {
                "model": null,
                "summary": null,
                "ocr_text": null
              }
            }
          ],

          "confidence": {
            "overall": 0.0,
            "badges": ["ALLOWANCE"],
            "missing_fields": ["quantity"],
            "needs_clarification": true
          },

          "followups": [
            {
              "question": "How many outlets need GFCI protection?",
              "answer_type": "number|single_choice|multi_choice|photo|video|text",
              "options": null,
              "priority": "high|medium|low"
            }
          ]
        }
      ]
    },

    {
      "kind": "need_more_info",
      "label": "Need more information",
      "items": [
        {
          "id": "li_99",
          "title": "Evaluate moisture in crawlspace",
          "what_is_missing": ["scope", "root_cause"],
          "followups": ["Provide photos of affected area", "Any active leaks observed?"],
          "typical_range": {"currency": "USD", "low": 250.0, "high": 2500.0},
          "disclaimer": "Subject to change pending field verification."
        }
      ]
    },

    {
      "kind": "negotiation_options",
      "label": "Negotiation options",
      "options": [
        {"name": "Request seller repairs", "items": ["li_1"], "notes": "Prioritize safety/functional items."},
        {"name": "Request seller credit", "amount": {"currency": "USD", "low": null, "high": null, "exact": null}, "notes": "Based on selected totals."}
      ]
    },

    {
      "kind": "trust_footer",
      "label": "How these numbers are produced",
      "bullets": [
        "Inspection findings are extracted with citations",
        "Items map to a standardized catalog",
        "Pricing uses deterministic rules (no invented prices)"
      ]
    }
  ],

  "audit": {
    "scopebundle_id": "uuid",
    "selected_line_item_ids": ["li_1"],
    "generated_by": "server",
    "pricing_version": "pricing.v0.1"
  }
}
```

---

## 2) Deterministic mapping rules (ScopeBundle → ReportModel)

- `report_id` = new id; `audit.scopebundle_id` references the source.
- `mode`:
  - `selected`: include only `selected_line_item_ids` in category sections.
  - `full`: include all printable line items.
- Category ordering: fixed (Exterior → Roof → Attic → HVAC → Plumbing → Electrical → Windows/Doors → Foundation/Crawlspace → General).
- `pricing.kind`:
  - `exact` when price is a single value and confidence is high.
  - `range` when uncertainty is meaningful.
  - `allowance` when quantity/specs missing (must show badges).
- `evidence[]` must be present for every printed line item.

---

## 3) Persistence

Persist alongside the estimate:
- `selected_line_item_ids` (report-builder state)
- `reportmodel_version`
- raw `ReportModel` JSON (for exact re-rendering)

---

## 4) Why this exists (so we don’t forget later)

This contract was created **2026-03-07** after reviewing BOSSCAT’s Full vs Selected PDF behavior. The key lesson: selection is a **Negotiation Packet report-builder**, not checkout.
