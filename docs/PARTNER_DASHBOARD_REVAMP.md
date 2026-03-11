# Partner Dashboard Revamp (Homeworke 3.0)

## Goals
- Modernize **/partner/dashboard** to exceed the current Homeworke 2.0 dashboard screenshots.
- Align layout + modules with BOSSCAT patterns (scan-friendly KPIs, action modules, lightweight status visualization).
- Add a dedicated **Express Estimate** entry flow: **/partner/express-estimate** (and **/pro/express-estimate** alias).
- Keep UI **mobile responsive**, demo-safe when DB is off, and build green.

## What shipped

### 1) Revamped dashboard layout
**File:** `src/components/dashboards/PartnerDashboardClient.tsx`

**Routes:**
- `/partner/dashboard` → uses `PartnerDashboardClient` (basePath `/partner`)
- `/pro/dashboard` → alias uses `PartnerDashboardClient` (basePath `/pro`)

**New modules included:**
- **KPI tiles row** (Active, Pending, Completed, Unread)
- **Invite Clients + Copy Link module**
  - Shows partner invite link (computed as `https://<host>/p/<partnerId>`) with one-click copy
- **Active Projects Shared With You**
  - List preview of the most recently updated shared work orders
  - Includes a **lightweight progress rail/stepper** across statuses: Pending → Scheduled → In progress → Completed
- **Messages preview panel**
  - Right-column widget showing the latest messages from mock-store when DB is off
- **Touchpoint prompts**
  - 4 prompt cards to drive next actions (draft message, request photos, build a scope summary, concierge intro)
- **Express Estimate entry card**
  - Prominent entry point from dashboard primary CTA + a section card

### 2) Express Estimate route (upload + stub builder)
**Component:** `src/components/partner/ExpressEstimateClient.tsx`

**Routes:**
- `src/app/partner/express-estimate/page.tsx`
- `src/app/pro/express-estimate/page.tsx`

**Flow (stubbed UI):**
1. Upload an **inspection/appraisal PDF** (client-side file input).
2. Click **Extract line items** (stub action) to reveal the builder.
3. Builder shows extracted lanes:
   - Exterior
   - Interior
   - Systems
   - **Need more info**
4. Items can be selected into a **Selection cart**.
5. Download buttons are present but intentionally **stubbed/disabled** until real PDF parsing + export wiring lands.

### 3) Navigation updates
The dashboard and Express Estimate pages include nav entries for **Express Estimate**.

Pro placeholder pages also had their nav updated to include:
- `/pro/express-estimate` — **Express Estimate**

Files updated:
- `src/app/pro/clients/page.tsx`
- `src/app/pro/messages/page.tsx`
- `src/app/pro/estimates/page.tsx`
- `src/app/pro/properties/page.tsx`
- `src/app/pro/support/page.tsx`
- `src/app/pro/account/page.tsx`

## Demo data / DB-off behavior
- Work orders: `/api/pro/work-orders` already returns mock-store data when `dbEnabled()` is false.
- Messages: `/api/messages` returns mock-store messages when DB is off.

The revamped dashboard consumes those endpoints and remains populated in demo mode.

## Next wiring steps (not included)
- PDF ingestion pipeline:
  - upload → storage → OCR/text extraction → category detection → line-item normalization
- “Need more info” lane resolution:
  - photo requests and structured follow-up questions
- Export:
  - generate BOSSCAT-style estimate PDF (selected vs full)
  - send-to-thread action
- Persist drafts to DB

## Quick manual QA
- Visit `/p/frj` (example partner link) to set partner context.
- Open:
  - `/partner/dashboard` and `/pro/dashboard`
  - `/partner/express-estimate` and `/pro/express-estimate`
- Confirm:
  - KPIs render
  - work order list + progress rail render
  - invite link copies
  - Express Estimate flow toggles after file upload + “Extract line items"
  - mobile layout stacks correctly
