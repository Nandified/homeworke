# Homeworke 3.0 — Development Plan (v1)

This plan is derived directly from `HOMEWORKE_3.0_SOURCE_OF_TRUTH.md`.

## Phase 0 (this commit)
- Lock spec in repo root
- Archive v0 implementation
- Reset app surface to a minimal placeholder so we can rebuild cleanly

## Phase 1 — Design system + UI kit
Deliverables:
- Design tokens (moodboard): red-led, calm whites, rounded cards, soft shadows
- Reusable UI modules (from `homeworke-ui-kit-checklist.md`)

## Phase 2 — Core objects + RBAC + dashboards
Deliverables:
- Data model draft (Work Orders, Properties, Estimates, Appointments, etc.)
- Auth strategy + RBAC matrix (HO/PRO/SP/HG/PM/ADM)
- Dashboards for each role, matching 2.0 navigation but improved

## Phase 3 — Two funnels
Deliverables:
- Partner-origin homeowner funnel
- Open marketplace funnel

## Phase 4 — Agent-first wedge
Deliverables:
- Inspection upload → extraction → line items
- Negotiation Packet (selected-items report builder → PDF)

## Phase 5 — Execution + realtime
Deliverables:
- Scheduling + PM on-the-way
- Live timeline powered by real event store
- Notifications baseline + CRM hooks (FUB/BoldTrail)
