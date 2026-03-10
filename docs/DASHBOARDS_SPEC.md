# Dashboards Spec (Phase 2)

Last updated: 2026-03-10

This doc describes the **Phase 2 dashboard shells + data hooks** implemented in the Next.js app. The goal is navigation parity with Homeworke 2.0 plus lightweight, deploy-safe widgets that **do not require a DB at build time**.

## Global principles

- **No-DB safe:** All dashboards rely on API routes that internally gate access with `dbEnabled()` (`DATABASE_URL` present). When DB is disabled, endpoints return mock-store data or empty arrays with stable shapes.
- **Real objects:** Widgets are tied to real object types in code: `WorkOrder`, `Property`, `Message`.
- **Progressive onboarding:** Partner profile fields are optional/deferrable; dashboard UIs tolerate missing partner details.

---

## Objects + endpoints used by dashboards

### WorkOrders
- Source: `GET /api/work-orders?token=...` (HO)
- Source: `GET /api/pro/work-orders?partnerId=...` (Partner)
- Source: `GET /api/work-orders/recent?limit=...` (Ops/SP/Office)

### Properties (Phase 2 minimal)
- Source: `GET /api/properties?token=...`
- DB mode: returns `[]` (Properties not yet modeled in Prisma)
- Mock mode: served from `src/lib/mock-store.ts`

### Messages (Phase 2 minimal)
- Source: `GET /api/messages?token=...&partnerId=...&limit=...`
- DB mode: returns `[]` (Messages not yet modeled in Prisma)
- Mock mode: served from `src/lib/mock-store.ts`

---

## Role dashboards

### Homeowner (HO) — `/ho/dashboard`
**2.0 nav parity** (from source-of-truth): Dashboard, Messages, My Properties, Pro Team, Support, My Account

**KPI tiles (Phase 2)**
- Active services (WorkOrders)
- My properties (Properties)
- Unread messages (Messages)

**Primary widgets**
- Work orders list (links to `/ho/work-orders/[id]`)

**Primary CTAs**
- Submit Work Order
- Request Express Estimate (placeholder)
- Chat with Pro Team (placeholder)

---

### Partner (unified) — `/partner/dashboard`
**Replaces/aliases legacy Pro portal** (`/pro/dashboard` remains as back-compat).

**2.0 nav parity** (Real Estate Pro): Dashboard, Estimates, My Clients, Properties, Messages, Support, My Account

**KPI tiles (Phase 2)**
- Shared projects (WorkOrders shared with partner)
- Unread messages (Messages filtered by `partnerId`)
- Partner type (from local partner context)

**Primary widgets**
- Work orders grouped by status: Pending / Scheduled / In progress / Completed
- Recent messages preview

**Empty states**
- No partner link detected (prompts user to open partner link `/p/{code}`)
- No shared projects yet

---

### Service Provider (SP) — `/sp/dashboard`
**2.0 nav parity** (plus Dashboard added): Dashboard, Find Work, Messages, My Qtrs, My Bid(s), Support, My Account

**KPI tiles (Phase 2)**
- Open opportunities (derived from WorkOrders)
- Active bids (placeholder)
- Availability (placeholder)

**Primary widgets**
- Latest opportunities list (from recent WorkOrders)

**Primary CTAs**
- Find work
- View bids

---

### Home Guide (HG) — `/hg/dashboard`
**2.0 nav parity**: Dashboard, My Projects, Estimates, Messages, Service Providers, Customers, Real Estate Pros, Help Desk, Support, My Account

**KPI tiles (Phase 2)**
- Work orders pending
- Unread messages
- Active projects (non-completed WorkOrders)

**Primary widgets**
- Triage queue (recent WorkOrders)

---

### Project Manager (PM) — `/pm/dashboard`
**Nav (Phase 2)**: Dashboard, My Projects, Calendar, Messages, Support, My Account

**KPI tiles (Phase 2)**
- Scheduled (derived from WorkOrders status)
- In progress
- SLA alerts (placeholder)

**Primary widgets**
- My projects list (recent WorkOrders)

---

### Office (multi-partner org) — `/office/dashboard`
**Phase 2 nav**: Dashboard, Partners, Work Orders, Messages, Support, Office Settings

**KPI tiles (Phase 2)**
- Active projects (derived from WorkOrders)
- Partner seats (placeholder)
- Unread threads (placeholder)

**Primary widgets**
- Recent work orders list

---

### Admin — `/admin/dashboard`
Admin is currently CMS-focused (Services/Categories/Pages). Phase 2 adds operational counters.

**Widgets**
- If `dbEnabled=false`: shows DB disabled state + CMS shortcuts
- If `dbEnabled=true`: counters for Users / Partners / WorkOrders + CMS shortcuts

---

## Data model notes (Phase 2)

### Unified Partner role + PartnerType
- Prisma adds `PartnerType` enum: `REAL_ESTATE | LENDER | INSPECTOR | INSURANCE`
- `PartnerProfile.partnerType` defaults to `REAL_ESTATE`
- Partner profile onboarding fields are optional/deferrable (progressive onboarding)

See: `prisma/schema.prisma` (`UserRole.PARTNER`, `PartnerType`, `PartnerProfile` updates)
