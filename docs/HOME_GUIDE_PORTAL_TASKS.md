# Home Guide Portal (NEW) — Task List (Fully Detailed)
Date: 2026-05-18
Owner: Clawdbot
Scope: Build a **Home Guide Portal** that looks/feels identical to the NEW Real Estate Pro + Homeowner portals, while providing the legacy Home Guide left-nav + pages and fully integrating with the NEW platform/flow.

Legacy reference notes (video): `tmp/home_guide_video/NOTES.md`

---

## 0) Non-negotiables (Definition of Done)
- **UI parity:** Home Guide Portal uses the exact same shell/components/styles as Real Estate Pro + Homeowner portals (left rail, header, cards, typography, spacing, buttons).
- **Role-based access:** Only Home Guide role can access Home Guide routes; other roles are denied or redirected.
- **Data integration:** Portal reads/writes the **same source-of-truth** objects as the new platform for:
  - Work Orders
  - Projects
  - Messages
  - Help Desk tickets
  - Service Providers (directory + join requests + approvals + invites)
  - Customers
  - Real Estate Pros
- **Deep links:** Every list item can navigate to a detail page with stable IDs.
- **No “fake UI”:** If a page is present in nav, it must either work end-to-end or be clearly tagged as “Coming soon” with no broken actions.

---

## 1) Information Architecture (Nav + Routes)
Implement Home Guide left nav (match legacy list):
1. Dashboard
2. My Projects
3. Services
4. Messages
5. Service Providers
6. Customers
7. Real Estate Pros
8. Help Desk
9. My Account

### Tasks
- [ ] Decide/confirm route base (recommend): `/home-guide/*` or `/hg/*`
- [ ] Create route group + layouts to reuse portal shell
  - [ ] `src/app/home-guide/layout.tsx` (or route group equivalent)
  - [ ] Ensure consistent left rail + top header
- [ ] Add navigation config entry (similar to `PRO_NAV`) for Home Guide
- [ ] Add role switcher badge behavior (like PRO/HO badges) in header

---

## 2) Authentication / Authorization / Session
### Tasks
- [ ] Define Home Guide role in session payload (e.g., `role: 'home_guide'`)
- [ ] Gate all `/home-guide/*` routes
  - [ ] Server-side route guard where possible
  - [ ] Client-side fallback redirect
- [ ] Ensure login flows can route into correct portal
  - [ ] “Back to all portals” behavior (if exists)
  - [ ] Role-based landing route after login
- [ ] Add “switch portal” UX (if applicable) without breaking sessions

---

## 3) Data Model & API Surface (New Platform Integration)
### Entities (minimum)
- Work Orders
- Projects
- Customers
- Real Estate Pros
- Service Providers
- Messages (threads + events)
- Help Desk Tickets
- Attachments/Documents
- Notes (ticket notes, project notes)
- Activity/Audit log (optional but strongly recommended for HG operators)

### Tasks
- [ ] Inventory current API routes in repo (`src/app/api/*`) relevant to these entities
- [ ] Fill gaps with new API routes (or unify with existing) for HG needs:
  - [ ] List endpoints with filters + pagination
  - [ ] Detail endpoints by ID
  - [ ] Mutation endpoints (approve/solve/assign/update)
- [ ] Standardize response shapes (TypeScript types)
- [ ] Add server-side validation for mutations
- [ ] Ensure all writes include `actor` metadata (who performed action)

---

## 4) Shared UI Building Blocks (Reuse + Extend)
### Tasks
- [ ] Extract/ensure a shared `PortalShell` can support HG nav items
- [ ] Standardize table/list pattern used across portals:
  - [ ] Search
  - [ ] Sort (Most recent, oldest, status)
  - [ ] Status tabs / segmented control
  - [ ] Pagination
  - [ ] Empty states
  - [ ] Loading skeletons
- [ ] Create reusable “KPI Stat Card” component for HG dashboard
- [ ] Create reusable “Badge/Status pill” mapping (Pending, Active, Completed, Solved, Approved, etc.)

---

## 5) Page-by-Page Build Plan

### 5.1 Dashboard (Home Guide)
**Goal:** operator overview + queues + quick actions.

**UI (match new portal dashboard patterns):**
- KPI cards: Work Orders, Customers, Service Providers, Help Desk, Projects Overview
- Active projects list (with stage/status)
- Availability toggle (legacy had it; decide whether HG still needs it)

**Tasks**
- [ ] KPI cards
  - [ ] Work orders counts by status
  - [ ] Customers totals + active orders
  - [ ] Service provider counts: active + join requests
  - [ ] Help desk pending count
  - [ ] Projects overview: active + completed
- [ ] Queues section(s)
  - [ ] Pending work orders
  - [ ] Join requests (SP)
  - [ ] Pending help desk tickets
- [ ] Active projects list
  - [ ] Show stage + last updated
  - [ ] Quick actions: open, message, view timeline

---

### 5.2 My Projects
**Goal:** manage all projects across customers/REPs; view pipeline stages.

**Required features**
- List view with filters: stage/status, assigned HG, date range
- Search by address/customer/name
- Detail view with:
  - Timeline
  - Appointments (visit / pre-work visit)
  - Estimates & bids
  - Documents
  - Notes

