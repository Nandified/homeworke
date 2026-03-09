# Homeworke 3.0 — Brain Dump Notes (Frank)

Date: 2026-03-08

## Primary loop (realistic)
- Ideal: Partner shares → homeowner requests service → Homeworke fulfills → partner gets credit → partner re-engages.
- Reality: partners are busy; Homeworke should run ongoing homeowner marketing + light partner “plug” so the partner stays top-of-mind passively.
- Mechanism: if homeowner allows it, partner gets notified of incoming service request and can optionally use it as a touchpoint.

## Roles & needs

### Homeowner
- Books requests + estimates to maintain home.
- If they have a partner (RE pro/lender/insurance) and **allow notifications**, their actions notify that partner/team.
- Privacy: some requests may be embarrassing (e.g., clogged toilet). Homeowner needs per-request ability to disable sharing.
- Homeworke must explain value of sharing with partners:
  - Realtor: improvement advice, resale-minded guidance (materials/colors/room changes)
  - Lender: refi/financing options to fund repairs
  - Insurance: updated quotes/coverage post-improvement

### Real Estate Pro (Partner)
- Gets notifications when clients create work orders (if allowed).
- Gets “marketed” on Homeworke’s behalf in a minimal, tasteful way (email/SMS/mail options).
- Gets a Pro Landing Page (modern Linktree) with contact info + signup link to place clients “under their team.”
- Program: Marketing Affiliation Program (application/selection) to earn ~% (e.g., 3%) of total work order.
- Express Estimate:
  - Pros can use for negotiations.
  - Homeowner can submit Express Estimate from Pro landing page.
  - When report is ready, homeowner must create an account under that Pro to view.
- Assisted submission: partner can submit work orders on behalf of less tech-savvy clients.
- Specialized flow: 203k loans (need 203k-experienced contractors).

### Service Provider / Contractor
- “Uber driver” style job intake: accept/decline based on scope + pay.
- Homeworke PM can help assign job cost; should show:
  - materials list + cost
  - room for error/contingency
  - labor earnings
- Availability toggles.
- Payments in draws as work completes.
  - Verification: via in-app photo/video check-ins and/or PM inspections (TBD).
- Key risk: contractors disintermediate/steal customers; safety measures needed.

## Admin / Ops model (Homeworke)

### Admin dashboard (company-wide)
- Single main dashboard: total users, real estate pros & offices, contractors, revenue/money made.
- Visibility into what Ops/Home Guides are doing (work queues, assignments, status).

### Home Guide (Ops)
- Oversees intake + customer support.
- Assignment:
  - Can accept work orders as they come in, OR
  - Auto-assign via round-robin / specialty tags (Home Guide specialization).
- Handles technical questions + ensures requests are answered/triaged.

### Project Manager (field execution)
- More hands-on; typically 3 visits per project:
  1) Beginning: verify work order + confirm pricing/scope
  2) Middle: check progress
  3) Completion: verify job done + ensure client bill fully paid
- Assignment:
  - Assigned per work order and/or round-robin.
  - Platform must support routing rules.
- Scheduling:
  - PM calendar must connect and match homeowner’s desired in-person estimate time.

### Home Store (flat-fee catalog)
- Certain jobs can be pre-priced / flat-fee (e.g., install water heater with specific model).
- Must include room for unknown issues/contingency.
- Target: BOSSCAT-like “store” but with more friendly UI/UX.

### Editability + audit
- Home Guides / PMs / Admin can edit a work order if homeowner forgot something.
- Every edit must be timestamped + attributed (who changed what, when) for error review.

### Office / Company dashboards (Brokerage office-level)
- Office-level accounts can view their agents’ production:
  - number of work orders
  - performance metrics / revenue attribution
- If an agent signs up under an active company/office, their record data is shared with that office admin.

### Partner verification (agents)
- Verify agents are licensed and who they say they are.
- Proposed flow:
  - enter license number
  - upload ID screenshot for identity verification

### Collaboration + sharing (like BOSSCAT)
- Platform must support sharing reports/estimates with:
  - client
  - opposite agent
  - assistants / transaction coordinators
  - attorney
  - home inspector
  - insurance agent
  - “other”

### Audit trail + attribution metrics
- Audit trail essential: who created request, who referred who, which client list it belongs to, edits + timestamps.
- Attribution events to track (and what counts for partner marketing payouts):
  - request created vs job completed vs review left
  - marketing program payout should count **completed** jobs only.

## Product requirements (additional brain dump)

