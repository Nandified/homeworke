# Homeworke 3.0 — Claude Context Pack (CURATED)
Generated: 2026-03-11T16:03:06.388Z

This pack is intentionally curated to fit model context limits.

---

## HOMEWORKE_3.0_SOURCE_OF_TRUTH.md
```markdown
# ﻿Homeworke 3.0 — Source of Truth (v1)
Owner: Frank Rocha Jr.
Last updated: 2026-03-09


## Purpose
This document is the single source of truth for what Homeworke is today (2.0), who we’re competing against, what Homeworke 3.0 must become, and the full feature breakdown required to ship it.


## Design / product principles (moodboard-derived)
- Brand palette: Primary red #E53935; whites + calm neutrals; dark ink #111827; muted #6B7280; lines #E5E7EB; soft surface #F8FAFC.
- Visual system: premium/concierge feel; rounded cards (12–20px); soft shadow; generous whitespace.
- Conversion rule: every page has one primary action.
- Trust always visible: verification, reviews, “what happens next”, and evidence/audit language within 1–2 scrolls.
- Progressive disclosure: let users go deep into a flow before hard auth; collect data only when needed.
- Partner attribution is the moat: if a partner is attached (agent/lender/etc.), their presence is subtle but persistent (and permissioned).


## SECTION 1 — What Homeworke.com is currently (Homeworke 2.0)
Homeworke today is a three-sided home services platform connecting Homeowners, Service Providers (contractors), and Real Estate Pros. It positions itself as an all-in-one way to handle everything from small repairs to renovations, with a support layer (Home Guide + Project Manager) to keep work coordinated and reduce homeowner stress. For real estate pros, the core promise is staying relevant after closing by helping clients solve home problems (repairs/upgrades/maintenance) while keeping the pro “in the loop” (when the homeowner allows sharing). The current production experience is built in Bubble and organized into separate role portals with dashboards and workflows per role.


2.0 Role portals (observed)
Homeowner portal navigation:
- Dashboard, Messages, My Properties, Pro Team, Support, My Account
Homeowner dashboard core CTAs:
- Submit Work Order (property visit required)
- Request Express Estimate (approx $50; no property visit required)
- Chat with your Pro Team
Other homeowner modules:
- Active Services list; Loan Calculator widget


Real Estate Pro portal navigation:
- Dashboard, Estimates, My Clients, Properties, Messages, Support, My Account
Pro dashboard:
- “Active Projects Shared With You” list with status stepper
Pro workflows:
- Invite Client (Connected / Invited / Pending)
- Track project timeline + review estimates


Service Provider portal navigation:
- Find Work, Messages, My Qtrs, My Bid(s), Support, My Account
Provider workflow:
- Availability toggle; browse opportunities; create and submit an estimate with line items


Home Guide (Ops) portal navigation:
- Dashboard, My Projects, Estimates, Messages, Service Providers, Customers, Real Estate Pros, Help Desk, Support, My Account
Home Guide dashboard:
- KPI tiles + Active Projects list
Home Guide workflows:
- Work order triage; select estimate on behalf of client; provider onboarding/verification (docs/W9/bank)


## SECTION 2 — Competitors (and what we’re impressed with)
Direct competitor (agent-first, closest analog):
1) BOSSCAT Home Services
- Positioning: “fast, accurate home-repair estimates built specifically for real estate agents.”
- Core wedge: inspection report → standardized line-item estimate → shareable artifact; then execution tooling.
- Strong patterns to copy:
  - Upload gating: clear “upload inspection PDF” step with SLA options
  - Estimate UI: item templates by category; quantity controls; add/remove (selection acts as report builder)
  - Uncertainty lane: dedicated “Need More Information / Evaluate” bucket with disclaimers and ranges
  - Share model: contacts/roles with portal-based permissioning
  - Jobs list status buckets: Upcoming / In Progress / Attention / Completed


Best-in-class marketplace/funnel references:
2) Thumbtack
- Best elements: minimal hero; progressive stepper; fast-to-hire; clean trust line.


3) Angi
- Best elements: trust + breadth; category nav rows; editorial “cost guide” modules; conversion-friendly search.


AI estimating reference:
4) Handoff
- Best elements: “AI estimates from photos/scope” UX; confidence/range language; automation + document generation.


## SECTION 3 — Goal for Homeworke 3.0
North star
Homeworke 3.0 is an Agent Transaction Operations platform (agent-first) that also supports homeowners and providers. It must beat BOSSCAT in speed, artifact quality, and closing-safe coordination while borrowing Thumbtack/Angi conversion patterns for frictionless intake.


Primary flow (post-inspection negotiation)
1) Agent (or homeowner) creates a repair scope: upload inspection PDF + optional photos/video
2) System extracts findings → proposes normalized line items + categories
3) Pricing engine produces ranges with explicit assumptions and evidence citations (no false precision)
4) Generate a Negotiation Packet (shareable, branded, lender/seller/buyer-friendly)
5) Convert selection into execution: schedule visits, work orders, provider matching, proof, invoices
6) Keep close-safe tracking: deadlines, dependencies, and an audit trail


Secondary flow (open marketplace)
- Homeowner without a partner can browse and request service (Angi/Thumbtack-style), and only at confirmation do we collect email/phone and create the account (magic link).


Differentiator / moat
Relationship Manager layer:
- Partner gets credit/attribution for originating the relationship.
- Partner is kept top-of-mind with homeowner via minimal tasteful presence (permissioned).
- Partner notifications on key milestones when allowed.


## SECTION 4 — Feature breakdown (Homeworke 3.0 requirements)
This section is derived from:
- Homeworke 3.0 ship checklist + brain dump
- Bubble 2.0 audit notes (role portals)
- Competitor teardown


4.1 Foundation (platform plumbing)
Core objects + relationships:
- Users (HO/PRO/SP/HG/PM/ADM), Offices/Teams, Properties, Work Orders, Appointments/Visits, Estimates/Bids, Milestones, Draws, Payments, Messages/Threads, Notifications, Attribution Events, Audit Log
RBAC:
- Strict role-based access and data sharing rules (HO/PRO/SP/HG/PM/ADM; office admin)
Progressive data capture:
- Reach scheduling before hard auth; then complete profile
Audit log:
- All work-order edits must be timestamped and attributed
Routing rules engine:
- Round-robin + specialty tags for HG/PM assignment
SLA + breach detection:
- Ops alerts and “attention” statuses


4.2 Homeowner (HO) experience
Auth & onboarding:
- Social login (Google/Apple/Facebook; optional Microsoft)
- Passwordless magic link (critical for open marketplace)
- Communication preferences (email/SMS/in-app) + TCPA consent
Privacy + partner sharing:
- Global sharing toggle + per-request override
- Clear UX explaining value of sharing (agent/lender/insurance benefits)
Marketplace + intake:
- Homepage request service box + AI service picker (free text → category suggestions)
- Let user get deep into booking before auth wall
- Matching: curated top 3 providers + browse more
- Provider identity gating (ratings, reviews, jobs; hide full identity until later)
Work order intake:
- Simple Thumbtack-grade intake
- Attach media at intake (photos/videos)
Estimates + booking:
- Estimate/bid workflow + homeowner accepts
- Scheduling flow aligned with PM calendar
Execution + verification:
- Day-of appointment tracking: PM assigned + on the way + ETA
- Mid-job CSAT check-in + contact HG/PM
- Completion confirmation
- Review request + review submission
Property profile value-add:
- Address autocomplete; property map view
- Optional valuation + calculators


4.3 Partner / Real Estate Pro (PRO) experience
Landing + attribution:
- Pro landing page (modern Linktree)
- Partner-origin funnel: homeowner arrives via partner link; partner pre-attached as Origin Partner
- Attribution events and payout logic (completed jobs count)
CRM integrations:
- Follow Up Boss + BoldTrail (initial)
- Event-driven tasks/notes; idempotent retries
Express Estimate (negotiation):
- HO submits from Pro landing page
- Report ready → HO must create account under that PRO to view
Assisted submission:
- PRO can submit work order on behalf of client
Office dashboards:
- Office accounts + permissions; office admin can see agent production
Partner verification:
- License + ID upload; verification SOP
Sharing model:
- Share estimates/reports with roles (buyer/seller agents, TCs, attorney, inspector, insurance, other)


4.4 Service Provider / Contractor (SP) experience
Onboarding:
- Low-friction signup then gated to receive work
- Verification gating: driver’s license, credentials/licenses, insurance, W9, bank payouts
Job intake + execution:
- Uber-driver style job offers: accept/decline
- Availability toggles
- Media check-ins
Calendar/tools:
- Google calendar connect; optional Outlook
Anti-disintermediation:
- Policies + product mechanics (masked contact/in-app chat/payments/warranty benefits)


4.5 Ops workflows (Home Guide HG + Project Manager PM)
Home Guide dashboard:
- Intake triage queue + assignment tools
- Work order edit tools + audit trail
PM workflow:
- Assignment logic + routing rules
- PM calendar integration
- PM visit cadence (kickoff/mid/completion verification)
PM-assisted estimating:
- Record video + voice walkthrough; convert to structured scope + estimate draft + tasks/materials list
Collaboration:
- Permissions + link-sharing rules


4.6 Admin dashboard (ADM)
- Company-wide visibility: total users, pros/offices, contractors, revenue, ops queues


4.7 Negotiation Packet (Instant Estimate PDF)
Required artifact:
- Evidence-first, itemized estimate for negotiation; selection acts as report builder
Core rules:
- No silent guesses; unknowns become allowances
- Ranges over false precision
- Dedicated “Need More Info” lane
- One-click share + PDF download


4.8 Payments + draws
- Stripe payments
- Contractor payouts via milestone draws
- Draw release workflow (ops-controlled)


4.9 Notifications
- Baseline homeowner notifications (submitted/triaged/estimate-ready/scheduled/started/mid-job/completed/review)
- Partner notifications (permissioned, minimal)
- Ops/PM notifications (assignments, schedule changes, SLA breach, draw events)


4.10 Content Management System (CMS) for services + marketing pages
Goal:
- Admin-controlled editing of service pages, city pages, FAQs, and guides without touching code.
- Role-based permissions (Admin vs Home Guide/Editor) + audit trail.
- Support "draft → review → publish".

Minimum viable CMS scope:
- Service Categories (hierarchy)
- Services (leaf nodes)
- Marketing Pages (homepage sections, how-it-works, service landing pages)
- City/Neighborhood pages (SEO)
- Global components (FAQ blocks, testimonials, CTAs)

Permissions:
- Admin: create categories/services/pages, assign editors, publish.
- Editor/Home Guide: edit assigned pages/services, submit for review.

Implementation guidance:
- Store content in Postgres (Prisma models) as structured JSON blocks + optional markdown fields.
- Render in Next.js using a stable block renderer; keep UI components versioned.
- Keep a clear separation between "content" (DB) and "templates" (code).

AI assist (optional):
- Use Anthropic Opus (via server-side API) to generate drafts (headlines, FAQs, page copy) with human review required before publish.

## SECTION 5 — IA (Dashboards) that must exist (no randomness)
These dashboards are required and should match 2.0 reality while improving UI:
- Homeowner dashboard
- Partner / Real Estate Pro dashboard
- Service Provider dashboard
- Home Guide dashboard
- Project Manager dashboard
- Admin dashboard


Each dashboard must be:
- Action-first: top daily actions for that role
- Tied to real objects (Work Orders, Appointments, Estimates, Messages)
- Fully linked: every widget/CTA leads to a real next step


## SECTION 6 — Build phases (how we ship without chaos)
Phase A — Spec lock + IA map (truth doc approval)
- Freeze new routes
- Map every page to checklist item
- Confirm role dashboards and funnels


Phase B — Visual system + UI kit
- Implement UI kit modules from competitor checklist
- Moodboard tokens (red-led; calm whites; rounded cards)


Phase C — Core objects + RBAC
- Data model + Postgres
- Auth: social login + magic link
- Role routing and permissions


Phase D — Two funnels
- Partner-origin homeowner funnel
- Open marketplace funnel


Phase E — Agent-first wedge
- Inspection upload → extraction → line items
- Negotiation packet generation and sharing


Phase F — Execution + realtime
- Scheduling + PM on-the-way
- Live timeline powered by real event store


Phase G — Payments, draws, provider onboarding
- Stripe + payouts
- Compliance gates


APPENDIX — Source files used (this workspace)
- Homeworke_Audit_and_Rebuild_Plan.md
- homeworke-3.0-ship-checklist.md
- homeworke-3.0-brain-dump-notes.md
- Homeworke_3_Competitive_Teardown.md
- homeworke-competitors.md
- homeworke-ui-kit-checklist.md
- Homeworke_3_Negotiation_Packet_Spec.md
- Moodboard (out/homeworke/moodboard_opus.html)

```

