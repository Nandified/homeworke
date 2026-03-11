

# Homeworke 3.0 — Real Estate Pro Dashboard
## Complete Design Specification

---

## A) Dashboard IA + Layout Spec (Mobile-First)

### Route Structure

| Route | Label (Nav) | Purpose |
|---|---|---|
| `/pro` | **Home** | Dashboard hub — KPIs, Needs Attention, recent activity |
| `/pro/clients` | **My Clients** | Client list with status filters (Connected / Invited / Pending) |
| `/pro/estimates` | **Estimates** | All Express Estimates + Negotiation Packets |
| `/pro/projects` | **Projects** | Active/completed work orders shared with this pro |
| `/pro/messages` | **Messages** | Threaded conversations (clients, ops, Homeworke) |
| `/pro/office` | **My Office** | Office roster, agent production, team settings |
| `/pro/account` | **Account** | Profile, license/verification, CRM integrations, share links |

**Mobile nav:** Bottom tab bar with 5 slots: **Home · Clients · Estimates · Projects · Messages**. Office + Account accessible via avatar menu (top-right). Badge counts on Home (needs-attention count) and Messages (unread count).

**Desktop nav:** Left sidebar, collapsed by default to icon-only (64px), expandable to 240px. Same order. Office + Account in sidebar footer.

---

### Dashboard (`/pro`) — Section-by-Section Layout

The dashboard is a single scrollable view. Mobile: single column. Desktop: 2-column grid (main 2/3 + sidebar 1/3).

#### Section 1: Greeting Bar
- **Content:** "Good morning, Fernando" + today's date (Tue, Mar 11)
- **Right side:** Avatar (initials or headshot) → taps to Account
- **Mobile:** Full-width, 16px padding

#### Section 2: KPI Stat Tiles (horizontal scroll on mobile, row on desktop)
Four `StatTile` components:

| Tile | Demo Value | Trend | Color |
|---|---|---|---|
| Active Clients | **14** | +2 this month | `--hw-ink` |
| Open Estimates | **6** | 3 pending review | `--hw-red` |
| Projects In Progress | **4** | 1 completing this week | `--hw-ink` |
| Completed (YTD) | **23** | ↑ 18% vs last year | green |

**Spec:** Each tile is a `Card` (radius 18, soft shadow). 120×88px on mobile, flex on desktop. Horizontal scroll with snap on mobile. Tap → navigates to relevant list view.

#### Section 3: Needs Attention Lane ⚡
- **Header:** "Needs Attention" + red badge count (e.g., `3`)
- **Content:** Vertical stack of `AttentionCard` components (see Section B for rules)
- **Empty state:** "You're all caught up ✓" with muted text
- **Max visible:** 3 on mobile (with "See all" link), 5 on desktop
- **Demo data (3 items):**

  1. 🔴 **Estimate expiring** — "1847 N Damen Ave estimate expires in 2 days" → CTA: "Review & Share"
  2. 🟡 **Client invite pending** — "Maria Santos hasn't accepted your invite (sent 5 days ago)" → CTA: "Resend Invite"
  3. 🟡 **Missing documents** — "Buyer inspection report needed for 4521 W Monroe" → CTA: "Request Upload"

#### Section 4: Quick Actions Bar
Two primary actions, rendered as large tappable cards (mobile: stacked, desktop: side-by-side):

| Action | Icon | Route |
|---|---|---|
| **Invite a Client** | `user-plus` | `/pro/clients/invite` |
| **New Express Estimate** | `file-text` | `/pro/estimates/new` |

**Rule:** One primary action per context. On this dashboard, both are equally weighted (side-by-side), but on any sub-page, only one primary CTA exists.

