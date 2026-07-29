# Live Operations Responsive Design

## Goal

Make the live operations screen usable without clipping or overlapping controls on modern
phones, tablets, laptops, and desktops while preserving the existing desktop design.

## Breakpoint behavior

- `lg` and wider: retain the current split layout with the map and 360px live-signups panel.
- Below `lg`: give the map the full content width and move live signups into a right-side drawer.
- `xs`: compact the header and map overlays so the layout remains usable at 320px wide.

The existing dashboard navigation behavior remains unchanged.

## Page header

- Keep the title, live status, and fullscreen action visible at every width.
- Below `sm`, shorten the title to `LIVE OPERATIONS`, hide the clock, search shortcut, notification
  icon, and single-option `Map View` button, and retain those controls at `sm` and wider.
- Use responsive spacing and typography to prevent horizontal overflow.
- Add a `Live Signups` action below `lg` that opens the right-side drawer.

## Live signups panel

- Render inline at `lg` and wider.
- Render in a temporary MUI drawer below `lg`.
- Use a width of `min(360px, 100vw)` so it fits small phones.
- Close through the drawer backdrop, Escape key, or a visible close action.
- Preserve the existing filters, feed interactions, and live-stat content.

## Map and overlays

- Keep the map as the primary, full-width workspace below `lg`.
- Hide the redundant live-activity badge on narrow screens.
- Size the search/filter row from the available viewport width.
- Constrain selected-marker details to the viewport and prevent horizontal overflow.
- Present the legend as a compact, horizontally scrollable strip on small screens.
- Reposition map utility controls so they do not overlap the legend or search controls.
- Preserve current fullscreen behavior on every breakpoint.

## KPI bar

- Continue using horizontal scrolling.
- Reduce card width, padding, and typography on small screens so the next card is partially visible
  as a scrolling cue.
- Keep desktop card sizing unchanged.

## State and data

Responsive changes affect presentation only. Existing map, socket, filter, selection, and statistics
data flows remain unchanged. The page owns the temporary drawer open state; the panel remains a
presentational component.

## Accessibility

- Keep interactive touch targets at least 40px.
- Give the drawer trigger and close action clear accessible labels.
- Retain keyboard dismissal and focus management supplied by MUI Drawer.
- Do not hide data solely because of screen width; move it into the drawer or scrolling regions.

## Verification

- Run the project lint and production build commands.
- Check widths of 320px, 375px, 768px, 1024px, and at least 1280px.
- At each width, verify no page-level horizontal overflow, usable map controls, KPI scrolling, and
  readable selected-marker details.
- Below `lg`, verify opening, interacting with, and closing the live-signups drawer.
- Verify entering and leaving map fullscreen at phone, tablet, and desktop widths.

## Scope

This work is limited to the live operations page and its live-ops components. It does not redesign
the global dashboard navigation or change live-operation data behavior.