---

## SPEC_PHASE_1_UI_KIT.md
```markdown
# Phase 1 — Design System + UI Kit (Spec)

Derived from:
- `HOMEWORKE_3.0_SOURCE_OF_TRUTH.md`
- `homeworke-ui-kit-checklist.md`
- Moodboard tokens: `#E53935` red-led, calm whites, rounded cards, soft shadows

## Goals
- Lock visual tokens (color, type, radii, shadow, spacing) as CSS variables.
- Provide a small, reusable UI component set for all future flows.
- Provide a styleguide page (`/ui`) that demonstrates components and variants.

## Non-goals
- No product funnels.
- No dashboards.
- No business logic.

## Tokens
CSS variables (v1):
- `--hw-red #E53935`
- `--hw-ink #111827`
- `--hw-muted #6B7280`
- `--hw-line #E5E7EB`
- `--hw-soft #F8FAFC`
- `--hw-shadow 0 10px 30px rgba(17,24,39,.08)`
- `--hw-radius 18px` (cards)
- `--hw-radius-sm 12px` (controls)

## Components (v1)
- `Container`
- `Card`
- `Pill` / `Badge`
- `Button` (primary, secondary, ghost, destructive)
- `Input`, `Textarea`, `Label`
- `Checkbox`
- `RadioCardGroup` (simple, for progressive disclosure screens)
- `Chip`
- `Divider`
- `EmptyState`
- `StatTile`
- `Modal` (shell)
- `Toast` (shell)

