# Transportation Fare Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Commission | Fare tabs on `/commission?category=transportation` so admins can view and publish transportation per-mile and minimum fare with change history.

**Architecture:** Mirror the existing append-only commission page. New service + utils parse `GET/POST admin/transportation-fare`. Fare logs table mirrors commission logs. `commission.js` gains MUI Tabs driven by `?tab=commission|fare`.

**Tech Stack:** Next.js pages, MUI Tabs/Modal/TextField, existing `Action` axios client, react-toastify

## Global Constraints

- Dollars only in the UI (`perMileRate`, `minimumFare`); do not expose cents fields
- Append-only publish — never edit old log rows
- Default tab `commission`; deep link `tab=fare` must work
- Fare tab only for transportation category
- Out of scope: full `ride-pricing-config` (waiting, wheelchair, etc.)
- No new test runner; verify with `npm run lint` and manual UI check
- Match commission.service auth/error patterns

## File map

| File | Role |
|------|------|
| `src/Services/transportation-fare.service.js` | GET/POST API wrappers |
| `src/utils/transportationFareUtils.js` | Parse response, format $, validate |
| `src/sections/commission/transportation-fare-logs-table.js` | History table |
| `src/pages/commission.js` | Tabs + fare panel + modal |

---

### Task 1: Fare service + utils

**Files:**
- Create: `src/Services/transportation-fare.service.js`
- Create: `src/utils/transportationFareUtils.js`

**Interfaces:**
- Produces:
  - `getTransportationFare({ limit })` → API response body
  - `publishTransportationFare({ perMileRate, minimumFare })` → API response body
  - `FARE_FORMULA_LABEL` string constant
  - `DEFAULT_TRANSPORTATION_FARE` `{ perMileRate: 1.45, minimumFare: 10 }`
  - `getTransportationFarePayload(response)` → `{ defaults, active, logs }`
  - `getActiveTransportationFare(payload)` → `{ perMileRate, minimumFare, pricingConfigVersion?, formula? }`
  - `getTransportationFareLogs(payload)` → array
  - `formatFareDollars(value)` → `"$1.45"` or `"—"`
  - `validateFareDollars(perMileRate, minimumFare)` → error string or `null`

- [ ] **Step 1: Create service**

```js
// src/Services/transportation-fare.service.js
import { Action } from "../config/action";

const authHeaders = () => {
  const authToken = JSON.parse(localStorage.getItem("token"));
  return { Authorization: `Bearer ${authToken}` };
};

const getApiErrorMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message.trim();
  }
  if (typeof data?.error === "string" && data.error.trim()) {
    return data.error.trim();
  }
  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message.trim();
  }
  return fallback;
};

/** GET /admin/transportation-fare */
export const getTransportationFare = async ({ limit = 50 } = {}) => {
  try {
    const params = new URLSearchParams({
      limit: String(Math.min(Number(limit) || 50, 200)),
    });
    const response = await Action.get(`admin/transportation-fare?${params.toString()}`, {
      headers: authHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("getTransportationFare error:", error?.response?.data || error.message);
    throw new Error(getApiErrorMessage(error, "Failed to load transportation fare"));
  }
};

/** POST /admin/transportation-fare — publish new version (dollars) */
export const publishTransportationFare = async ({ perMileRate, minimumFare }) => {
  try {
    const payload = {
      perMileRate: Number(perMileRate),
      minimumFare: Number(minimumFare),
    };
    const response = await Action.post("admin/transportation-fare", payload, {
      headers: authHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("publishTransportationFare error:", error?.response?.data || error.message);
    throw new Error(getApiErrorMessage(error, "Failed to publish transportation fare"));
  }
};
```

- [ ] **Step 2: Create utils**

