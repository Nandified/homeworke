# Homeworke 3.0 — Ship Checklist (extracted from Brain Dump)

Owner lanes:
- **HO** = Homeowner
- **PRO** = Partner / Real Estate Pro (and office admins)
- **SP** = Service Provider / Contractor
- **HG** = Home Guide (Ops)
- **PM** = Project Manager (field)
- **ADM** = Admin (company-wide)
- **ENG** = Engineering / Product
- **MKT** = Marketing
- **FIN** = Finance / Payments
- **LEGAL** = Compliance

Status legend: [ ] not started, [~] in progress, [x] done

---

## 0) Foundation (must-have platform plumbing)
- [ ] (ENG) Real-time presence + statuses for “app feels alive” (PM on-the-way, appointment day-of tracking)
- [ ] (ENG) Define core objects + relationships:
  - Users (HO/PRO/SP), Offices, Teams, Work Orders, Estimates, Milestones, Draws, Notifications, Attribution Events, Audit Log
- [ ] (ENG) Implement role-based access control (RBAC) for: HO / PRO / Office Admin / SP / HG / PM / ADM
- [ ] (ENG) Progressive data capture flows per role (collect only what’s needed when it’s needed)
- [ ] (ENG) Audit log (who/what/when) for all work-order edits + attribution events
- [ ] (ENG) Routing rules engine (round-robin + specialty tags) for HG and PM assignments
- [ ] (ENG) SLA framework + breach detection (for ops alerts)
- [ ] (ENG) Responsive web baseline (desktop + mobile) with native-app readiness (design tokens, API-first)

## 1) Homeowner experience (primary loop)
- [ ] (ENG) Uber/DoorDash-style day-of appointment tracking: PM assigned + “on the way” status + PM name (optional photo)
### 1.1 Signup + login (frictionless)
- [ ] (ENG) Homeowner account creation (email-first; SMS optional) with consent capture
- [ ] (ENG) Social login / easy login:
  - Sign in with Google
  - Sign in with Apple
  - Sign in with Facebook
  - (optional) Microsoft
- [ ] (ENG) Passwordless magic link (open marketplace + invite flows)
- [ ] (ENG) Communication preferences (email/SMS/in-app) + TCPA consent records
- [ ] (ENG) Partner sharing preferences:
  - Global toggle: allow partner notifications
  - Per-request override: disable sharing for sensitive jobs
- [ ] (MKT/ENG) UX/copy explaining value of sharing with partner (realtor/lender/insurance)

### 1.2 Open marketplace funnel (no partner at entry)
- [ ] (ENG/MKT) Homepage “Request service” box (Angi/Thumbtack-style)
- [ ] (ENG/MKT) Homepage **AI service picker** (ChatGPT-like free-text → service/category suggestions via bubbles; can auto-select)
- [ ] (ENG) Let user get deep into booking before hard auth wall
- [ ] (ENG) Appointment confirmation requires email/phone → silently creates account
- [ ] (ENG) Deliver confirmation via magic link; prompt progressive profile completion later
- [ ] (ENG) Matching: recommend ~3 curated Service Providers by default + allow viewing/selecting additional (Angi list)
- [ ] (ENG) Provider identity gating: show rating/reviews/# jobs; hide full company details until later; Thumbtack-like profile modal/page

### 1.3 Work order intake
- [ ] (ENG) Work order submission UX (Thumbtack/Angi-level simplicity)
- [ ] (ENG) Attach media (photos/videos) at intake
- [ ] (ENG) Confirm submission screen + status tracking
- [ ] (HG) Intake triage queue + internal notes

### 1.4 Estimates + booking
- [ ] (ENG) Estimate/bid generation workflow (HG/PM assisted)
- [ ] (ENG) Homeowner receives estimate-ready notification + can view/accept
- [ ] (ENG) Scheduling flow for in-person estimate / kickoff aligned with PM calendar
- [ ] (ENG) Job scheduled → homeowner timeline view

### 1.5 Execution + verification + reviews
- [ ] (ENG) Job started + milestone check-ins
- [ ] (ENG) Mid-job CSAT check-in + “contact HG/PM” link
- [ ] (ENG) Job completion confirmation
- [ ] (ENG) Review request flow

### 1.6 Property profile value-add
- [ ] (ENG) Google Places/Maps API for address autocomplete + standardized addresses
- [ ] (ENG) Property profile map view
- [ ] (ENG) Zillow API valuation surfaced on property profile
- [ ] (ENG/MKT) Homeowner dashboard widgets: loan calculator + Homeworke loan partner CTA