## Page
- `/ui` — internal styleguide showcasing tokens + components.

```

---

## homeworke-ui-kit-checklist.md
```markdown
# Homeworke UI Kit Checklist (Best-of Competitors)

Last updated: 2026-03-08

Purpose: a copyable set of UI/UX modules + patterns we can implement in Homeworke, pulled from BOSSCAT + Thumbtack + Angi + Handoff.

---

## 0) Global design principles (non-negotiables)
- **Conversion-first:** every page should have 1 primary action.
- **Trust always visible:** reviews/guarantees/verification within 1–2 scrolls.
- **Low cognitive load:** progressive disclosure; short steps; auto-fill where possible.
- **Partner attribution always present (Homeworke moat):** if an RE Pro/Lender is attached, show their presence + credit subtly but constantly.

---

## 1) Layout + spacing system
- Section rhythm: **Hero → Trust proof → How it works → Categories/Services → Social proof → FAQ → Final CTA**
- Container style:
  - Rounded cards (12–20px radius)
  - Soft shadows (low elevation) + plenty of whitespace
- Grid:
  - Desktop: 12-col, max width ~1200–1280px
  - Mobile: single column with generous vertical spacing

Borrow:
- BOSSCAT: airy SaaS sections + rounded cards
- Handoff: modular feature blocks
- Thumbtack: minimal hero density

---

## 2) Typography checklist
- Headline hierarchy:
  - H1: 44–56px desktop / 32–40px mobile, bold
  - H2: 28–36px
  - Body: 16–18px, high line-height
- Micro-labels:
  - Use small all-caps section labels sparingly (BOSSCAT style)
- Form typography:
  - Large input text, high contrast, clear placeholders (Thumbtack style)

---

## 3) Color + UI tokens
- Base: white/near-white surfaces
- Accent: one strong brand accent (e.g., Homeworke red) + one supporting neutral accent
- States:
  - Success/approved (green)
  - Warning (amber)
  - Error (red)
- Background sections:
  - Use soft tinted section backgrounds (Angi/Handoff) to break up long pages

---

## 4) Hero module patterns (pick 1 per page)
**Hero A — Search-first (Angi)**
- Background lifestyle image
- Large search input: “What can we help you with?” + ZIP
- Popular categories chips below

**Hero B — Single CTA (Thumbtack)**
- Plain background
- One input row (project + zip) + one CTA
- One trust line under the input

**Hero C — SaaS value prop (BOSSCAT/Handoff)**
- Left: value prop + 2 bullets + CTA
- Right: product UI mock / phone mock
- Below: metric tiles

---

## 5) Category navigation
- Category icon row (Angi): 8–12 top categories with simple icons
- “Most in-demand near you” cards (Angi): localized, scannable
- “Popular projects” tiles (Angi): editorial + conversion hybrid

Homeworke twist:
- If partner attached, include: “Recommended by {PartnerName}” badge on the category row.

---

## 6) Trust stack modules (choose 2–3 on any funnel entry)
- Metric tiles (BOSSCAT/Handoff): “100k+ homeowners served”, “2.8M estimates”, etc.
- Testimonials (BOSSCAT/Handoff): 1–3 short quotes + name/location
- Verification badges (Homeworke): insured/licensed verified, background checks (if applicable)
- Guarantees:
  - “Happiness guarantee” style language (Angi vibe)
- Content authority (Angi): cost guides, checklists, “what to expect” articles

---

## 7) Lead capture form patterns (conversion)
- **Progressive disclosure (Thumbtack):** break into steps; avoid long forms.
- Step types:
  1. Service selection
  2. Zip / location
  3. Project details (a few quick questions)
  4. Photos/docs upload (optional unless needed)
  5. Schedule preferences
  6. Contact method + consent
- UI controls:
  - Large radio cards for choices
  - One question per screen on mobile
  - Inline validation (no “submit then error wall”)

Homeworke twist:
- Partner attribution step (if not already known): “Was this recommended by an agent/lender?” (code/link).

---

## 8) Upload module (BOSSCAT-like)
- If upload is required (e.g., inspection PDF):
  - Make it explicit as the “last requirement” before matching/estimate
  - Provide a sample + supported formats
  - Show a visible file chip once attached
  - Keep primary CTA disabled until: file + consent checked

---

## 9) Consent + compliance UI
- Use a single required checkbox with short plain language
- Link to terms/privacy in a modal or new tab
- If TCPA/SMS: explicit opt-in copy near phone field

---

## 10) Confirmation + next steps screen
- Must include:
  - “What happens next” (3-step timeline)
  - ETA for first response
  - Edit request link
  - Preferred contact method confirmation
- If partner attached:
  - “Your {PartnerName} is in the loop” + lightweight attribution