### Notifications (suggested baseline)
Homeowner notifications (channel mix: email + SMS + in-app; respect preferences + TCPA consent):
- Account created → email
- Work order submitted successfully → email + SMS + in-app
- Work order accepted/triaged by Home Guide → in-app (optional email)
- Bid/estimate ready → email + SMS + in-app
- Bid accepted / job scheduled → email + SMS + in-app
- Job started → email + SMS + in-app
- Mid-job check-in (CSAT) → SMS and/or email + in-app link to contact Home Guide/PM
- Milestone reached / draw released (optional for homeowner; required for ops) → in-app (optional email)
- Job completed → email + SMS + in-app
- Review request → email + SMS + in-app

Partner notifications:
- If homeowner allows sharing, notify partner/team on new request + key milestones (submitted, scheduled, completed).
- Keep it minimal/tasteful; enough to enable optional touchpoint without adding workload.

Ops/PM notifications:
- New work order assigned
- Estimate appointment scheduled/changed
- SLA breach alerts
- Payment/draw events

### What’s broken today (high level)
- UI/UX not great; functionality issues; flow not attractive/easy.

### Definition of done (directionally)
- High-quality code.
- Funnel must be frictionless and easier than BOSSCAT for simple estimates.
- Booking flow as easy as Thumbtack/Angi; more automation, fewer steps.
- Re-engagement loop: Homeworke keeps homeowners coming back; light partner plug for top-of-mind.

### Payments & risk control (Stripe + draws)
- Customer pays via Stripe.
- Contractors are paid via draws tied to milestones (avoid large upfront % on big jobs like $30k).

### Contractor onboarding (frictionless then gated)
- Allow contractors to create a low-friction account and browse/get notified.
- To be assigned: require completion of verification + payout setup:
  - driver’s license
  - licenses/credentials
  - business insurance
  - connect payout method

### Progressive data capture (all roles)
- Make signup frictionless; collect data at the moment it’s needed.
- Partners: verification checkmark once verified.

## Open questions / risks to spec
- Attribution + notification consent:
  - Default = allow partner notification, but homeowner can opt out globally and per-request.
  - UI/UX + copy required to explain why sharing benefits homeowner.
- Contractor disintermediation prevention:
  - What policies + product mechanics prevent off-platform migration?
- 203k contractor network:
  - Verification requirements and routing logic.
- Draws + job completion verification:
  - What evidence required at each milestone?

---

## Additions / upgrades requested (2026-03-09)

### Auth & onboarding (frictionless)
- Add **social login** / easy login:
  - Google
  - Apple
  - Facebook
  - (optional) Microsoft
- Add **passwordless magic link** (especially for open-marketplace homeowners).
- Progressive profile completion: allow user to reach scheduling, then collect the rest.

### Two funnels (critical)
1) **Partner-originated homeowner funnel**
   - Homeowner arrives via partner link → partner is pre-attached as Origin Partner.
   - Sharing defaults ON (recommended) with clear per-request privacy toggle.

2) **Open marketplace funnel** (no partner at entry)
   - Homepage “Request service” box (Angi/Thumbtack-style).
   - Ask for email/phone only at the appointment confirmation step.
   - “Secretly creates account” → deliver confirmation via magic link.
   - After request, homeowner can finish profile details (preferences, additional info).

### PM-assisted estimating (Handoff-like)
- PM can record **video + voice walkthrough**, narrate scope, and the system converts to:
  - structured scope items
  - estimate draft (range + assumptions)
  - materials list + tasks
- Goal: reduce PM admin burden and speed estimate turnaround.

### Calendar integrations (bidirectional)
- PMs connect calendars (at minimum): Google Calendar; ideally also Microsoft/Outlook + Apple Calendar via CalDAV.
- Service Providers can connect calendars to:
  - set availability windows
  - block off times
  - receive job/visit invites

### CRM integrations (relationship building + ops signal)
Real Estate Pro CRMs:
- Follow Up Boss
- BoldTrail
- (plus common: Salesforce, HubSpot — optional)

Contractor CRMs / field tools:
- Jobber
- Pipedrive
- (plus common: ServiceTitan — optional)

Use cases:
- Sync clients + tags
- Log “milestone events” back to CRM
- Notifications on new bids/opportunities and schedule changes

### Agent data (Relays) → find/claim profiles
- Use existing Relays agent dataset to:
  - let homeowners “Find your Pro” (search + beautiful UI)
  - let pros **claim their profile**
  - enable “invite clients” + partner link distribution

### Mapping + address + property value
- Implement Google Places/Maps API for address autocomplete + standardized addresses.
- Property profile includes a map view.
- Keep Zillow API valuation on property profile (value-add feature).

### Homeowner financing widgets
- Keep/expand:
  - loan calculator
  - “Homeworke loan” partner application flow