## 2) Partner / Real Estate Pro experience
- [ ] (MKT/ENG) Public landing pages for: RE Pros (with Schedule a Demo), Offices, Lenders, Inspectors, Insurance Agents
### 2.1 Pro landing page + attribution
- [ ] (ENG) Pro Landing Page (“modern Linktree”): profile, contact, CTA to place clients under team
- [ ] (ENG) Partner-origin funnel: homeowner arrives via partner link → partner is Origin Partner by default
- [ ] (ENG) Referral/attribution tracking:
  - client belongs to which PRO/team/office
  - which events count (created vs completed vs review)
  - payout only on **completed** jobs
- [ ] (ENG) Minimal/tasteful partner “plug” in homeowner comms (if allowed)

### 2.2 CRM integrations (relationship building)
- [ ] (ENG) Integrations: Follow Up Boss, BoldTrail
- [ ] (ENG) Optional next: HubSpot / Salesforce
- [ ] (ENG) Sync events back to CRM (submitted/scheduled/completed) + contact records where allowed

### 2.3 Express Estimate + assisted submission
- [ ] (ENG) Express Estimate flow:
  - HO submits from Pro landing page
  - Report ready → HO must create account under that PRO to view
- [ ] (ENG) Assisted submission: PRO can submit a work order on behalf of client

### 2.4 Office / brokerage dashboards
- [ ] (ENG) Office-level account + permissions
- [ ] (ENG) Office dashboard: agents’ production (# work orders, revenue attribution, performance)
- [ ] (ENG) If agent signs up under office, share their metrics with office admin

### 2.5 Partner verification + claim profiles (Relays data)
- [ ] (ENG) Verify agent identity + license:
  - license number input
  - ID upload
- [ ] (ENG) “Find your Pro” directory UI (search/browse) powered by Relays agent dataset
- [ ] (ENG) Claim profile flow for pros (prove identity; attach to office/team)
- [ ] (OPS) Verification SOP (what constitutes “verified”)

### 2.6 Partnership / admitted program + payouts
- [ ] (ENG/OPS) Application + approval workflow for admitted partners
- [ ] (ENG/FIN) Partner wallet/balance + referral ledger
- [ ] (ENG/FIN) Cash-out 1–2x per month + office split rules

## 3) Service Provider / Contractor experience
### 3.1 Contractor onboarding (frictionless then gated)
- [ ] (ENG) Low-friction contractor signup + browse/notifications (pre-verification)
- [ ] (ENG) Social login / easy login for contractors too
- [ ] (ENG) Gating to be assigned work:
  - driver’s license
  - licenses/credentials
  - business insurance
  - payout setup (bank)
  - W9
- [ ] (OPS) Contractor verification SOP

### 3.2 Job intake + execution
- [ ] (ENG) “Uber driver” style job offers: accept/decline based on scope + pay
- [ ] (ENG) Availability toggles
- [ ] (ENG) In-app media check-ins (photo/video)

### 3.3 Calendar + CRM/tool integrations
- [ ] (ENG) Calendar connect for Service Providers (Google; optional Outlook)
- [ ] (ENG) Contractor CRM/tools: Jobber, Pipedrive (optional ServiceTitan)
- [ ] (ENG) Notifications on new bid opportunities + schedule changes

### 3.4 Anti-disintermediation controls (spec + implementation)
- [ ] (ENG/LEGAL) Define policies + enforcement (TOS, penalties)
- [ ] (ENG) Product mechanics to reduce off-platform migration (TBD):
  - masked contact, in-app chat, payment holds, review gating, warranty/guarantee benefits

## 4) Ops (Home Guide + PM) workflows
### 4.1 Home Guide (Ops) dashboard
- [ ] (ENG) HG queue: new requests, triage, assignment, customer support threads
- [ ] (ENG) Assignment modes: manual accept OR auto-assign (round-robin/specialty)
- [ ] (ENG) Work order edit tools + required audit trail entries

### 4.2 PM workflow + calendar
- [ ] (ENG) PM assignment logic + routing rules
- [ ] (ENG) PM calendar integration (Google first; optional Outlook/iCal)
- [ ] (ENG) PM visit cadence support:
  1) kickoff verification (scope/pricing)
  2) mid-project check
  3) completion verification + confirm paid

### 4.3 PM-assisted estimating (Handoff-like) — key differentiator
- [ ] (ENG) PM “record + talk” capture (video + voice) in the field
- [ ] (ENG) Convert recording → structured scope + estimate draft + tasks/materials list
- [ ] (ENG) Evidence attachment + audit trail (“who captured what, when”)
- [ ] (ENG) Confidence/range handling + “Needs more info” lane (BOSSCAT-style)