---

## 11) Dashboard / relationship manager UI (Homeworke differentiator)
- Homeowner view:
  - Active requests
  - Home profile (docs, appliances, history)
  - Maintenance timeline
- Partner (RE pro/lender) view:
  - Client list + last touch
  - Moments/timeline triggers (inspection, closing, seasonal)
  - “Credit” ledger: requests originated, completed, review prompts sent
  - Share links + referral codes

---

## 12) Microcopy checklist
- Make actions concrete:
  - “Get estimate” → “Get repair estimate” / “Get matched to a pro”
- Reduce anxiety:
  - “No obligation” / “You decide who to hire”
- Partner value:
  - “Recommended by your {Agent/Lender}” (always visible but not loud)

---

## 13) Component inventory (implementation checklist)
- Buttons: primary, secondary, ghost, icon
- Inputs: text, zip, phone (with mask), search
- Choice: radio-card group, chips, segmented control
- Cards: feature card, metric card, testimonial card, service card
- Navigation: top nav + sticky CTA, breadcrumbs (optional)
- Modals: consent, terms, exit intent
- Upload: drag/drop + file chip + progress
- Empty states: no requests, no docs
- Notifications: SMS/email confirm, in-app status

---

## Notes: where each competitor contributes
- BOSSCAT: premium service + SaaS landing + upload gating + metric tiles
- Thumbtack: minimalism + single primary action + progressive form steps
- Angi: trust/breadth + category navigation + editorial cost guides
- Handoff: SaaS credibility + feature modularity + outcomes stats + pricing clarity

```

---

## DEVELOPMENT_PLAN.md
```markdown
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

```

---

## README.md
```markdown
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Spec Artifacts

Every shipped feature includes an Opus 4.6-generated artifact under `/spec`. These files are treated as canonical specs and, where appropriate, are imported at runtime.

Current artifacts:
- `spec/homepage_v1_opus.json`
- `spec/intake_stepper_opus.json`
- `spec/batch1_partner_funnel_opus.json`
- `spec/pro_landing_polish_opus.json`

## Environment Variables

- `DATABASE_URL` (required for DB-backed features like auth + CMS admin)
  - Postgres connection string (Prisma)
- `ANTHROPIC_API_KEY` (optional)
  - Only needed for features that call Anthropic; safe to omit for the CMS MVP.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

```

---

## Homeworke_3_Negotiation_Packet_Spec.md
```markdown
# Homeworke 3.0 — Negotiation Packet (Instant Estimate PDF) Spec (v0.1)

**Purpose:** A shareable, lender/seller/buyer-friendly PDF artifact that turns inspection findings into a **credible, itemized estimate** for negotiation.

**Core design choice (learned from BOSSCAT):** the UI “selection/cart” is a **report-builder** that controls what prints to the PDF.

---

## 1) Inputs (from `ScopeBundle`)

Minimum required:
- `context.market` (city/state/zip)
- `context.property` (property_type; optional sqft/year_built)
- `sources[]` (at least one artifact)
- `findings[]` with evidence/citations
- `line_items[]` with:
  - `catalog.category|trade|service|code`
  - `scope.summary`
  - `scope.quantity` (may be unknown → allowance)
  - `linked_findings[]`
  - `pricing_intent.pathway` + confidence/missing_fields

Optional (improves quality):
- photos/frames referenced by `evidence.photo_ref|frame_ref`
- `followups[]` per item (for “Need More Info” lane)

---

## 2) Output variants

### A) Full Report
- Includes **all printable line items**, plus “Need More Info” items/allowances.

### B) Selected Report (Negotiation Packet)
- Includes **only selected line items**.
- Still includes summary counts + disclaimers.

Selection rules:
- `printable = pricing_intent.instant_ok == true` OR (`pathway == express_estimate` and not excluded)
- `selected = user_selected_ids` (explicit selection list)

---

## 3) PDF structure (section-by-section)

### 3.1 Cover page
Fields:
- Title: “Negotiation Packet” (and optionally “Instant Estimate” subtitle)
- Estimate/Packet #: `bundle_id` (or a human-friendly short id)
- Created date: `created_at`
- Prepared for (optional): requester name / agent name
- Property address (if available in context)
- Primary disclaimer (required):
  - “Informational estimate; not a final bid; subject to change after field verification.”
- Contact block (Homeworke contact or brokerage/team contact)
- “How to use this packet” steps (mirrors BOSSCAT’s clarity):
  1) Review by category
  2) Select items for negotiation
  3) Use totals for credits/requests

### 3.2 Summary page (“At a glance”)
Fields:
- Counts:
  - `selected_count` / `total_printable_count`
  - `need_more_info_count` (items with `needs_clarification == true` or missing required fields)
- Totals:
  - `selected_total_low` / `selected_total_high` (range) OR single total if deterministic
  - Optional: category subtotals
- Legend for confidence/allowances:
  - “Allowance” badge when quantities/specs unknown
  - “Needs more info” badge when followups exist

### 3.3 Category sections (repeat)
For each `catalog.category` (or user-facing buckets):
- Category header + subtotal (selected and/or full)
- Line items list (see 3.4)

### 3.4 Line item template
Per `line_item`:
- Service title (human label): `catalog.service`
- Qty: `scope.quantity` (if unknown: show “Allowance”)
- Price:
  - EE: show **range** (low/high) if uncertainty is present; otherwise single
  - Display assumptions included (from `scope.assumptions`)
- Notes:
  - Use inspection narrative from linked findings (shortened), with citations
- Evidence block:
  - “Source:” (PDF page + quote) and/or photo thumbnails
- Disclaimers (conditional):
  - If `needs_clarification`: show “Subject to change pending: …missing_fields…”

### 3.5 “Need More Info / Evaluate” section (lane)
Purpose: keep uncertainty explicit without polluting hard numbers.

Includes items where:
- `pricing_intent.instant_ok == false` OR `confidence.needs_clarification == true`

For each:
- Item label
- What’s missing + top 1–3 followup questions
- If pricing is possible: show a **typical range** + explanation (never a fake precise number)

### 3.6 Negotiation summary (agent-first) — Homeworke advantage
Add a 1-page “Negotiation Options” summary:
- Option A: Request seller repairs (list top items)
- Option B: Request seller credit (based on selected total)
- Option C: Split items (safety vs cosmetic)

