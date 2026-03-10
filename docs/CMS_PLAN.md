# Homeworke CMS Plan (Services + Marketing Pages)
Owner: Frank Rocha Jr.
Last updated: 2026-03-10

## Why we need a CMS
Right now our marketing/service pages are effectively "content in code" (JSON files + TSX pages). That is fast for initial build, but it blocks operations:
- An Admin / Home Guide can’t safely update copy, FAQs, or add new services without engineering.
- We can’t do role-based approvals (draft → review → publish).
- We need an audit trail for changes.

## What “Thumbtack/Angi model” implies for us
A user-facing “service” (leaf) must:
- live as its own landing page (SEO + conversion)
- also belong to a category hierarchy (for navigation + discoverability)

So our CMS needs *both*:
- **Category taxonomy** (parent/child)
- **Service pages** (leaf pages), each optionally containing:
  - hero + trust blocks
  - FAQs
  - CTAs (get estimate / request service)
  - related services

## CMS MVP scope (Phase 1)
### Content types
1) **ServiceCategory**
- name, slug
- parentCategoryId (nullable)
- sortOrder
- optional intro copy

2) **Service**
- name, slug
- categoryId (primary)
- secondaryCategoryIds (optional)
- status: draft/published/archived
- page content blocks (JSON)
- SEO: title/description

3) **Page** (generic marketing pages)
- type: `HOME`, `HOW_IT_WORKS`, `CHICAGO`, `CITY`, `STATIC`
- slug (or fixed route)
- status: draft/published
- content blocks (JSON)
- SEO fields

4) **ContentBlock** (stored inside Service/Page JSON)
We should keep blocks simple and versionable, e.g.:
- `hero`
- `trust_bar`
- `feature_grid`
- `faq`
- `testimonial`
- `cta`
- `comparison`
- `steps`

### Users + roles
We already have `User` and `AuditLog`.
Add:
- **Role**: `ADMIN`, `EDITOR` (Home Guide)
- Optional: `VIEWER`

### Permissions
- **Admin**
  - create/edit/publish categories, services, pages
  - assign editors
  - manage settings
- **Editor (Home Guide)**
  - edit assigned services/pages
  - cannot publish; can “submit for review”

### Workflow
- Draft → In Review → Published
- Every publish creates a revision record.

## Recommended technical implementation (Next.js + Prisma)
### Backend storage
- Postgres via Prisma (we already have Prisma + an AuditLog model)
- Add CMS models:
  - `CmsRole`, `UserCmsRole`
  - `ServiceCategory`, `Service`
  - `Page`
  - `ContentRevision` (optional but recommended)

### Frontend rendering
- Marketing pages render from DB if present; fallback to existing JSON content for safety during rollout.
- Each page/service uses a “template” TSX file that:
  - fetches the `Page`/`Service`
  - renders content blocks through a block renderer

### Admin UI
- `/admin` (protected)
  - Services list (filter: status, category)
  - Service editor (title/seo/blocks)
  - Category editor (tree)
  - Pages list + editor
  - Assignments (admin assigns editor to service/page)

### Auth (minimal)
If we want this quickly:
- Use existing magic-link session framework (or NextAuth later).
- Require ADMIN/EDITOR role to access `/admin`.

## AI assist (Anthropic Opus 4.6)
We can add an **optional** “Generate draft” button in the admin editor.

### Safety rules
- AI output is always a **draft**.
- Human must review before publish.
- Log prompt + output in AuditLog or a `ContentGenerationLog` table.

### Implementation
- Store the Anthropic key as **env var**: `ANTHROPIC_API_KEY` (server-side only).
- Create an API route:
  - `POST /api/admin/ai/generate` with inputs (service name, category, tone, target city)
  - returns suggested blocks (hero copy, FAQs, etc.)

## Rollout plan
### Phase 1 (MVP CMS)
- Create CMS tables + admin pages for Service + Category + Page
- Render service pages from DB (only when published)
- Keep current JSON pages as fallback

### Phase 2 (Revisioning + approvals)
- Add revisions + “submit for review”
- Add assignments + permissions per page/service

### Phase 3 (Scale)
- City/neighborhood programmatic pages
- Bulk import from Thumbtack/Angi research mapping
- AI-assisted draft generation at scale

## Open questions (need your decisions)
1) Who are the editor roles in practice? Home Guide only, or also Ops/Marketing?
2) Do we want Git-based content export as a backup (nightly JSON snapshot)?
3) Which pages are in-scope first: Services only, or homepage + how-it-works too?
