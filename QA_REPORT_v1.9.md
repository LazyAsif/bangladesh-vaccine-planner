# Child Vaccine Planner v1.9 — Mobile QA Report
Date: 25 November 2026
Release: **Candidate** (not yet deployed)

## Source
v1.8 Complete Project ZIP (the actual website source, not reconstructed from screenshots). No new third-party dependencies or framework introduced.

## High-priority fixes
1. Mobile accordion vaccine cards allowed flex children to exceed width on narrow screens. New CSS constrains the nested table, rows, detail fields and accordion toggle.
2. PWA package had broken icon and social preview references. Added 192/512 PNGs, dedicated maskable versions and lightweight preview asset.
3. The service worker precache used a single `addAll` for optional assets, causing install failure if any asset was unavailable. v1.9 requires the critical app shell first and uses settled optional caching.
4. PWA viewport and safe area; standardises viewport fit, status-bar and home indicator allowances, fixed bottom navigation and modal padding.
5. Mobile touch inputs, date controls, export buttons and completion checkboxes improved for 44px touch target goals and 16px text-entry sizes.
6. Header background now covers the entire viewport edge-to-edge and uses a restrained frosted blur; unsupported browsers retain an opaque-ish background.
7. Accessible bilingual FAQ section (three native details/summary accordions) appears on homepage only.

## Automated tests performed
- 15 HTML pages: stylesheet, script and image relative-path checks: **0 missing local references**.
- JavaScript syntax: Node `--check` across all JS and inline scripts: **passed**.
- Chromium DOM-layout emulation: widths **320, 360, 390, 430, 768, 1024, 1440**. Homepage and vaccine chart body width at or below viewport; **0 vaccine card out-of-bounds** at tested sizes.
- Bilingual FAQ: 3 panels present, native details expand/collapse works; hidden on generated chart view.
- Existing calculator regression: DOB `2026-10-08`, Rotavirus actual dose 1 `2027-01-20`, 4-week subsequent planning dates `2027-02-17` and `2027-03-17` under a three-dose example. **Passed**. Does not imply clinical eligibility.
- Accordion control state toggling verified with dispatched click; browser's synthesized click could not be fully validated in the embedded-document harness.
- 192 and 512 PNGs including maskable purposes validated to declared sizes.
- No personal data/state keys changed in source. Script loader is unchanged except added CSS and PWA asset references.

## Limits and required after-deployment tests
- Localhost navigation in this execution environment was blocked, so the scripted browser used embedded HTML/CSS/JS. One URL-construction console exception appears only because its test document has `about:blank` origin; not verified as a production error.
- **No real Android Chrome standalone or iPhone Safari installation test** was performed; notch safe areas and iOS Safari zoom must be checked on actual devices.
- **No actual network throttling or Lighthouse score** obtained.
- **No clinic/provider medical review** carried out; vaccine medical guidance is unchanged, and users must follow the EPI card and clinician advice.
- Do a real-device pass for navigation, PWA caching/offline, mobile FAQ, previous record persistence and exports before marking v1.9 Released.