**Tasks**
- [ ] `/home-guide/projects` list
- [ ] `/home-guide/projects/[id]` detail
  - [ ] Estimates module (view, download, replace bid)
  - [ ] “Select estimate on behalf of client” action (with audit log)
  - [ ] View bids
  - [ ] Create estimate on behalf of SP (if still needed)
  - [ ] Add project documents
  - [ ] Edit project scope
  - [ ] Visit appointment status (Completed / Skipped)

---

### 5.3 Services
**Goal:** manage service taxonomy + matching rules (as needed).

**Tasks**
- [ ] Decide if this is:
  - a) read-only taxonomy browser
  - b) admin CRUD for service catalog
  - c) operational tools (assigning services to SPs)
- [ ] Build v1 as read-only if CRUD is not required day 1

---

### 5.4 Messages
**Goal:** unified messaging across customers, REPs, SPs.

**Tasks**
- [ ] Threads list with filters (unread, by role, by project)
- [ ] Thread detail view
  - [ ] Send message
  - [ ] Attach files/images
  - [ ] Link to related project/work order
- [ ] Message event audit (delivered/read if available)

---

### 5.5 Service Providers
**Goal:** manage SP pipeline: join requests, availability, directory, invites.

**Tasks**
- [ ] Tabs:
  - [ ] Join Requests
  - [ ] Available
  - [ ] Directory
  - [ ] Invite
- [ ] Join Requests table
  - [ ] Search
  - [ ] Sort: Most Recent
  - [ ] Approve/Reject
  - [ ] View provider profile
  - [ ] Completion %
- [ ] Directory
  - [ ] Filter by trade/service area
  - [ ] Status badges (approved, pending)
- [ ] Invite
  - [ ] Send invite (email/phone)
  - [ ] Table columns: sent on, email, full name, completion %, status, actions
  - [ ] Resend / revoke invite

---

### 5.6 Customers
**Goal:** manage customers; see associated properties/projects.

**Tasks**
- [ ] Customers list
  - [ ] Search by name/email/phone/address
  - [ ] Status (active/inactive)
- [ ] Customer detail
  - [ ] Properties
  - [ ] Projects / work orders
  - [ ] Messages
  - [ ] Notes

---

### 5.7 Real Estate Pros
**Goal:** manage REPs; see connected customers/projects.

**Tasks**
- [ ] REP list
- [ ] REP detail
  - [ ] Clients
  - [ ] Projects
  - [ ] Messaging
  - [ ] Invite/connection status

---

### 5.8 Help Desk
**Goal:** support ticket workflow (legacy: Pending / Accepted / All + Solve modal).

**Tasks**
- [ ] Help Desk list
  - [ ] Tabs: Pending, Accepted, All
  - [ ] Columns: assigned in, status, user, home guide assignee, preview
  - [ ] Action: Solve
- [ ] Ticket detail or modal
  - [ ] User info + View Profile
  - [ ] Contact info
  - [ ] Message body
  - [ ] Notes (add/edit/delete)
  - [ ] Solve / Cancel
- [ ] Assignment workflow
  - [ ] Assign ticket to HG operator
  - [ ] Accept/triage states (Pending → Accepted → Solved)

---

### 5.9 My Account
**Goal:** profile + settings for HG users.

**Tasks**
- [ ] Profile details
- [ ] Password reset / auth management
- [ ] Notification preferences (email/SMS/in-app)
- [ ] Team/roles visibility (if applicable)

---

## 6) Cross-Cutting Concerns
### 6.1 Status System (Canonical)
**Tasks**
- [ ] Define canonical enums for:
  - Work order status
  - Project stage
  - Ticket status
  - Provider approval status
  - Invite status
- [ ] Centralize mapping → UI labels/colors

### 6.2 Search / Filters / Pagination
**Tasks**
- [ ] Shared query param conventions across lists
- [ ] Pagination strategy (cursor vs page)
- [ ] Debounce + focus stability (Safari)

### 6.3 Audit Trail
**Tasks**
- [ ] Log important operator actions:
  - Selecting estimate on behalf of client
  - Approving/rejecting provider
  - Solving tickets
  - Editing project scope

### 6.4 Permissions & Safety Rails
**Tasks**
- [ ] Confirm which actions HG can perform vs view-only
- [ ] Add confirmation dialogs for high-impact actions

---

## 7) QA Checklist (Before Shipping)
- [ ] Visual parity check vs Real Estate Pro + Homeowner portals (spacing, fonts, button styles)
- [ ] Route guards prevent unauthorized access
- [ ] All list pages:
  - [ ] load
  - [ ] filter
  - [ ] search
  - [ ] paginate
  - [ ] empty state
- [ ] All detail pages deep link works
- [ ] Core mutations succeed and update UI immediately
- [ ] Safari focus stability on all search inputs
- [ ] Basic performance: no obvious re-render storms

---

## 8) Implementation Order (Recommended)
1. Portal shell + routing + auth guard for Home Guide
2. Dashboard KPIs + queues (read-only)
3. Help Desk (tickets) (read/write)
4. Service Providers (join requests + approvals)
5. My Projects list + detail (read-only → then actions)
6. Messages (threads)
7. Customers + Real Estate Pros directory + detail pages
8. Services (read-only → admin later)
9. My Account

---

## 9) Open Items to Confirm (Quick Yes/No)
- Does Home Guide still need the **“I’m available to work”** toggle (auto-assignments), or is that retired in the new platform?
- Should Help Desk be a **modal** flow (legacy) or a dedicated detail route?
- Which invite channels are required day 1: Email only, or Email + SMS?