### 3.7 Footer / trust section
- “How numbers are produced” (brief): extracted findings → standardized catalog → pricing rules
- Legal disclaimer

---

## 4) Rendering rules (non-negotiables)

- **Evidence-first:** every printed line item must show at least one citation.
- **No silent guesses:** unknown qty/specs become “Allowance” with explicit assumption.
- **Ranges over false precision:** if uncertainty is meaningful, print low/high.
- **Consistent buckets:** category names must be stable (supports comparison and scanning).
- **One-click share:** generate a share link + PDF download.

---

## 5) Renderer contract (ReportModel)

We will generate a deterministic, renderer-ready JSON payload for the PDF.

Contract files:
- `Homeworke_3_ReportModel_Contract.md`
- `reportmodel.v0.1.schema.json` (JSON Schema for CI validation)

This is the handoff between:
- ScopeBundle + pricing + selection state → **ReportModel JSON** → PDF/HTML renderer

## 6) Schema additions (recommended)

To support clean packet generation, add to `ScopeBundle`:

```json
{
  "report": {
    "selected_line_item_ids": ["li_1"],
    "mode": "full|selected",
    "branding": {"prepared_for": "", "prepared_by": "", "logo_uri": ""},
    "totals": {
      "selected": {"low": null, "high": null, "currency": "USD"},
      "by_category": []
    }
  }
}
```

(We can compute totals server-side; this is mostly to persist user selection + brand fields.)

```

---

## Homeworke_3_ScopeJSON_Schema.md
```markdown
# Homeworke 3.0 — Unified Scope JSON Schema (Inspection PDF • Photos • Video)

**Goal:** One canonical, validated JSON object that can be produced from *any* input type (inspection reports in many formats, photos, video) and safely downstreamed into:
- Express Estimate (EE) pricing pipeline (instant, informational)
- Site Visit scheduling + final bid pipeline (high intent)

**Design principles (anti-slop):**
1. **Separation of concerns:**
   - LLM/vision extracts observations + structured scope candidates.
   - Deterministic code maps to catalog + prices; LLM does not invent prices.
2. **Evidence-first:** every extracted item must carry citations (page+quote for PDFs; frame/time for video; photo ref).
3. **Confidence & uncertainty are first-class:** every item must carry confidence + missing fields + suggested follow-ups.
4. **Safe defaults:** unknown quantities/specs become explicit allowances, not silent guesses.
5. **Future-proof:** supports multi-city pricing via locality modifiers; supports new input modalities without breaking downstream.

---

## 0) Entities overview

### Canonical output
- `ScopeBundle` (the object we validate and store)

### Internal supporting concepts
- `SourceArtifact` (PDF/photo/video info)
- `Finding` (raw extracted issues/observations)
- `LineItemCandidate` (normalized scope candidate, not yet priced)
- `ClarifyingQuestion` (what we need to tighten)
- `Decision` (EE vs Visit recommendation)

---

## 1) ScopeBundle schema (v0.1)

```json
{
  "schema_version": "scopebundle.v0.1",
  "bundle_id": "uuid",
  "created_at": "2026-03-07T00:00:00Z",

  "context": {
    "market": {
      "country": "US",
      "city": "Chicago",
      "state": "IL",
      "postal_code": "606xx",
      "lat": null,
      "lng": null
    },
    "property": {
      "property_type": "single_family|condo|townhome|multi_family|other",
      "year_built": null,
      "sqft": null,
      "stories": null,
      "basement": "none|finished|unfinished|partial|unknown",
      "occupancy": "owner|tenant|vacant|unknown"
    },
    "transaction": {
      "persona": "agent_first",
      "deal_stage": "pre_listing|post_inspection|pre_close|post_close|unknown",
      "target_close_date": null
    }
  },

  "sources": [
    {
      "source_id": "src_1",
      "type": "inspection_pdf|photo|video|notes",
      "uri": "(internal blob/url)",
      "filename": "string",
      "captured_at": null,
      "metadata": {
        "inspection_company": null,
        "report_date": null,
        "frame_rate": null,
        "duration_seconds": null
      },
      "processing": {
        "text_extracted": true,
        "ocr_used": false,
        "frames_extracted": false,
        "frame_strategy": null
      }
    }
  ],

  "findings": [
    {
      "finding_id": "f_1",
      "source_id": "src_1",
      "modality": "pdf_text|pdf_image|photo|video_frame|notes",
      "title": "string",
      "description": "string",

      "trade_suspects": ["plumbing", "roofing"],
      "severity": "safety|functional|maintenance|cosmetic|unknown",
      "urgency": "now|soon|eventually|unknown",

      "location_in_home": {
        "area": "kitchen|bathroom|attic|roof|exterior|foundation|garage|other|unknown",
        "free_text": "string"
      },

      "evidence": {
        "kind": "pdf_quote|pdf_page|photo|video_frame|note",
        "page": 12,
        "quote": "string",
        "photo_ref": "src_2#img3",
        "video_ref": "src_3#t=00:01:32",
        "frame_ref": "src_3#frame=128"
      },

      "extraction": {
        "model": "gpt-5.2",
        "confidence": 0.0,
        "rationale": "short, factual explanation of why this was extracted"
      }
    }
  ],

  "line_items": [
    {
      "line_item_id": "li_1",

      "catalog": {
        "category": "electrical|plumbing|hvac|roofing|general_construction|foundation|painting|flooring|windows_doors|landscaping|other",
        "trade": "electrician",
        "service": "GFCI outlet install",
        "code": "ELECTRICAL_GFCI_ADD",
        "version": "catalog.v0.1"
      },

      "scope": {
        "summary": "Install/replace GFCI outlet at kitchen counter per inspection finding.",
        "details": ["Verify circuit", "Replace receptacle", "Test"],
        "quantity": {"value": 1, "unit": "ea", "known": true},
        "specs": {
          "material_grade": "standard|premium|unknown",
          "finish": "n/a",
          "brand": null
        },
        "assumptions": ["Existing box and wiring are serviceable"],
        "exclusions": ["Panel upgrades not included"],
        "dependencies": []
      },

      "confidence": {
        "overall": 0.0,
        "drivers": ["clear_quote", "missing_qty"],
        "missing_fields": ["quantity"],
        "needs_clarification": true
      },

      "linked_findings": ["f_1"],

      "pricing_intent": {
        "pathway": "express_estimate|site_visit",
        "instant_ok": true,
        "requires_human_review": false,
        "reason_codes": []
      },

      "followups": [
        {
          "question_id": "q_1",
          "question": "How many outlets need GFCI protection?",
          "answer_type": "number|single_choice|multi_choice|photo|video|text",
          "options": null,
          "priority": "high|medium|low"
        }
      ]
    }
  ],

  "recommendation": {
    "best_next_step": "express_estimate|schedule_site_visit|concierge_validation",
    "why": ["low_confidence_on_roof_scope", "customer_intent_high"],
    "overall_confidence": 0.0
  },

  "audit": {
    "created_by": "system",
    "pipeline": {
      "pdf_parser": "",
      "ocr_engine": "",
      "vision_engine": "",
      "llm": "gpt-5.2"
    }
  }
}
```

