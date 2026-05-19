# Service Provider Portal (Legacy Platform) — Video Notes
Source video: Google Drive `Service Provider - Homeworke - Dashboard & Process.mov`
Extract method: sampled ~1 frame / 5s (34 frames).

## 1) Global Shell / IA (Left Nav)
Legacy left nav labels observed:
- **Find Work**
- **Messages**
- **My Jobs**
- **Billing**
- **Support**
- **My Account**

## 2) Find Work (opportunity feed)
### Header
- Greeting copy (example seen): **“Hi Frank, your next opportunity awaits!”**
- Availability toggle: **“I’m available to work”** (implies job alerts / matching)

### Opportunity card pattern
Each opportunity card contains:
- Slots indicator: **“X/6 slots Available”** with flame icon + progress bar
- **Zip code** (large label)
- **Order #** (reference id)
- **Service tags** (chips) e.g. Brickwork, Concrete Work, Emergency Plumbing, HVAC, Painting
- **Estimated Price** range (min–max)
- **Possible Start Date**
- CTA button: **Job Details**

## 3) Job Details
A job detail view shows a list of scope items with columns:
- Item name
- Description
- Quantity
- Min Price
- Max Price

## 4) Create Estimate (SP workflow)
Estimate builder UI observed:
- Fields: Possible Start Date, Expiry Date
- Section: “Create estimate items” + platform fee reminder (20%)
- Line items with:
  - item name
  - description
  - quantity
  - price
  - actions: add/save item, edit, delete

## 5) Gaps in sampled frames
- Messages screen specifics not captured in selected frames
- My Jobs specifics not captured in selected frames
- Billing specifics not captured in selected frames

---

# Mapping to NEW portal
We should mirror the legacy IA and flows, but using the new UI kit:
- Use existing `PortalShell`, `DashboardSection`, `ListRow`, cards, pills, chips.
- Implement Find Work feed (opportunities sourced from WorkOrders in demo mode / platform matching later).
- Implement Job Details route under `/sp/find-work/[id]`.
- Implement Create Estimate flow (can be demo-only initially; data model wiring later).