### 4.4 Collaboration + sharing
- [ ] (ENG) Share estimates/reports with: client, opposite agent, assistants/TCs, attorney, inspector, insurance agent, other
- [ ] (ENG) Permissions + link-sharing rules

## 5) Admin / company-wide dashboard
- [ ] (ENG) Single admin dashboard:
  - total users
  - pros & offices
  - contractors
  - revenue / money made
  - ops visibility: queues, assignments, status

## 6) Home Store (flat-fee catalog)
- [ ] (ENG/PM) Define catalog SKUs (starting set) + pricing rules with contingency
- [ ] (ENG) Home Store UI/UX (BOSSCAT-like, friendlier)
- [ ] (ENG) Order flow using flat-fee jobs + exception handling for unknowns

## 7) Payments (Stripe) + draws
- [ ] (FIN/ENG) Stripe customer payments (cards/ACH as needed)
- [ ] (FIN/ENG) Contractor payouts via milestone-based draws
- [ ] (ENG) Milestone definition + evidence requirements per milestone (photo/video/inspection)
- [ ] (ENG) Draw release workflow:
  - required for ops
  - optional homeowner notifications
- [ ] (RISK) Controls to avoid large upfront % on big jobs

## 8) Notifications (baseline)
### 8.1 Homeowner notifications (email + SMS + in-app)
- [ ] Account created → email
- [ ] Work order submitted successfully → email + SMS + in-app
- [ ] Work order accepted/triaged by HG → in-app (optional email)
- [ ] Bid/estimate ready → email + SMS + in-app
- [ ] Bid accepted / job scheduled → email + SMS + in-app
- [ ] Job started → email + SMS + in-app
- [ ] Mid-job check-in (CSAT) → SMS and/or email + in-app link
- [ ] Milestone reached / draw released → in-app (optional email; ops-required)
- [ ] Job completed → email + SMS + in-app
- [ ] Review request → email + SMS + in-app

### 8.2 Partner notifications
- [ ] (ENG) If HO allows sharing, notify PRO/team on: submitted, scheduled, completed
- [ ] (ENG/MKT) Keep tone minimal/tasteful

### 8.3 Ops/PM notifications
- [ ] New work order assigned
- [ ] Estimate appointment scheduled/changed
- [ ] SLA breach alerts
- [ ] Payment/draw events

## 9) Specialized flows
- [ ] (ENG/OPS) 203k loan flow:
  - identify 203k jobs
  - route to 203k-experienced contractors
  - verification requirements + routing logic

## 10) Definition of done (ship gates)
- [ ] (ENG) Code quality: tests/CI + reliability baseline
- [ ] (PRODUCT) Funnel is frictionless (BOSSCAT-easier for simple estimates)
- [ ] (PRODUCT) Booking flow as easy as Thumbtack/Angi; fewer steps, more automation
- [ ] (MKT) Re-engagement loop implemented:
  - Homeworke drives ongoing homeowner marketing
  - light PRO plug (opt-in)
- [ ] (LEGAL) Consent + notification compliance (TCPA records)
- [ ] (OPS) SOPs written: HG triage, PM verification, contractor verification, partner verification

## 11) Stand-out vs BOSSCAT (differentiators to preserve)
- [ ] (DESIGN) Use official Homeworke logo PNGs (transparent): https://drive.google.com/drive/folders/1ssI-HOJiiIwslufB9OKPVScNY9dozxQ_?usp=share_link
- [ ] (PRODUCT) Relationship engine: partner-origin funnel + open marketplace funnel feeding one relationship graph
- [ ] (ENG) CRM-first loop: Follow Up Boss + BoldTrail integrations + milestone-to-CRM events + auto-tasks
- [ ] (ENG) Pro directory + claim profiles using Relays agent dataset
- [ ] (ENG/OPS) Office dashboards + office splits + database activation tooling
- [ ] (ENG) PM “record + talk” → estimate draft (Handoff-like) + materials/tasks
- [ ] (ENG) Evidence + audit trail for all edits/draws (closing-safe)
- [ ] (ENG) Calendar-connected execution (PM + contractor) via calendar connect
- [ ] (ENG) Contractor tool integrations (Jobber / Pipedrive) for faster bid response
- [ ] (PRODUCT) Property value hub: Zillow valuation + map + repair history timeline
- [ ] (PRODUCT/FIN) Financing primitives: loan calculator + partner application attached to projects
- [ ] (FIN/OPS) Partner program wallet + predictable payouts (cash-out 1–2x/month)
