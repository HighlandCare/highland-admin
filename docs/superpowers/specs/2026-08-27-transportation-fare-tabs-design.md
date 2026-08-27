# Transportation Fare Tabs — Design

**Date:** 2026-08-27  
**Status:** Approved for implementation after user review of this file  
**Related:** `2026-08-20-admin-commission-rate-design.md`

## Goal

On the Transportation Platform Commission page, add tabs so admins can manage **platform commission** and **transportation fare** (per-mile + minimum) without leaving `/commission`.

Same pattern as commission: **append-only** publish — never edit old rows. Quotes use the active fare version.

## Placement

- Route stays `/commission?category=transportation`
- Add query `tab=commission|fare` (default `commission`)
- Nav item **Platform Commission → Transportation** unchanged
- Page title remains **Transportation**

## Tabs UX

| Tab | Primary CTA | Summary line | Table |
|-----|-------------|--------------|-------|
| Commission | Set platform commission | Allowed range + current % | Existing commission audit logs |
| Fare | Set transportation fare | Formula + current $/mi + minimum $ | Fare change logs |

- Switching tabs updates the URL shallowly (`tab` query) so links are shareable.
- Only the active tab’s content and CTA are shown.
- Tabs appear when `category=transportation` (current product only has transportation; if other categories appear later, fare tab can stay transportation-only).

## Fare API

**Auth:** `Authorization: Bearer <admin_jwt>` (same as commission)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/admin/transportation-fare?limit=20` | Active rates + recent logs |
| POST | `/api/v1/admin/transportation-fare` | Publish new rates |

**Formula (display):** `Fare = max(minimumFare, distanceMiles × perMileRate)`  
**Defaults:** `$1.45` / mile · `$10` minimum

**POST body (dollars — preferred in UI):**

```json
{ "perMileRate": 1.5, "minimumFare": 12 }
```

Cents pair is supported by API but not exposed in the form.

**Out of scope:** full `GET|POST /api/v1/admin/ride-pricing-config` (waiting, wheelchair, etc.).

## Fare tab — screen details

### Header / summary

- Show formula as secondary text.
- Show **Current per-mile rate** and **Current minimum fare** from `data.active` (fall back to `data.defaults` if no active config).

### Set fare modal

- Disabled: current per-mile, current minimum.
- Editable: New per-mile rate ($), New minimum fare ($).
- Validate: both required, finite numbers, `> 0`.
- Submit → POST dollars → toast success message → close → refresh GET.
- Cancel disabled while saving.

### Change logs table

Columns (from `data.logs`):

| Column | Source |
|--------|--------|
| Previous $/mi | `previousPerMileRate` |
| Updated $/mi | `currentPerMileRate` |
| Previous minimum | `previousMinimumFare` |
| Updated minimum | `currentMinimumFare` |
| Admin | `updatedByName` |
| Date | `updatedAt` |

- Newest first (API order).
- Client pagination if API returns a fixed `limit` window (reuse commission table patterns / `ROWS_PER_PAGE`).
- Optional search on admin name / amounts via existing DataTable toolbar if cheap; otherwise skip search for v1.

## Commission tab

No behavior change beyond living under the Commission tab.

## Implementation sketch

| Piece | Location |
|-------|----------|
| Service | `src/Services/transportation-fare.service.js` — `getTransportationFare`, `publishTransportationFare` |
| Utils | `src/utils/transportationFareUtils.js` — parse active/defaults/logs, format $, validate |
| Logs table | `src/sections/commission/transportation-fare-logs-table.js` |
| Page | `src/pages/commission.js` — MUI Tabs + conditional commission/fare panels |
| Optional extract | Commission panel state/UI can stay inline or move to a section component if the page gets large |

Use existing `Action.get` / `Action.post` + bearer token pattern from `commission.service.js`.

## Success criteria

1. Admin can open Transportation commission and switch Commission ↔ Fare via tabs.
2. Fare tab shows active rates and history from GET.
3. Publishing new $/mi + minimum creates a new version and refreshes the log list.
4. Commission tab still works exactly as today.
5. Deep link `?category=transportation&tab=fare` lands on Fare.

## Non-goals

- Editing historical fare or commission rows
- Cents-only form inputs
- Full ride pricing config UI
- Food / senior-care fare (API is transportation-only)