---

## 2) Downstream artifact: Negotiation Packet (Instant Estimate PDF)

We need a first-class PDF artifact similar to BOSSCAT’s “selected items” report-builder flow.

Spec files:
- `Homeworke_3_Negotiation_Packet_Spec.md`
- `Homeworke_3_ReportModel_Contract.md` (renderer-ready JSON contract)

Key requirements:
- Evidence-first rendering (page/quote + photos/frames)
- Explicit uncertainty lane (“Need more info / Evaluate”)
- Selection persists as a report-builder state (not checkout)

---

## 3) Validation rules (must enforce in code)

### Hard rules
- `schema_version` required.
- Every `finding` must have:
  - `source_id`
  - `evidence.kind`
  - at least one of: `quote`, `page`, `photo_ref`, `video_ref`, `frame_ref`
  - `extraction.confidence` (0–1)
- Every `line_item` must:
  - link to `linked_findings[]`
  - declare `catalog.code`
  - declare `scope.quantity.known` and if false, must add an allowance note in `scope.assumptions`.

### Anti-hallucination policy
- If a line item cannot be supported by evidence, it must not be created.
- If the model is unsure, it must emit a `followups[]` question rather than guess.

---

## 3) Express Estimate (EE) downstream contract (what pricing engine expects)

For EE, pricing engine should receive:
- `market` (city/zip)
- `property` basics
- `line_items[].catalog.code`
- `quantity` (or explicit unknown)
- `assumptions` and `risk flags`

Pricing engine outputs:
- range (low/high)
- allowances
- confidence
- “upgrade to concierge validation” prompts

---

## 4) Site visit downstream contract

For site visits, the same ScopeBundle supports:
- scheduling trigger when `recommendation.best_next_step = schedule_site_visit`
- on-site capture adds new `sources` (photos/video/notes)
- re-run extraction to reduce uncertainty and convert to final bid scope

---

## 5) Next additions (v0.2)
- Add `measurement` objects (linear feet, sq ft) with provenance
- Add `risk` taxonomy (structural, electrical service, active leak, mold, etc.)
- Add `intent` signal (EE informational vs “ready to hire”) from user behavior
- Add `provider_feedback` object (accept/decline/counter) to power calibration


```

---

## Homeworke_3_ReportModel_Contract.md
```markdown
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
              "timecode": null
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

```

---

## spec/batch1_partner_funnel_opus.json
```json
{
  "partnerLinkRoute": "/p/[code]",
  "partnerContextStorageKey": "hw3_partner_context_v1",
  "partnerContextShape": {
    "partnerId": "Unique identifier for the partner (UUID or slug)",
    "partnerName": "Display name of the partner (e.g. 'Acme Roofing')",
    "partnerType": "Category of partner (e.g. 'contractor', 'agent', 'inspector')",
    "officeName": "Name of the partner office or branch location",
    "createdAt": "ISO 8601 timestamp of when the partner context was captured in localStorage"
  },
  "behaviors": [
    "When a homeowner navigates to /p/[code], resolve the code to a partner record and persist the full partner context object to localStorage under the key hw3_partner_context_v1. This is the Origin Partner capture step and requires no authentication.",
    "If a valid partner context already exists in localStorage and the homeowner arrives via a different /p/[code] link, overwrite the stored context with the new partner. The most recent partner link always wins.",
    "On every service request creation, read the partner context from localStorage. If present, attach the partnerId as the Origin Partner for that request. The homeowner does not need to take any action for this association to occur.",
    "Sharing with the Origin Partner defaults to ON (recommended) for every new service request. Display a clearly labeled toggle on the request detail or confirmation screen that allows the homeowner to turn sharing OFF on a per-request basis before confirming.",
    "No authentication is required at any point in the browsing or request-creation flow. Collect the homeowner email address only at the schedule confirmation step. Until that point, the funnel operates entirely against localStorage state.",
    "The partner context in localStorage has no automatic expiration in v1. It persists until the homeowner clears browser storage or a new /p/[code] link overwrites it.",
    "If the /p/[code] route is visited with an invalid or unrecognized code, do not write anything to localStorage. Display a neutral fallback experience with no error messaging -- the homeowner simply proceeds without an Origin Partner.",
    "When the homeowner toggles sharing OFF for a given request, record that preference on the request record server-side at confirmation time. The partner context remains in localStorage and will default to sharing ON again for the next request."
  ]
}
```

---

## spec/homepage_marketing_v1.json
```json
{
  "hero": {
    "headline": "Home projects, handled end-to-end.",
    "subheadline": "Request an estimate visit and we’ll send a Project Manager to assess the scope on-site. Instant estimates are available for home inspections and appraisal reports — everything else is confirmed in person.",
    "primaryCta": "Request an estimate visit",
    "secondaryCta": "Browse services",
    "disclaimer": "Estimates vary by scope, access, and materials."
  },
  "trust": {
    "title": "Built for trust (not lead spam)",
    "bullets": [
      { "icon": "shield", "title": "Vetted pros", "text": "We prioritize licensed/insured providers and quality operators." },
      { "icon": "list", "title": "Clear scope", "text": "You know what’s included before you approve work." },
      { "icon": "message-circle", "title": "One thread", "text": "Keep communication organized — fewer missed details." }
    ]
  },
  "howItWorks": {
    "title": "How it works",
    "steps": [
      { "icon": "cursor", "title": "Describe the job", "text": "Pick a service and answer a few quick questions — no long forms." },
      { "icon": "calculator", "title": "See your instant estimate", "text": "Get a fast estimate and next steps. Estimates are always free." },
      { "icon": "calendar", "title": "Schedule and get it done", "text": "Choose a time that works and we’ll coordinate with a vetted local pro." }
    ]
  },
  "services": { "title": "Popular services", "cta": "See all services" },
  "faq": {
    "title": "FAQ",
    "items": [
      { "q": "Is the instant estimate really free?", "a": "Yes — the estimate is free. Final pricing depends on the exact scope, access, and materials once confirmed." },
      { "q": "Do you serve outside Chicago?", "a": "We’re Chicago-first today. If you’re nearby, submit your request and we’ll confirm coverage." },
      { "q": "How fast can I schedule?", "a": "It depends on the service and urgency. We’ll route you to the right pro and aim for the fastest available slots." }
    ]
  }
}

