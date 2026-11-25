# Child Vaccine Planner — Internal Changelog

## v1.10 — Release Candidate (25 November 2026)

### Fixed
- Critical mobile accordion overlap on Android/Redmi 13C: legacy mobile table CSS absolutely positioned the first table cell even after accordion conversion. Reset the first cell into document flow and stack all table cells as flexible vaccine cards below 768px.
- Checkbox, vaccine name, date summary and expand/collapse button no longer compete for the same space; date controls and detailed data align vertically.
- Chart cards cannot expand past the viewport; input/date wrapping remains responsive on 320–412px screens.
- Updated the PWA service-worker cache to `bd-child-vax-public-v1.10` and precached the new CSS.

### Preserved
- Vaccination calculations, age limits, product selection, clinician overrides, recorded vaccination dates, localStorage keys, bilingual labels, accordion behaviour, themes, and existing PWA features.

### Validation
- Chromium inline HTML/CSS/JS rendering tested at 320, 360, 390, 393, 412, 768px; no page horizontal overflow and no overlapping first cell/other content. 16 sample vaccination rows rendered with functional accordion open/close and an actual-dose date change.
- The local browser harness reported an invalid URL from a URL-dependent feature because the document has no hosted origin; live HTTPS Android/PWA regression is still required.
- Physical Redmi 13C and iPhone testing is pending. This is a CSS-level software fix, not a medical schedule revision.

---

## v1.9 — Release Candidate (25 November 2026)

### Fixed
- Mobile timeline accordion cards overflowing beyond the viewport on 320–390px screens; enforce min-width, wrapping and one-column vaccine detail layout.
- Narrow-screen button/input layouts, Bengali wrapping and date-picker tap targets.
- Sticky header edge/background mismatch; full-width translucent matching background with subtle blur.
- Safe-area padding in standalone PWA and fixed mobile navigation.
- Missing PWA icon (192/512) and social-preview PNG assets referenced by v1.8 package.
- Service worker install now separates critical shell from optional assets so an optional asset failing does not break initial offline registration.

### Added
- Three accessible bilingual FAQ accordions on homepage: optional vaccines, missed doses, privacy.
- Proper maskable PWA icons and updated manifest definitions.
- Mobile-first CSS override `site/assets/mobile-v1.9.css` applied to all HTML pages.

### Preserved
- All vaccine schedule arithmetic, actual-dose tracking, clinician date overrides, localStorage keys, languages, timeline accordion actions, theme, directory, export, and offline navigation.

### Validation
- HTML and asset integrity, JS syntax, mobile Chromium emulation 320/360/390/430/768px, FAQ interactions, and schedule-date regression checks. Physical Android and iPhone Safari testing remains necessary.

# Child Vaccine Planner v1.8 — Premium Healthcare UI/UX (Release Candidate)

Date: 24 November 2026  
Status: Release Candidate — not yet live or device-verified

## Added
- Original, locally stored vector hero illustration representing a parent, child and healthcare professional.
- A premium, illustration-led homepage with trust cues and the child's birth-date task given visual priority.
- A three-feature benefit row supporting personalised planning, actual-dose tracking and offline use.
- Shared visual design system in `site/assets/ui-v1.8.css`, including desktop/mobile adjustments and dark-theme styles.

## Changed
- Homepage chart form and vaccination-centre discovery restyled as a clear primary and secondary journey.
- Information page typography/cards, vaccination-timeline card appearance, settings/accordion spacing and focus states refined.
- Service-worker cache changed to `bd-child-vax-public-v1.8` and includes the new CSS and SVG.

## Preserved
- Original vaccine schedule calculations, dose intervals, recorded-date inputs, clinician overrides, localStorage keys and export/share controls.
- Existing bilingual, theme, bottom navigation, timeline accordion and PWA installation behaviour.
- Website disclaimer and existing centre directory.

