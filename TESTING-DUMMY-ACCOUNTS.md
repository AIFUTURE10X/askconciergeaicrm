# Testing Dummy Accounts - CRM & Kanban Board

## Quick Start

```bash
npm run seed:test      # Insert 20 test orgs (prefix: "TEST - ")
npm run seed:cleanup   # Remove all test data
```

---

## 20 Test Organizations

| # | Name | Tier | Status | Billing | Extras |
|---|------|------|--------|---------|--------|
| 1 | TEST - Sunset Resort | Diamond | Active | Annual | +15 props, +30 units, CRM addon |
| 2 | TEST - Mountain Lodge | Emerald | Active | Monthly | +8 props, +20 units, CRM addon |
| 3 | TEST - Beachside Villas | Emerald | Active | Annual | +12 props |
| 4 | TEST - City Center Hotel | Sapphire | Active | Monthly | +5 props, +15 units, CRM addon |
| 5 | TEST - Harbor Inn | Sapphire | Active | Annual | +10 units |
| 6 | TEST - Palm Springs Suites | Diamond | Active | Monthly | +20 props, +50 units, CRM addon |
| 7 | TEST - Alpine Retreat | Emerald | Active | Monthly | CRM addon |
| 8 | TEST - Lakefront Cabins | Sapphire | Active | Annual | +3 props, +8 units |
| 9 | TEST - Downtown Lofts | Ruby | Active | Monthly | - |
| 10 | TEST - Seaside Cottage | Ruby | Active | Annual | - |
| 11 | TEST - Riverside B&B | Sapphire | Trialing | Monthly | - |
| 12 | TEST - Garden Hotel | Emerald | Trialing | Monthly | - |
| 13 | TEST - Hilltop Villas | Ruby | Trialing | Monthly | - |
| 14 | TEST - Royal Suites | Diamond | Trialing | Annual | - |
| 15 | TEST - Ocean Breeze | Sapphire | Past Due | Monthly | +4 props, +12 units, CRM addon |
| 16 | TEST - Maple Heights | Emerald | Past Due | Annual | +6 props |
| 17 | TEST - Silver Creek Lodge | Sapphire | Canceled | Monthly | Churn: pricing |
| 18 | TEST - Coral Bay Resort | Emerald | Canceled | Annual | Churn: competitor |
| 19 | TEST - Pine Valley Inn | Ruby | Canceled | Monthly | Churn: not_using |
| 20 | TEST - Desert Oasis | Sapphire | Expired | Monthly | Churn: not_using |

### Distribution Summary
- **Tiers:** 4 Ruby, 7 Sapphire, 6 Emerald, 3 Diamond
- **Statuses:** 10 Active, 4 Trialing, 2 Past Due, 3 Canceled, 1 Expired
- **Billing:** 12 Monthly, 8 Annual
- **CRM Add-ons:** 6 orgs
- **Churn Records:** 4 orgs (canceled + expired)
- **AI Usage:** 3 months per org (2025-12, 2026-01, 2026-02)

---

## Where Test Data Shows Up

### `/customers` - Organizations List
**Status: POPULATED**

Test what you should see:
- [ ] All 20 "TEST - " organizations appear in the list
- [ ] Filter by tier (Ruby/Sapphire/Emerald/Diamond) returns correct counts
- [ ] Filter by status (Active/Trialing/Past Due/Canceled/Expired) works
- [ ] Search "TEST -" returns all 20
- [ ] Stats bar shows updated totals (MRR, active count, trial count)
- [ ] Click into a TEST org and verify:
  - [ ] Subscription tab shows correct tier, billing period, extras
  - [ ] Usage tab shows 3 months of AI usage data
  - [ ] Owner email shows as `test-*@test.askconcierge.ai`

### `/health` - Customer Health Monitoring
**Status: POPULATED**

Test what you should see:
- [ ] Active and trialing TEST orgs appear with health scores
- [ ] Health scores vary (orgs with no properties/FAQs will score lower)
- [ ] Trialing orgs (11-14) appear in `/health/trials` with trial countdown
- [ ] Canceled orgs (17-19) show churn reasons in `/health/renewals`
- [ ] AI usage % displayed correctly per tier limit

### `/health/trials` - Trial Monitoring
- [ ] 4 trialing orgs appear (Riverside B&B, Garden Hotel, Hilltop Villas, Royal Suites)
- [ ] Trial start/end dates are staggered (7-14 days)
- [ ] Onboarding progress shows (will be low - no properties seeded)

---

## Where Test Data Does NOT Show Up

These sections use separate CRM tables (`contacts`, `deals`, `emailDrafts`) that are independent from the `organizations` table.

### `/pipeline` (Kanban Board)
**Status: NOT POPULATED**

The Kanban board reads from the `deals` table, which links to `contacts`, not `organizations`. The 20 test orgs are existing customers, not sales prospects.

> **To populate:** Seed matching contacts and deals. Example: trialing orgs could become active pipeline deals.

### `/contacts`
**Status: NOT POPULATED**

Contacts are independent CRM records (leads/prospects). No link to `organizations`.

### `/` (Dashboard)
**Status: NOT POPULATED**

Dashboard metrics (active deals, pipeline value, win rate) are computed from `deals` table.

### `/inbox`
**Status: NOT POPULATED**

Inbox reads from `emailDrafts`, which links to contacts/deals, not organizations.

---

## Architecture: Two Data Domains

The CRM has two completely separate data domains:

```
BILLING / ACCOUNT SIDE (shared DB with main app)
  organizations ─── properties ─── units
       │
       ├── organizationMembers ─── users
       ├── aiUsage
       ├── crmSubscriptions
       └── churnReasons

  Shows in: /customers, /health


SALES CRM SIDE (CRM-specific tables)
  contacts ─── deals ─── activities
       │          │
       │          ├── reminders
       │          └── emailDrafts
       └── tags

  Shows in: /pipeline, /contacts, /inbox, / (dashboard)
```

- **Contacts/Deals/Pipeline** = pre-sale leads you're working to close
- **Customers/Health** = post-sale accounts you're managing

---

## Cleanup

Run cleanup to remove all test data:

```bash
npm run seed:cleanup
```

This removes all records where:
- Organization name starts with `TEST - `
- User email matches `test-*@test.askconcierge.ai`

Associated `aiUsage`, `crmSubscriptions`, `churnReasons`, and `organizationMembers` are also deleted.

### Verify Cleanup
- [ ] `/customers` no longer shows any "TEST - " organizations
- [ ] `/health` scores recalculated without test data
- [ ] Stats bar totals return to pre-seed values