### Partnership program (payouts)
- Build “Admitted Partner” program:
  - application + approval
  - tracking referrals + completed-job payouts
  - partner wallet/balance
  - cash out 1–2x per month
  - office split support (agent + office)

### UX / design / build targets
- Desktop + mobile responsive now; webapp designed as base for later native iOS/Android.
- Follow brand/moodboard:
  - Red primary (#E53935)
  - clean modern UI, high trust

### Public marketing + marketplace surfaces (requested)
- Build dedicated landing pages (sell each audience):
  - Homeowners (primary)
  - Real Estate Pros (include **Schedule a Demo**)
  - Office-level (brokerage/team leaders)
  - Lenders
  - Home Inspectors
  - Home Insurance Agents

### Homepage “AI service picker” + semi-open marketplace funnel (requested)
- Homepage includes:
  - Service category selector AND/OR
  - A ChatGPT-like free-text box (“What’s going on?”) that suggests the right service/category via bubbles and/or auto-selects.
- Matching experience:
  - System recommends **~3 service providers** by default (curated) + allow user to view/select additional (Angi-style list).
  - Provider info is partially gated early (avoid full company identity at first): show name/rating/reviews/# completed work orders; full profile opens on click (Thumbtack-like).

### Live-feel logistics (Uber/DoorDash-style)
- Homeowner can see day-of appointment:
  - PM assigned
  - “PM is on the way” real-time status
  - PM name (and optionally photo)
- (If desired) SP can see PM “on the way” status as well for coordination.

---

## Stand-out vs BOSSCAT (10–15 crisp differentiators)

### Brand assets (logos)
- Google Drive folder (PNGs, transparent): https://drive.google.com/drive/folders/1ssI-HOJiiIwslufB9OKPVScNY9dozxQ_?usp=share_link
- Local workspace copy: `/Users/Clawdbot/clawd/assets/homeworke/logos/`


### Relationship engine (agent-first moat)
1) **Two funnels, one relationship graph**
   - Partner-origin funnel hard-attaches the Origin Partner from click 1.
   - Open marketplace funnel later offers “Find/choose your Pro” to attach (or stay unassigned).

2) **CRM-first loop for agents** (Follow Up Boss / BoldTrail)
   - Push milestones into the agent’s CRM timeline (submitted, scheduled, completed, review).
   - Create auto-tasks + reminders (“check in after completion”, “annual home checkup”).

3) **Pro directory + claim profiles (Relays data)**
   - Homeowners can search a modern “Find your Pro” directory.
   - Agents can claim + verify profiles (license + ID) → stronger trust + distribution.

4) **Team + office distribution built-in**
   - Office dashboards + office splits baked into attribution.
   - Office admins can view production and run “database activation” campaigns.

### Faster, cheaper estimating & execution (ops moat)
5) **PM “record + talk” → estimate draft (Handoff-like)**
   - Field capture (video + voice) auto-converts to structured scope + estimate draft + materials/tasks.
   - Reduces PM/admin time and speeds turnaround vs manual scope writing.

6) **Evidence + audit trail everywhere (closing-safe)**
   - Who changed what, when (scope edits, estimate adjustments, draw releases).
   - Designed for transaction coordination and dispute prevention.

7) **Hybrid estimate pathways (instant + concierge + site-verified)**
   - Explicit confidence/range + “Need more info” lane (BOSSCAT-style), but tied to execution readiness.

8) **Calendar-connected execution (PM + contractor)**
   - Two-way scheduling and availability via calendar connect → fewer no-shows and reschedules.

### Better marketplace mechanics (homeowner + contractor)
9) **Frictionless open marketplace onboarding**
   - Thumbtack/Angi-style booking flow; collect minimal info only at confirmation.
   - Magic link login; progressive profile completion.

10) **Service Provider UX like DoorDash/Uber**
   - Opportunities feed + accept/decline + availability toggles.
   - Calendar connect + notifications for new bid opportunities.

11) **Contractor tool integrations (Jobber / Pipedrive)**
   - Push opportunities/updates into their existing workflow.
   - Faster bid response times = better homeowner experience.

### Trust + homeowner value-add (stickiness)
12) **Property value hub**
   - Zillow valuation + property map + repair history timeline → persistent homeowner dashboard value.

13) **Financing primitives embedded**
   - Loan calculator + partner application flow attached to real projects.

### Program + economics
14) **Partner program wallet + predictable payouts**
   - Admitted partner program + ledger + cash-out 1–2x per month + office splits.

15) **Attribution that matches reality**
   - Payouts on completed jobs (not leads).
   - Clear event model (created → scheduled → completed → review) and auditability.
