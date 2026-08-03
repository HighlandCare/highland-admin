# Live Operations Responsive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the live operations map, signups panel, overlays, and KPI bar usable without
overlap or page-level horizontal overflow from 320px phones through desktop screens.

**Architecture:** Keep the current inline desktop composition at MUI's `lg` breakpoint. Below
`lg`, the page owns a temporary right drawer containing the existing presentational signups panel.
CSS breakpoint values adapt the panel scrolling model, map overlays, and KPI sizing without
changing live data flow.

**Tech Stack:** Next.js 13, React 18, MUI 5 `sx` breakpoints and `Drawer`, Heroicons.

## Global Constraints

- Preserve the current desktop split layout at `lg` and wider.
- Preserve existing socket, map, filter, marker-selection, and statistics behavior.
- Keep interactive touch targets at least 40px.
- Do not redesign global dashboard navigation.
- Do not add dependencies.

---

### Task 1: Responsive page shell and signups drawer

**Files:**
- Modify: `src/pages/live-operations.js:1-25,99-125,462-710`
- Modify: `src/components/live-ops/live-ops-right-panel.js:77-266`

**Interfaces:**
- `LiveOpsRightPanel` gains optional `mobile`, `onClose`, and existing data/callback props.
- The page owns `isSignupsOpen: boolean`.
- The temporary drawer closes through backdrop, Escape, and `onClose`.

- [ ] **Step 1: Capture the failing responsive behavior**

At a 375x667 viewport, open `/live-operations` and record that the inline 360px panel competes
with the map width and has no drawer trigger. Confirm the page does not expose a mobile close
action.

- [ ] **Step 2: Add drawer state and imports**

Import `Drawer` and a compact users/list icon already available from Heroicons. Add:

```js
const [isSignupsOpen, setIsSignupsOpen] = useState(false);
```

Keep this state local to `Page`; no context or new component is needed.

- [ ] **Step 3: Make the header responsive**

Use responsive `px`, `py`, `spacing`, and typography. Render `LIVE OPERATIONS` below `sm` and
`LIVE OPERATIONS MAP` at `sm+`. Hide the clock, search shortcut, notification icon, and
single-option `Map View` button below `sm`. Add an outlined `Live Signups` button below `lg`:

```jsx
<Button
  aria-label="Open live signups"
  onClick={() => setIsSignupsOpen(true)}
  sx={{ display: { xs: "inline-flex", lg: "none" }, minWidth: 40 }}
>
  <UsersIcon width={18} />
  <Typography
    component="span"
    sx={{ display: { xs: "none", sm: "inline" }, ml: 0.75, fontSize: 12 }}
  >
    Live Signups
  </Typography>
</Button>
```

Import `UsersIcon` from `@heroicons/react/24/solid/UsersIcon`.

- [ ] **Step 4: Replace the inline panel below `lg` with a drawer**

Keep the current inline panel in a wrapper with `display: { xs: "none", lg: "block" }`. Add:

```jsx
<Drawer
  anchor="right"
  open={isSignupsOpen}
  onClose={() => setIsSignupsOpen(false)}
  PaperProps={{ sx: { width: "min(360px, 100vw)" } }}
>
  <LiveOpsRightPanel
    mobile
    onClose={() => setIsSignupsOpen(false)}
    feed={snapshot?.feed ?? []}
    stats={snapshot?.stats}
    filter={feedFilter}
    onFilterChange={setFeedFilter}
    onFeedItemClick={handleFeedItemClick}
  />
</Drawer>
```

Do not render the drawer in map fullscreen mode.

- [ ] **Step 5: Add the panel close interface**

Add a labelled 40px close `IconButton` beside the mobile panel heading and declare:

```js
mobile: PropTypes.bool,
onClose: PropTypes.func,
```

Do not show the close button in the inline desktop panel.

- [ ] **Step 6: Verify Task 1**

Run:

```bash
npx next lint --file src/pages/live-operations.js \
  --file src/components/live-ops/live-ops-right-panel.js
```

Expected: exit 0 with no errors. At 375px and 1024px, confirm the map takes full width, the
drawer opens and closes, and at 1280px the panel remains inline.

- [ ] **Step 7: Commit Task 1**

```bash
git add src/pages/live-operations.js src/components/live-ops/live-ops-right-panel.js
git commit -m "feat: add responsive live signups drawer"
```

### Task 2: Mobile panel scrolling and sticky white tabs

**Files:**
- Modify: `src/components/live-ops/live-ops-right-panel.js:95-255`

**Interfaces:**
- Consumes the `mobile` and `onClose` props introduced in Task 1.
- Produces one vertical mobile scroll container and the existing desktop nested feed scroll.

- [ ] **Step 1: Reproduce the mobile overlap**

At 320x568 with the drawer open, confirm the action button and stat cards can overlap or become
unreachable and that scrolling text can appear behind the transparent tabs row.

- [ ] **Step 2: Make the complete mobile panel scroll**

Update the panel root and sections with breakpoint values:

```js
overflowY: { xs: "auto", md: "hidden" },
overscrollBehavior: "contain",
```

On `xs/sm`, set the feed-and-button section to `flex: "0 0 auto"` and its feed list to
`overflow: "visible"`. At `md+`, retain `flex: 1`, `minHeight: 0`, and `overflow: "auto"` for
the feed. Ensure the stats section has `flexShrink: 0`.

- [ ] **Step 3: Create the sticky opaque header**

Group the heading/close row and tabs in a header box:

