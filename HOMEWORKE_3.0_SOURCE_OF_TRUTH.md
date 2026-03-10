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
