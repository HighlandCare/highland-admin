# Admin Commission Rate — Design

**Date:** 2026-08-20  
**Status:** Approved (pending final spec review)  
**App:** Highland Care admin dashboard (`highland-dashboard`)

## Goal

Let admins view and update platform commission rates via the Commission Rate API (`GET` / `PUT|PATCH` `/admin/commission-rate`, history via `/admin/commission-rate/history`), with a tabbed settings screen that never surfaces raw IDs in the UI.

Allowed range: **12%–28%** (default **15%**). Backend is source of truth; client validation is UX only.

## Scope (v1)

| In scope | Out of scope (v1) |
|----------|-------------------|
| Global rate load / update | Promotion-scoped overrides |
| Service-category overrides | Showing ObjectIds in any UI |
| Provider overrides (driver or restaurant by name) | New promo list APIs |
| Change history table + scope filter | Per-row “edit history” actions |
| Sidebar nav entry + toasts | |

## Information architecture

- **Route:** `/commission`
- **Nav:** “Commission” item in dashboard side nav (near Driver Earnings / Ride History), currency-style icon
- **Page layout:** Dashboard layout + page title “Commission” + MUI `Tabs`

### Tabs

1. **Global**  
   - Show current `data.global.commissionPercent`  
   - Helper text from `data.limits` (`minPercent`–`maxPercent`, default)  
   - Optional note field  
   - Save → `updateCommissionRate({ commissionPercent, scope: "global", note? })`

2. **Service category**  
   - Select: Transportation / Food & Beverage / Senior Care  
     (`transportation` | `food_beverage` | `senior_care`)  
   - Rate + optional note + Save  
   - Payload: `scope: "service_category"`, `serviceCategory`

3. **Provider**  
   - Sub-toggle: **Driver** | **Restaurant** (names only)  
   - Searchable Autocomplete / typeahead against existing list APIs (`getChap` / `getRestaurants`)  
   - Selection stores id internally for the API call only; UI shows name/email (or restaurant name) — never the id  
   - Rate + optional note + Save  
   - Payload: `scope: "provider"` + `providerId` (driver) or `restaurantId` (restaurant)

4. **History**  
   - Columns: Date, Scope, Previous %, New %, Changed by, Note  
   - Scope filter (All / global / service_category / provider) — no promotion filter until that scope ships  
   - Pagination via `limit` / `skip`  
   - Changed by shows `fullName` / `email` only

## API integration

Wire through existing `Action` axios client + admin Bearer token (same pattern as `Auth.service.js`):

| Method | Path | Purpose |
|--------|------|---------|
| GET | `admin/commission-rate` | Current global + limits (+ `serviceCategories` if returned) |
| PUT or PATCH | `admin/commission-rate` | Update rate for a scope |
| GET | `admin/commission-rate/history?limit&skip&scope` | Audit list |

Optional thin module `src/Services/commission.service.js` (or helpers on `Auth.service.js`) exporting:

- `getCommissionRate()`
- `updateCommissionRate(payload)`
- `getCommissionRateHistory({ limit, skip, scope })`

Normalize percent input: accept UI values as whole percents (`15`); if API ever returns fractions (`0.15`), display as percent.

## Error / success UX

- Success: `toast.success` with response `message` (fallback: “Commission rate updated”)
- Failure: show response `message` (especially `INVALID_COMMISSION_RATE`: “Please enter a commission percentage between 12% and 28%”)
- Disable Save while request in flight; keep form values on error

## UI / patterns

- Match existing CMS-style pages (About / Terms): `pageMainSx`, `pageContainerSx`, Loader, `react-toastify`
- Number input with `%` adornment; clamp / soft-validate to limits before submit
- History: existing DataTable / MUI Table patterns used elsewhere

## Explicit non-goals

- Do not render Stripe / Mongo / auth ids anywhere on this page  
- Do not add a Promotion tab until a promo **name** list API exists  
- Do not invent category rates client-side if GET returns empty `serviceCategories` — still allow setting by category select

## Success criteria

1. Admin can open Commission from the sidebar  
2. Global rate loads and updates within 12–28%  
3. Category and provider overrides save with correct scopes and **no IDs visible**  
4. History lists changes with human-readable actor names  
5. Out-of-range server errors surface the official message in a toast  

## Follow-ups (later)

- Promotion tab + promo searchable picker  
- Display current category/provider overrides if/when GET payload includes them  
