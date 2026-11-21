# Child Vaccine Planner v1.6 — QA and Release Gate

**Status:** Release Candidate (not yet deployed/tested on the user's devices). **Baseline for rollback:** v1.5.

## What was verified
- WCAG 2.2 reference: 44×44 CSS pixels is an enhanced/AAA size; minimum AA target-size requirement differs and has exceptions. Design uses roughly 44px controls in primary mobile navigation.
- Mobile/desktop browser-level interaction run in Chromium with embedded local page assets (external localhost navigation was blocked by the test environment).
- Screen widths 390px and 1440px: mobile bottom-nav/desktop settings panel rendered, neither produced horizontal overflow in the tested chart state.
- Mobile More drawer opens and closes; desktop Settings menu opens.
- Birth-date form submits and renders 16 chart rows in the tested default combined dataset; timeline statuses were created for all 16. The optional private-product disclosure opens.
- Delayed three-dose product test: birth 2026-10-08, actual rotavirus dose 1 2027-01-20 led to dose 2 2027-02-17 and dose 3 2027-03-17 (these are arithmetic/software checks, NOT clinical approval).
- `.ics` calendar file download was triggered as `child-vaccine-planner.ics`.
- 15 HTML pages inspected, 336 local relative references resolved, zero missing local references in that check; all standalone and inline JavaScript passed Node syntax validation.
- Original v1.5 calculator JavaScript preserved byte-for-byte except one warning-message presentation adjustment that shows the user's chosen language rather than two languages in a single warning.
- Original record storage key and export handlers left unchanged.

## Remaining unverified/required before release
- Android/iPhone real-device PWA install, offline navigation, safe-area and mobile keyboard layout.
- In-device font rendering, colour contrast across all chart badges, zoom to 200%, keyboard/screen reader interactions, and 320px/768px/1024px widths.
- Lighthouse performance/accessibility scores: **not collected**; do not claim scores.
- 5–6 parent user tests: **not conducted**; do not claim results.
- Check all medical advice against current Bangladesh EPI guidance and actual product labels with qualified clinicians.
- Confirm that `.ics`, CSV, date clearing, settings and stored vaccination records behave as expected in the user's production PWA.

## Backout
A complete v1.5 ZIP is provided separately. Prefer a GitHub revert of the v1.6 commit followed by Cloudflare redeployment. Backup private child records first; never commit user records to GitHub.