#### Section 5: Recent Activity Feed
- **Header:** "Recent Activity"
- **Content:** Chronological feed of events (max 8, paginated)
- **Demo data:**

  | Time | Event |
  |---|---|
  | 2h ago | Express Estimate ready for **1847 N Damen Ave** — 12 items, $8,400–$11,200 |
  | 5h ago | **Carlos Mendez** accepted your client invite |
  | Yesterday | Negotiation Packet shared with seller's agent for **4521 W Monroe** |
  | Yesterday | Project completed: Kitchen faucet replacement at **2200 S Michigan** — Client rated 5★ |
  | 2 days ago | **Lisa Park** submitted a work order via your link (plumbing) |
  | 3 days ago | Schedule change: PM visit for **1847 N Damen** moved to Mar 14 |
  | 4 days ago | New Express Estimate request from **David Kim** (inspection report uploaded) |
  | 5 days ago | Draw #2 released for **890 W Fullerton** renovation — $3,200 |

- **Each row:** Timestamp (relative) · Event text (bold entity names) · Chevron → detail view
- **Component:** `ActivityRow` — 56px height, `--hw-line` bottom border, `--hw-ink` text, `--hw-muted` timestamp

#### Section 6: My Share Link (Desktop Sidebar / Mobile: below activity)
- **Card:** "Your Homeworke Link"
- **Content:** `homeworke.com/p/frj` with copy button
- **Subtext:** "Share with clients to auto-connect them to you"
- **Stats:** "47 visits this month · 8 clients connected"
- **CTA:** "Customize Landing Page →"

#### Section 7: Attribution Summary (Desktop Sidebar)
- **Card:** "Your Impact (YTD)"
- **Content:**
  - Clients connected: **14**
  - Requests originated: **31**
  - Jobs completed: **23**
  - Total project value: **$67,400**
- **Subtext:** "Clients see you as their trusted home advisor"
- **Component:** `AttributionCard` (see Section C)

---

### Interaction Patterns

| Pattern | Behavior |
|---|---|
| **Pull to refresh** (mobile) | Refreshes KPIs + Needs Attention + Activity |
| **Skeleton loading** | All cards show shimmer placeholders on load |
| **Tap-through** | Every card/row is tappable → navigates to detail |
| **Swipe actions** (mobile, Attention cards only) | Swipe right = dismiss/snooze, swipe left = act |
| **Toast notifications** | Slide up from bottom, auto-dismiss 4s, action link |
| **Bottom sheet** (mobile) | Used for quick actions (share, resend invite) instead of full page nav |
| **Sticky header** | On scroll, greeting collapses to "Fernando · 3 ⚡" mini-bar |

---

## B) Needs Attention Lane — Rules Engine

### Philosophy
The Needs Attention lane is the pro's **daily triage queue**. Items appear here based on SLA timers, state changes, and expiring windows. Each item has a severity, a human-readable message, and exactly one CTA.

### Attention Item Schema

```typescript
interface AttentionItem {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: AttentionCategory;
  title: string;
  description: string;
  entity_type: 'estimate' | 'client' | 'project' | 'document' | 'schedule';
  entity_id: string;
  created_at: string;
  expires_at: string | null;
  cta_label: string;
  cta_route: string;
  dismissable: boolean;
  snoozable: boolean;
}
```

### Rules Table