```js
// src/utils/transportationFareUtils.js
export const FARE_FORMULA_LABEL =
  "Fare = max(minimumFare, distanceMiles × perMileRate)";

export const DEFAULT_TRANSPORTATION_FARE = {
  perMileRate: 1.45,
  minimumFare: 10,
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency",
});

export const formatFareDollars = (value) => {
  if (value == null || value === "" || Number.isNaN(Number(value))) {
    return "—";
  }
  return currencyFormatter.format(Number(value));
};

export const getTransportationFarePayload = (response) => {
  const data = response?.data && typeof response.data === "object" ? response.data : response;
  if (!data || typeof data !== "object") {
    return { defaults: DEFAULT_TRANSPORTATION_FARE, active: null, logs: [] };
  }
  return {
    defaults: data.defaults || DEFAULT_TRANSPORTATION_FARE,
    active: data.active || null,
    logs: Array.isArray(data.logs) ? data.logs : [],
  };
};

export const getActiveTransportationFare = (payloadOrResponse) => {
  const payload =
    payloadOrResponse?.defaults || payloadOrResponse?.active || payloadOrResponse?.logs
      ? payloadOrResponse
      : getTransportationFarePayload(payloadOrResponse);

  const source = payload.active || payload.defaults || DEFAULT_TRANSPORTATION_FARE;
  return {
    perMileRate: Number(source.perMileRate ?? DEFAULT_TRANSPORTATION_FARE.perMileRate),
    minimumFare: Number(source.minimumFare ?? DEFAULT_TRANSPORTATION_FARE.minimumFare),
    pricingConfigVersion: source.pricingConfigVersion ?? null,
    formula: source.formula || FARE_FORMULA_LABEL,
  };
};

export const getTransportationFareLogs = (payloadOrResponse) => {
  const payload =
    Array.isArray(payloadOrResponse?.logs)
      ? payloadOrResponse
      : getTransportationFarePayload(payloadOrResponse);
  return payload.logs;
};

export const validateFareDollars = (perMileRate, minimumFare) => {
  const mile = Number(perMileRate);
  const min = Number(minimumFare);
  if (perMileRate === "" || minimumFare === "" || Number.isNaN(mile) || Number.isNaN(min)) {
    return "Enter both per-mile rate and minimum fare";
  }
  if (mile <= 0 || min <= 0) {
    return "Rates must be greater than zero";
  }
  return null;
};
```

- [ ] **Step 3: Commit**

```bash
git add src/Services/transportation-fare.service.js src/utils/transportationFareUtils.js
git commit -m "feat: add transportation fare API helpers"
```

---

### Task 2: Fare logs table

**Files:**
- Create: `src/sections/commission/transportation-fare-logs-table.js`

**Interfaces:**
- Consumes: `formatFareDollars` from utils; `formatDateTime` from dateUtils; DataTable components
- Produces: `TransportationFareLogsTable` props `{ items, loading, onPageChange, page, title, total, actions? }`

- [ ] **Step 1: Create table** (mirror `commission-logs-table.js` columns: Previous $/mi, Updated $/mi, Previous minimum, Updated minimum, Admin, Date / time; client search optional; key `version`/`sequence`/`updatedAt`)

- [ ] **Step 2: Commit**

```bash
git add src/sections/commission/transportation-fare-logs-table.js
git commit -m "feat: add transportation fare logs table"
```

---

### Task 3: Tabs + fare panel on commission page

**Files:**
- Modify: `src/pages/commission.js`

**Interfaces:**
- Consumes: service + utils + `TransportationFareLogsTable`
- Produces: URL `?category=transportation&tab=commission|fare`

- [ ] **Step 1: Add tab constants and URL sync**

```js
const TAB_COMMISSION = "commission";
const TAB_FARE = "fare";

const resolveTab = (value) =>
  value === TAB_FARE ? TAB_FARE : TAB_COMMISSION;
```

- Read `router.query.tab` → `activeTab`
- On tab change: `router.replace({ pathname: "/commission", query: { category: activeCategory, tab } }, undefined, { shallow: true })`
- Show Tabs only when `activeCategory === SERVICE_CATEGORIES.TRANSPORTATION`
- For non-transportation (future): force commission content only

- [ ] **Step 2: Fare state + load**

- State: `fareBootLoading`, `fareTableLoading`, `fareSaving`, `fareModalOpen`, `fareActive`, `fareLogs`, `farePage`, `perMileRate`, `minimumFare`
- `loadFare` calls `getTransportationFare({ limit: Math.max(ROWS_PER_PAGE * 10, 100) })`, parse with utils, client-slice by `farePage`
- Load fare when `activeTab === TAB_FARE` (and category transportation)

- [ ] **Step 3: Wire UI**

- Header CTA: commission button only on commission tab; fare button only on fare tab
- Commission block: existing content wrapped in `activeTab === TAB_COMMISSION`
- Fare block: formula + current rates + `TransportationFareLogsTable` + modal with disabled current + editable new fields; POST via `publishTransportationFare`

- [ ] **Step 4: Lint**

Run: `npm run lint`  
Expected: no new errors in touched files

- [ ] **Step 5: Manual check**

1. `/commission?category=transportation` → Commission tab default  
2. Switch to Fare → rates + logs load  
3. Set fare → toast + new log row  
4. `/commission?category=transportation&tab=fare` deep link works  
5. Commission set rate still works

- [ ] **Step 6: Commit**

```bash
git add src/pages/commission.js
git commit -m "feat: add commission/fare tabs on transportation page"
```

---

## Spec coverage check

| Spec item | Task |
|-----------|------|
| Tabs + URL `tab` | Task 3 |
| Commission unchanged under tab | Task 3 |
| GET/POST fare API | Task 1 |
| Dollars UI + validation | Task 1 + 3 |
| Active rates + formula | Task 3 |
| Logs table columns | Task 2 |
| Deep link `tab=fare` | Task 3 |
| Out of scope ride-pricing-config | N/A (not built) |
