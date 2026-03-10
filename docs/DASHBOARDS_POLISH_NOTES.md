# Dashboards Polish Sprint (Phase 1.5) — Notes

## What shipped

### New reusable dashboard components
- `src/components/dashboard/DashboardSection.tsx`
  - Standard section header (title + optional description)
  - Right-side meta + optional `count` pill
  - Optional `action` slot (encourages *one primary action per page*)
  - Defaults to a Card surface with consistent padding (`p-6 md:p-7`)
- `src/components/dashboard/KpiGrid.tsx`
  - Consistent KPI grid spacing + responsive columns
- `src/components/dashboard/ListRow.tsx`
  - Consistent list row styling, optional link (`href`), `badge`, `meta`, and `footnote`
  - Includes `StatusChip` helper for lightweight status labeling

### PortalShell header refinement
- `src/components/portal-shell.tsx`
  - Added optional props: `eyebrow`, `description`, `primaryAction`
  - Header area now supports a right-aligned page action (desktop) while staying readable on mobile
  - Default copy preserved if `description` isn’t provided

## Pages updated (before → after)

### Partner dashboard (`PartnerDashboardClient`)
- Before: KPI tiles + multiple bespoke Card sections with repeated header markup.
- After: `KpiGrid` for KPI tiles + `DashboardSection` for status groups and message preview + `ListRow` for items.
- Primary action: added **Open messages** in the PortalShell header.

### HG dashboard (`/hg/dashboard`)
- Before: KPI tiles + Card list with custom row UI.
- After: `KpiGrid` + `DashboardSection` + `ListRow` for the triage queue.

### PM dashboard (`/pm/dashboard`)
- Before: KPI tiles + Card list with custom rows.
- After: `KpiGrid` + `DashboardSection` + `ListRow` for assigned projects.

### Office dashboard (`/office/dashboard`)
- Before: KPI tiles + Card list.
- After: `KpiGrid` + `DashboardSection` + `ListRow`.
- Primary action: **View work orders** moved into the PortalShell header.

### HO dashboard (`/ho/dashboard`)
- Before: multiple primary-looking actions inside the work-orders card.
- After:
  - Primary action moved to PortalShell header: **Request service**
  - Section uses secondary/ghost actions only (keeps “one primary action per page”)
  - Work orders render via `DashboardSection` + `ListRow`

### SP dashboard (`/sp/dashboard`)
- Before: Primary action at bottom of section (Find work) + list cards.
- After:
  - Primary action moved to PortalShell header: **Find work**
  - Section action: **View bids** (secondary)
  - Opportunities render via `DashboardSection` + `ListRow`

### Admin dashboard (`/admin/dashboard`)
- Before: bespoke header Card + KPI grid + action cards.
- After: header standardized via `DashboardSection`; KPI tiles use `KpiGrid`.

## Token / style alignment
- All new components use existing moodboard variables (`--hw-*`) and existing UI primitives (`Card`, `Pill`, `Chip`, `Button`).
- Spacing normalized around `gap-6` for page sections and `p-6 md:p-7` for section surfaces.

## Build safety
- `npm run build` passes.
- No DB required for the updated dashboards (admin still respects `dbEnabled()` gating).