```jsx
<Box
  sx={{
    position: { xs: "sticky", md: "static" },
    top: 0,
    zIndex: 2,
    bgcolor: "background.paper",
    borderBottom: { xs: "1px solid", md: "none" },
    borderColor: "divider",
  }}
>
  {/* heading and tabs */}
</Box>
```

Move padding so the sticky box spans the panel's full width with no transparent gutters. Preserve
the current chip colors, and explicitly set inactive chips to `background.paper`.

- [ ] **Step 4: Keep content in normal flow**

Place the feed, empty state, and `View All Signups` button after the sticky header. Remove mobile
flex growth or negative positioning. Keep the divider and all stat cards after the top section,
with no absolute or fixed positioning.

- [ ] **Step 5: Verify Task 2**

Run:

```bash
npx next lint --file src/components/live-ops/live-ops-right-panel.js
```

Expected: exit 0. At 320x568, 375x667, and 667x375, scroll from the first feed item through the
revenue card. Confirm the sticky heading/tabs stay opaque and no button, card, or text overlaps.

- [ ] **Step 6: Commit Task 2**

```bash
git add src/components/live-ops/live-ops-right-panel.js
git commit -m "fix: prevent mobile signups panel overlap"
```

### Task 3: Responsive map overlays

**Files:**
- Modify: `src/components/live-ops/live-ops-map-overlays.js:82-405`

**Interfaces:**
- No prop changes.
- Existing overlay actions and callbacks retain their signatures.

- [ ] **Step 1: Capture overlay collisions**

At 320px and 375px widths, confirm the activity badge, centered search row, marker details,
legend, and right-side utility controls can occupy the same screen regions.

- [ ] **Step 2: Adapt the top overlays**

Hide the activity badge below `md`. Change the search stack to:

```js
top: { xs: 8, sm: 16 },
left: { xs: 8, sm: "50%" },
right: { xs: 8, sm: "auto" },
transform: { xs: "none", sm: "translateX(-50%)" },
width: { xs: "auto", sm: "calc(100% - 32px)", md: 420 },
```

Keep filter and fullscreen touch targets at least 40px.

- [ ] **Step 3: Constrain marker details**

Use `left/right` gutters at `xs`, restore the existing left positioning at `sm+`, and set:

```js
minWidth: { xs: 0, sm: 260 },
maxWidth: { xs: "none", sm: 320 },
```

Offset the card below the responsive search controls.

- [ ] **Step 4: Make the legend compact and scrollable**

At `xs/sm`, set left/right gutters, remove horizontal centering transforms, disable wrapping,
enable `overflowX: "auto"`, and keep each legend item from shrinking. Retain the centered wrapped
desktop legend at `md+`.

- [ ] **Step 5: Reposition utility controls**

Move the bottom-right controls above the mobile legend using a responsive bottom value. Hide the
duplicate fullscreen control in the top search row on `xs` if both controls cannot fit; retain one
accessible fullscreen action at every width.

- [ ] **Step 6: Verify and commit Task 3**

Run:

```bash
npx next lint --file src/components/live-ops/live-ops-map-overlays.js
```

Expected: exit 0. Verify search, filters, marker details, legend scrolling, utility controls, and
fullscreen at 320px, 375px, 768px, and 1280px.

```bash
git add src/components/live-ops/live-ops-map-overlays.js
git commit -m "fix: adapt live map overlays to small screens"
```

### Task 4: Compact mobile KPI strip

**Files:**
- Modify: `src/components/live-ops/live-ops-stats-bar.js:4-88`

**Interfaces:**
- No prop changes.

- [ ] **Step 1: Capture current KPI sizing**

At 320px, confirm the 160px minimum card width and desktop padding provide a weak indication that
more cards are horizontally scrollable.

- [ ] **Step 2: Add responsive card sizing**

Use:

```js
flex: { xs: "0 0 140px", sm: "0 0 160px", lg: "1 1 180px" },
minWidth: { xs: 140, sm: 160 },
p: { xs: 1.5, md: 2 },
```

Reduce value typography at `xs` and preserve 24px at `sm+`. Add touch-friendly momentum scrolling
and hide only the decorative scrollbar if the project already does so elsewhere.

- [ ] **Step 3: Verify and commit Task 4**

Run:

```bash
npx next lint --file src/components/live-ops/live-ops-stats-bar.js
```

Expected: exit 0. At 320px and 375px, confirm one full card plus part of the next is visible and
all cards are reachable horizontally.

```bash
git add src/components/live-ops/live-ops-stats-bar.js
git commit -m "fix: compact live operations KPI strip"
```

### Task 5: Full verification

**Files:**
- Verify only: all files modified in Tasks 1-4

- [ ] **Step 1: Run static checks**

```bash
npm run lint
npm run build
git diff --check
```

Expected: each command exits 0.

- [ ] **Step 2: Run the viewport matrix**

Check `/live-operations` at 320x568, 375x667, 667x375, 768x1024, 1024x768, and 1280x800.
For each viewport verify no page-level horizontal overflow, accessible map controls, readable
marker details, KPI horizontal scrolling, and correct drawer/inline panel behavior.

- [ ] **Step 3: Verify drawer and fullscreen interactions**

Below `lg`, open the signups drawer, change every filter, scroll to the last stat, close by button,
backdrop, and Escape, then enter and leave map fullscreen. At `lg+`, confirm the panel stays inline.

- [ ] **Step 4: Review the final diff**

```bash
git status --short
git diff --stat HEAD~4..HEAD
```

Expected: changes are limited to the live operations page and three live-ops components. Keep the
existing unrelated `package-lock.json` change out of responsive commits.
