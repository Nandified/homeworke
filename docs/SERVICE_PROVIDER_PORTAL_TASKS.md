# Service Provider Portal (NEW) — Task List
Date: 2026-05-18
Owner: Clawdbot
Goal: Rebuild the legacy **Service Provider** portal using the **new portal styling/patterns** while preserving the legacy IA/flows.

Legacy reference notes: `tmp/service_pro_video/NOTES.md`

## Definition of Done
- Matches legacy nav + flow, but with new UI kit.
- Fully functional in demo (mock-store) mode.
- Shares the same source-of-truth objects as the new platform where available (WorkOrders, Messages) and uses operator APIs when needed.

---

## 1) IA / Routes (match legacy labels)
Left nav (new):
- Find Work → `/sp/find-work`
- Messages → `/sp/messages`
- My Jobs → `/sp/my-jobs`
- Billing → `/sp/billing`
- Support → `/sp/support`
- My Account → `/sp/account`

Tasks:
- [ ] Create `SP_NAV` shared config (single source of truth)
- [ ] Remove/alias older routes (`/sp/dashboard`, `/sp/my-qtrs`, `/sp/my-bids`) if not needed, or keep but hide from nav.

---

## 2) Find Work (opportunity feed)
Tasks:
- [ ] Implement availability toggle (demo: localStorage)
- [ ] Opportunity cards:
  - [ ] slots available indicator (X/6 + progress bar)
  - [ ] zip
  - [ ] order #
  - [ ] service tags
  - [ ] estimated range
  - [ ] possible start date
  - [ ] CTA: Job Details
- [ ] Filtering/search (zip, trade)

## 3) Job Details
Tasks:
- [ ] Route: `/sp/find-work/[id]`
- [ ] Show scope items table/cards with min/max ranges
- [ ] Primary CTA: “Create estimate”

## 4) Create Estimate Flow
Tasks:
- [ ] Route: `/sp/find-work/[id]/estimate`
- [ ] Fields: possible start date, expiry date
- [ ] Estimate items CRUD: add/edit/delete
- [ ] Save draft (localStorage)
- [ ] Submit (demo: store in mock-store; later wire DB)

## 5) Messages
Tasks:
- [ ] Thread list
- [ ] Thread detail + reply composer
- [ ] Link threads to jobs when possible

## 6) My Jobs
Tasks:
- [ ] Jobs list with statuses (active/completed)
- [ ] Job detail (selected/assigned jobs)

## 7) Billing
Tasks:
- [ ] Placeholder + wiring (payments/fees later)

## 8) Support + My Account
Tasks:
- [ ] Support page parity
- [ ] My Account page parity