| # | Category | Trigger | Severity | Title Template | CTA | Auto-dismiss |
|---|---|---|---|---|---|---|
| 1 | `estimate_expiring` | Estimate created >5 days ago, not shared or accepted | 🔴 critical | "{Address} estimate expires in {N} days" | "Review & Share" | When shared or expired |
| 2 | `estimate_ready` | New estimate generated, pro hasn't viewed | 🟡 warning | "Express Estimate ready for {Address}" | "View Estimate" | When viewed |
| 3 | `client_invite_stale` | Client invite sent >3 days ago, not accepted | 🟡 warning | "{Name} hasn't accepted your invite ({N} days)" | "Resend Invite" | When accepted or 14 days |
| 4 | `client_invite_expired` | Client invite >14 days, not accepted | 🔴 critical | "{Name}'s invite expired" | "Re-invite" | When re-invited |
| 5 | `missing_document` | Estimate or project requires upload not yet provided | 🟡 warning | "Missing {doc_type} for {Address}" | "Request Upload" | When uploaded |
| 6 | `schedule_change` | PM visit or appointment rescheduled in last 24h | 🟡 warning | "Schedule change: {event} for {Address}" | "View Details" | After 48h |
| 7 | `project_blocked` | Work order in "Attention" status (provider issue, access issue) | 🔴 critical | "{Address} project needs attention" | "View Project" | When resolved |
| 8 | `review_opportunity` | Project completed >24h ago, no review requested | ℹ️ info | "{Name} completed a project — request a review?" | "Send Review Request" | After 7 days |
| 9 | `packet_viewed` | Negotiation Packet opened by recipient (seller/agent) | ℹ️ info | "Your packet for {Address} was viewed by {Role}" | "View Packet" | After 48h |
| 10 | `sla_breach` | Any SLA timer exceeded (estimate turnaround, response time) | 🔴 critical | "SLA exceeded: {description}" | "Escalate" | When resolved |
| 11 | `new_client_request` | Client submitted a work order via pro's link | ℹ️ info | "{Name} submitted a new request ({service})" | "View Request" | When viewed |
| 12 | `closing_approaching` | Client's `target_close_date` within 7 days, open items exist | 🔴 critical | "{Name}'s closing in {N} days — {count} open items" | "Review Items" | After close date |

### Sorting Rules
1. **Severity:** critical → warning → info
2. **Within severity:** oldest `created_at` first (most urgent)
3. **Dismissed items:** hidden from lane, stored in `attention_log` for audit
4. **Snoozed items:** reappear after snooze duration (default: 24h)

### Badge Count
- Badge on nav = count of `critical` + `warning` items only (info excluded)
- Demo value: **3**

---

## C) Card Designs

All cards use `--hw-radius: 18px`, `--hw-shadow`, `--hw-soft` background, with `--hw-line` borders where needed.

---

### C1: Project Card

```
┌──────────────────────────────────────────────┐
│  🏠  1847 N Damen Ave, Unit 2               │
│  Chicago, IL 60647                           │
│                                              │
│  ┌─────────┐ ┌──────────┐ ┌───────────┐     │
│  │●Estimate│→│Scheduled │→│In Progress│     │
│  └─────────┘ └──────────┘ └───────────┘     │
│                                              │
│  Kitchen & Bath Renovation                   │
│  Client: Maria Santos                        │
│                                              │
│  ┌────────────┐  ┌──────────────┐            │
│  │ $8,400–     │  │ PM Visit     │            │
│  │ $11,200     │  │ Mar 14, 10am │            │
│  └────────────┘  └──────────────┘            │
│                                              │
│  Updated 2h ago                    → View    │
└──────────────────────────────────────────────┘
```

**Spec:**
- **Header:** Property address (bold, `--hw-ink`), city/state/zip (muted)
- **Status stepper:** Horizontal pill chain showing current phase. Active step uses `--hw-red` fill + white text. Completed steps: green check. Future: `--hw-line` outline.
  - Phases: `Estimate` → `Scheduled` → `In Progress` → `Verification` → `Completed`
- **Body:** Project title (semibold), Client name (muted)
- **Metrics row:** Estimate range (left), Next appointment (right) — both in mini `StatTile` style
- **Footer:** Relative timestamp (muted) + "View →" link (`--hw-red`)
- **Tap target:** Entire card → `/pro/projects/{id}`
- **Mobile:** Full-width, 16px horizontal margin
- **Desktop:** 380px max-width in grid

---

### C2: Client Card

```
┌──────────────────────────────────────────────┐
│  👤  Maria Santos                            │
│  ● Connected                                 │
│                                              │
│  📍 1847 N Damen Ave, Chicago                │
│  📧 maria.santos@email.com                   │
│  📱 (312) 555-0142                           │
│                                              │
│  Active: 2 projects · 1 estimate pending     │
│  