```

---

## spec/homepage_v1_opus.json
```json
{
  "hero": {
    "headline": "Home repairs, done right. Every time.",
    "subheadline": "Tell us what is going on with your home. Our matching engine connects you with vetted, top-rated professionals in your area — fast.",
    "chatLabel": "Describe your issue",
    "chatPlaceholder": "e.g. My kitchen faucet is leaking under the sink...",
    "chatHelper": "Type naturally. Homeworke reads your issue and recommends the right service and provider — no browsing, no guesswork.",
    "primaryCta": "Find My Pro",
    "secondaryCta": "Or choose a service below"
  },
  "quickSelect": {
    "label": "Know what you need? Pick a service.",
    "options": [
      "Plumbing",
      "Electrical",
      "HVAC",
      "Roofing",
      "Painting",
      "Handyman",
      "Appliance Repair",
      "Flooring",
      "Landscaping",
      "Pest Control",
      "Cleaning",
      "General Contracting"
    ]
  },
  "sellingPoints": [
    {
      "title": "Vetted Professionals Only",
      "text": "Every provider on Homeworke is licensed, insured, and background-checked. We verify credentials so you never have to."
    },
    {
      "title": "Matched, Not Listed",
      "text": "Unlike directories that hand you a list, our engine reads your issue and matches you to the right professional based on skill, availability, and proximity."
    },
    {
      "title": "Transparent Pricing",
      "text": "See estimated cost ranges before you commit. No hidden fees, no surprise invoices. You approve the scope and price upfront."
    },
    {
      "title": "Schedule on Your Terms",
      "text": "Book same-day or plan ahead. Pick the window that works for your life, confirm in two taps, and get a real-time ETA on service day."
    },
    {
      "title": "The Relationship Engine",
      "text": "Homeworke remembers your home, your preferences, and your trusted pros. Over time, your network gets smarter — and your experience gets faster."
    },
    {
      "title": "Built for Providers, Too",
      "text": "We invest in the people who do the work. Our partner-friendly platform gives professionals better leads, fair pay, and tools to grow — which means better service for you."
    },
    {
      "title": "Your Home Profile",
      "text": "Create a living record of your property — past jobs, upcoming maintenance, preferred providers. One place to manage everything about your home."
    },
    {
      "title": "Guaranteed Satisfaction",
      "text": "If the work does not meet the agreed scope, we step in. Our resolution team mediates and, when warranted, covers the cost to make it right."
    }
  ],
  "trust": {
    "tiles": [
      {
        "metric": "12,000+",
        "label": "Vetted Professionals"
      },
      {
        "metric": "4.8 / 5",
        "label": "Average Provider Rating"
      },
      {
        "metric": "98%",
        "label": "Jobs Completed On Time"
      },
      {
        "metric": "150+",
        "label": "Service Categories"
      },
      {
        "metric": "1M+",
        "label": "Homeowners Served"
      },
      {
        "metric": "100%",
        "label": "Satisfaction-Backed"
      }
    ],
    "disclaimer": "Metrics reflect platform-wide data across all active Homeworke markets as of the most recent reporting period. Individual results may vary by region and provider availability."
  },
  "howItWorks": [
    {
      "step": "1",
      "title": "Describe or Select",
      "text": "Type a description of your issue into the assistant, or pick a service from the quick-select grid. Either way, you are moving toward the right pro in seconds."
    },
    {
      "step": "2",
      "title": "Review Your Matches",
      "text": "Homeworke surfaces top-rated, available professionals matched to your specific need, location, and schedule. Compare profiles, ratings, and estimated pricing side by side."
    },
    {
      "step": "3",
      "title": "Schedule and Confirm",
      "text": "Choose your provider, pick a time window, and confirm the booking. You will receive a summary with scope, pricing, and your provider's credentials."
    },
    {
      "step": "4",
      "title": "Get the Work Done",
      "text": "Your professional arrives on time, completes the job to the agreed scope, and logs the work in your home profile for future reference."
    },
    {
      "step": "5",
      "title": "Rate, Save, Repeat",
      "text": "Leave a review, save your provider to your trusted network, and let Homeworke handle the rest — from follow-ups to future maintenance reminders."
    }
  ]
}
```

---

## spec/intake_stepper_opus.json
```json
{
  "route": "/marketplace/intake",
  "steps": [
    {
      "key": "select_service",
      "title": "What do you need help with?",
      "description": "Select the service category that best describes your project. We will match you with vetted, qualified professionals in your area.",
      "fields": [
        "service_category",
        "service_subcategory"
      ]
    },
    {
      "key": "service_details",
      "title": "Tell us a bit more",
      "description": "A few details go a long way. The more context you provide, the more accurate your match and estimate will be.",
      "fields": [
        "issue_description",
        "urgency_level",
        "photos_upload"
      ]
    },
    {
      "key": "property_details",
      "title": "Where is the work needed?",
      "description": "Confirm the property details so we can connect you with professionals who service your area and property type.",
      "fields": [
        "property_address",
        "property_type",
        "access_instructions"
      ]
    },
    {
      "key": "schedule_visit",
      "title": "When works best for you?",
      "description": "Choose a preferred date and time window. Your matched professional will confirm availability and reach out to finalize the visit.",
      "fields": [
        "preferred_date",
        "preferred_time_window",
        "alternate_date",
        "contact_method"
      ]
    }
  ],
  "copy": {
    "primaryCta": "Submit Work Order",
    "backCta": "Go Back",
    "saveNote": "Your progress is saved automatically. You can return at any time to complete your submission."
  }
}
```

---

## spec/partners.json
```json
[
  {
    "pro_code": "frj",
    "display_name": "Fernando Rocha Jr.",
    "headshot_url": null,
    "brokerage_name": "The FRJ Group @ RE/MAX Loyalty",
    "license_number": "(placeholder)",
    "license_state": "IL",
    "phone": "(placeholder)",
    "email": "Fernando@TheFRJgroup.com",
    "website_url": "https://thefrjgroup.com",
    "bio": "I help clients buy and sell with a focus on clarity, speed, and protecting the transaction. Homeworke is how we extend that value after closing with vetted home services and clear project tracking.",
    "intro_video_url": null,
    "socials": {
      "instagram_url": "https://www.instagram.com",
      "facebook_url": "https://www.facebook.com",
      "linkedin_url": "https://www.linkedin.com"
    }
  },
  {
    "pro_code": "demo",
    "display_name": "Partner Demo",
    "headshot_url": null,
    "brokerage_name": "Demo Office",
    "license_number": "(placeholder)",
    "license_state": "IL",
    "phone": "(placeholder)",
    "email": "demo@example.com",
    "website_url": "https://homeworke.com",
    "bio": "Demo partner profile for testing and development. Replace with real partner data before launch.",
    "intro_video_url": null,
    "socials": {
      "linkedin_url": "https://www.linkedin.com",
      "instagram_url": "https://www.instagram.com"
    }
  }
]