## Validation
- All original inline homepage JavaScript preserved exactly.
- HTML local-path references, standalone/inline JS syntax, service worker asset list, ZIP integrity checked.
- Browser-based rendering and interaction automation blocked by runtime access restrictions; live Android/iPhone/Desktop regression testing is outstanding.
- No clinical review or Lighthouse score is claimed for this visual release.

---

# Child Vaccine Planner — Version History

## v1.7 — Release Candidate (24 November 2026)

### Added
- Each vaccine dose in the vertical timeline has its own bilingual accordion control (expand/collapse), with a compact name and planned-date summary.
- The first incomplete dose opens by default; expand/collapse state survives the chart's normal re-render cycle within the current page.
- Web browser Settings panel includes the existing Install App action (using the original browser install handler).

### Changed
- Installed standalone desktop and mobile PWAs hide the Install App option; a normal browser tab retains access to the action.
- Print/PDF layout expands compact cards for a legible complete timeline.
- Service-worker public-cache version advanced to v1.7, pre-caching new v1.7 assets.

### Preserved
- Existing vaccine dates, dose-interval logic, product selectors, actual-dose records, clinician overrides, language/theme preferences, localStorage schema and privacy model.

### Verification
- Syntax and isolated Chromium DOM interaction tests passed; live mobile installation and full regression testing remain pending.

## v1.6 — Release Candidate (21 November 2026)

### Added
- Presentation-only mobile navigation: Chart, Centres, Articles and More; safe-area padding and accessible More panel.
- Header settings menu with persistent Bangla/English and dark/light controls.
- Collapsible private vaccine product information with per-field help buttons.
- Responsive vertical vaccine timeline cards, readable completion/upcoming/overdue indicators, and government/private presentation cues.
- Print/PDF browser action, real `.ics` calendar file export, and private-data-free website sharing via Web Share API (with link-copy fallback).
- Compact sources/guidance disclosure and discreet reminder text near chart; self-contained shield/cross SVG logo.
- Local progressive install reminder after a second page visit (browser support permitting).

### Changed
- Calm light and dark CSS palettes, improved typography, spacing and mobile target sizes.
- DOB form and primary vaccination schedule action receive stronger visual priority; centre discovery becomes secondary.
- Public-facing content remains one selected language where translations exist.
- Service worker version advanced to v1.6.

### Safety and compatibility
- Preserved vaccine scheduling and date-calculation JavaScript, all dose/input IDs, saved record storage key and existing export handlers.
- No account analytics, backend or automatic sharing of child/vaccine data added.
- A complete product-label/clinical schedule audit and independent user testing remain required before public medical use.

### Status
Release Candidate, not released until verified on Cloudflare Desktop/Android/iPhone. v1.5 preserved for rollback.

---

# Child Vaccine Planner — Internal Changelog

## v1.5 — Release Candidate (21 November 2026)

### Added
- Shared Bengali/English language selector in the responsive header on every page.
- Browser-local persistent language preference (`cvp-language-v1`), used across navigation and application relaunch.
- English/Bengali localized explanatory information on articles and key informational pages, with directory listings responding to language changes.

### Changed
- Removed the calculator's duplicated language toggle; its language is now controlled by the common header.
- Improved navigation language labels, touch targets and compact mobile language controls.
- Refreshed PWA asset cache version and included the new language assets for offline use.

### Fixed / QA
- Prevented calculator language from resetting to Bangla when navigating back from other pages.
- Narrowed service-worker cache cleanup to this project's cache namespace.
- Ran static HTML references, JS syntax, combined app/calculator and browser interaction checks (see QA_REPORT.md).

### Not changed
- Vaccine rules, medical age constraints, vaccination records, provider dataset, user storage keys, export calculations and brand rules are preserved.

## v1.4 — Prior release
Responsive sticky header and compact accessible mobile navigation.

## v1.3 — Prior release
Home page links to EPI and private vaccination centre directories.

## v1.2 — Prior release
Private-centre sourced directory and removal of public-facing version metadata.

## v1.1 — Prior release
Theme switching and division/district navigation.

## v1 — Initial version baseline
Bilingual EPI/private vaccination calculator and offline PWA.
