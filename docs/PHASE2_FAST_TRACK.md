# Phase 2 — Fast-Track Implementation (Checklist)

Scope: add Office + membership/invites/accept (magic-link compatible), expand RBAC roles/guards, add core Property model + WorkOrder→Property link, partner↔homeowner sharing flags, wire dashboards to DB when `DATABASE_URL` is set (fallback to mock-store), and add placeholders for future social login.

## ✅ Implemented

### 1) Office entity + membership + invites + accept flow (magic-link compatible)
- Prisma:
  - `Office`
  - `OfficeMembership` (composite PK `officeId + userId`)
  - `OfficeInvite` (token-based invite, expiring, records `acceptedAt` + `acceptedByUserId`)
  - `OfficeRole` enum (`MEMBER`, `ADMIN`)
- API:
  - `GET /api/office/partners` → returns office, members, pending invites (DB) or demo payload (no DB)
  - `POST /api/office/invites/request` → creates invite (requires global `ADMIN` or office `ADMIN`) and logs accept URL
  - `POST /api/office/invites/accept` → accepts invite (requires session cookie; verifies email match)
- UI:
  - `/office/dashboard` already pulls recent work orders via `/api/work-orders/recent` (DB-backed when enabled)
  - `/office/partners` now shows members + pending invites, and a minimal invite form
  - `/office/invite/accept?invite=...` accept screen:
    - If not signed in: prompts for email and requests a magic link with `next` set back to accept URL
    - If signed in: calls accept API directly

### 2) Expand RBAC roles in Prisma `UserRole` enum + route guards
- Prisma `UserRole` expanded to:
  - `USER` (legacy)
  - `HOMEOWNER`, `PARTNER`, `OFFICE_MEMBER`, `OFFICE_ADMIN`, `EDITOR`, `ADMIN`
- RBAC:
  - Added `requireOfficeMember()` and `requireOfficeAdmin()` helpers in `src/lib/rbac.ts`
- Route guard:
  - Added `src/app/office/layout.tsx` guard when DB is enabled:
    - requires authenticated user with **any** office membership (or global `ADMIN`)
    - when DB is disabled, office pages remain accessible for demo

### 3) Core Property model + WorkOrder → Property (optional) + sharing flags
- Prisma:
  - `Property` model (minimal: nickname + address fields)
  - `WorkOrder.propertyId` optional relation
  - `PartnerClient` model (partner↔homeowner relationship + sharing flags):
    - `canViewWorkOrders` (default true)
    - `canViewProperties` (default false)

### 4) Wire dashboards to DB when `DATABASE_URL` is set (fallback when not)
- Existing endpoints already support DB-or-mock for work orders and partner dashboard.
- Updated `/api/properties`:
  - When DB enabled: returns properties for the **current session user** via cookie session
  - When DB disabled: uses mock-store and requires `token` query param (existing behavior)

### 5) Placeholders/hooks for future social logins (magic link stays primary)
- Added `src/lib/auth/social.ts` with provider list and intended future route shape.
- Magic link flow enhanced:
  - `/api/auth/request-link` now supports optional `next` (relative path)
  - `/api/auth/consume` now redirects to `next` (relative path) after setting session cookie

## Dev Notes / How to Test

### Local DB mode
1. Set `DATABASE_URL`.
2. Run prisma migration/generate as needed (depending on your workflow):
   - `npx prisma migrate dev`
   - `npx prisma generate`
3. Sign in via magic link (check server logs for the link).
4. Create an office + office admin membership manually (or via seed) to access `/office/*`.
5. Create an invite:
   - Open `/office/partners` and submit invite email
   - Check server logs for the accept URL
6. Accept invite:
   - Open `/office/invite/accept?invite=...`
   - If not authenticated, request a magic link (logs)
   - After signing in, accept is completed and membership appears

### No-DB mode
- Leave `DATABASE_URL` unset.
- Office pages remain accessible (demo).
- Work orders/properties continue using mock-store.

## Remaining Follow-Ups (Not in fast-track)
- Add seeds/CLI for creating first office + admin membership
- Email delivery (SendGrid/Postmark) for magic links and office invites
- First-class PartnerProfile ↔ User linkage
- Office scoping in `/office/dashboard` (filter work orders by office/partners)
- Full partner-client management UI + sharing toggles
- Social OAuth routes + identity linking