```

---

## spec/pro_landing_polish_opus.json
```json
{
  "page": {
    "headline": "Your Trusted Real Estate Professional",
    "subheadline": "Learn more about your agent and explore how Homeworke can simplify your home journey — from search to close.",
    "primaryCta": "Get Started with Homeworke",
    "secondaryCta": "Learn More About the Process",
    "sections": [
      "Pro Profile Header — Agent name, brokerage, headshot, license info, and direct contact details (phone, email). No auto-redirect; user initiates all actions.",
      "Intro Video Placeholder — Supports a short intro video (max 30 seconds). V1 renders a styled placeholder card with a play icon; video playback to be enabled in a future release.",
      "Social Links Bar — Horizontal row of social profile links (e.g., Instagram, Facebook, LinkedIn, YouTube) pulled from the pro card. Icons only, no labels, open in new tab.",
      "About the Pro — Free-text bio section written or approved by the agent. Supports line breaks and basic formatting. No emojis permitted in content.",
      "What is Homeworke — Brief explainer section describing the Homeworke platform: what it does, how it helps buyers and sellers, and why the agent partners with it.",
      "How It Works — Step-by-step visual breakdown (3-4 steps) of the partner-origin marketplace intake flow. Clarifies that the referring pro is pre-attached as the partner throughout the process.",
      "Primary CTA Block — Prominent call-to-action driving the visitor into the partner-origin marketplace intake. The originating pro code from /p/[code] is pre-attached so attribution is automatic. No auto-redirect.",
      "Footer — Minimal footer with Homeworke branding, legal links (Terms, Privacy), and a secondary CTA to learn more or contact support."
    ]
  },
  "proCard": {
    "fields": [
      "display_name — Agent's full display name",
      "headshot_url — URL to agent's professional headshot image",
      "brokerage_name — Name of the affiliated brokerage",
      "license_number — State real estate license number",
      "license_state — State of licensure",
      "phone — Direct contact phone number",
      "email — Direct contact email address",
      "bio — Free-text agent biography (no emojis allowed)",
      "intro_video_url — Optional URL to a short intro video (max 30 seconds); nullable in v1",
      "pro_code — Unique agent code used in /p/[code] URL for partner-origin attribution",
      "cta_label — Optional custom label for the primary CTA button",
      "website_url — Optional link to the agent's personal or brokerage website"
    ],
    "socialFields": [
      "instagram_url — Link to Instagram profile",
      "facebook_url — Link to Facebook profile",
      "linkedin_url — Link to LinkedIn profile",
      "youtube_url — Link to YouTube channel",
      "tiktok_url — Link to TikTok profile",
      "twitter_url — Link to X (Twitter) profile"
    ],
    "videoRule": "Max duration 30 seconds. V1 renders a styled placeholder card with a centered play icon and optional thumbnail from intro_video_url. Actual inline playback deferred to v2. File upload and hosting handled outside the landing page spec."
  }
}
```

---

## spec/services.json
```json
{
  "services": [
    {
      "slug": "handyman",
      "name": "Handyman",
      "icon": "wrench",
      "summary": "Small fixes, installs, and punch lists — done right.",
      "examples": ["TV mounting", "Drywall patch", "Door hardware", "Shelving & assembly"],
      "notes": "Great for multi-item lists. Free estimate — pricing varies by scope."
    },
    {
      "slug": "plumbing",
      "name": "Plumbing",
      "icon": "droplet",
      "summary": "Leaks, clogs, fixtures, and installs.",
      "examples": ["Faucet replacement", "Toilet repair", "Clog removal", "Garbage disposal"],
      "notes": "Free estimate. If it’s urgent, we’ll prioritize same/next-day scheduling when available."
    },
    {
      "slug": "electrical",
      "name": "Electrical",
      "icon": "zap",
      "summary": "Safe, code-aware electrical work from vetted pros.",
      "examples": ["Outlet/switch install", "Lighting", "Ceiling fans", "Panel diagnostics"],
      "notes": "Free estimate. Final pricing depends on access, materials, and complexity."
    },
    {
      "slug": "hvac",
      "name": "HVAC",
      "icon": "fan",
      "summary": "Comfort issues, maintenance, repairs, and installs.",
      "examples": ["No heat/no cool", "Seasonal tune-up", "Thermostat install", "Airflow issues"],
      "notes": "Free estimate. We’ll ask a few quick questions to route you to the right technician."
    },
    {
      "slug": "appliance-repair",
      "name": "Appliance Repair",
      "icon": "refrigerator",
      "summary": "Get major appliances back online fast.",
      "examples": ["Washer/dryer", "Dishwasher", "Refrigerator", "Oven/range"],
      "notes": "Free estimate. Some jobs may require a diagnostic visit depending on symptoms."
    },
    {
      "slug": "cleaning",
      "name": "Cleaning",
      "icon": "sparkles",
      "summary": "Move-in/out, deep cleans, and recurring maintenance.",
      "examples": ["Deep clean", "Turnover", "Post-repair clean", "Recurring"],
      "notes": "Free estimate. We’ll tailor it to bedrooms/baths and level of detail."
    }
  ]
}

```