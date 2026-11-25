# QA Report — Child Vaccine Planner v1.10

## Evidence / root cause
- User screenshots show checkbox/name/toggle/status and table cells overlaid on Redmi 13C and narrow mobile browsers.
- Source inspection found pre-timeline CSS `tbody tr td:first-child { position:absolute; right:13px; top:14px; ... }` in the homepage inline stylesheet. v1.6/v1.7 converted rows to grid accordions without resetting this property. v1.9 CSS constrained widths but did not restore normal flow.

## Fix
- Scoped override: `site/assets/mobile-v1.10.css` targets only vaccine table rows at `max-width:767px`.
- Uses a vertical flex card layout; resets position, order, floats and grid placements of table cells; retains the first cell's checkbox plus toggle flex row; 44px checkbox hit target; no change to date mathematics or data-handling JavaScript.
- `site/index.html` loads this CSS after v1.9 stylesheet.
- Service worker now caches v1.10 CSS with a new cache key.

## Automated / simulated tests
- Chromium inline DOM loaded with all local CSS and JS and rendered sample vaccine chart from DOB 8 October 2026 at viewport widths 320 / 360 / 390 / 393 / 412 / 768px.
- No horizontal document overflow in these checks.
- First table cell had computed `position:static` on small screens and its bounding box ended before the vaccine detail text; no overlapping labels.
- 16 vaccination entries rendered; expanding/collapsing first card and changing an actual date did not break row count.
- Browser harness running from a synthetic origin logs a URL-construction error for an unrelated origin-dependent feature. HTTP testing was blocked by the execution environment, so end-to-end hosted PWA testing is pending.

## Outstanding real-device tests
- Redmi 13C Chrome/PWA with default and large text; 320px small Android, iPhone Safari and standalone PWA.
- Offline reload after service-worker update; saved records persistence; all date controls, theme/language and export actions; Lighthouse/accessibility testing.
- This release did not reassess vaccine medical guidance.
